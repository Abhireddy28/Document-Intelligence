import pytest
import os
from app.services.document_classifier import document_classifier
from app.services.validator import validator
from app.services.confidence_engine import confidence_engine
from app.services.normalization import normalization_service
from app.services.spreadsheet_extractor import spreadsheet_extractor
from app.services.pdf_extractor import pdf_extractor
from app.database import db_manager, get_db
from app.seed.seed_database import seed_data

@pytest.mark.asyncio
async def test_classification_heuristics():
    # Test Marks Card classification
    res_marks = document_classifier.classify("marks_memo_sem6.pdf", "Vignan's University Grade Report Semester VI Internal External Total Grade")
    assert res_marks["document_type"] == "MARKS_CARD"
    assert res_marks["confidence"] >= 0.90

    # Test Attendance Sheet classification
    res_att = document_classifier.classify("attendance_cse.xlsx", "Roll Number Student Name Present Absent Total Classes Attendance Percentage")
    assert res_att["document_type"] == "ATTENDANCE_SHEET"
    assert res_att["confidence"] >= 0.90

    # Test Certificate classification
    res_cert = document_classifier.classify("merit_award.pdf", "This is to certify that Rahul Kumar has been awarded Certificate of Merit")
    assert res_cert["document_type"] == "CERTIFICATE"

    # Test Circular classification
    res_circ = document_classifier.classify("exam_schedule.docx", "Office of Controller of Examinations Circular Notification Ref No")
    assert res_circ["document_type"] == "CIRCULAR"

@pytest.mark.asyncio
async def test_validator_and_student_registry():
    await seed_data()
    db = get_db()

    # Valid roll number
    val_valid = await validator.validate_roll_number("22CS101", db)
    assert val_valid["status"] == "PASSED"
    assert val_valid["student"]["name"] == "Rahul Kumar"

    # Noisy OCR roll number (22CS10I -> Should detect OCR confusion and suggest 22CS101)
    val_noisy = await validator.validate_roll_number("22CS10I", db)
    assert val_noisy["status"] == "FAILED"
    assert val_noisy["suggested_value"] == "22CS101"
    assert "Rahul Kumar" in val_noisy["message"]

    # Subject marks arithmetic validation
    status, err = validator.validate_marks_subject(internal=28, external=64, total=92)
    assert status == "PASSED"
    assert err is None

    # Mismatch arithmetic validation
    status_fail, err_fail = validator.validate_marks_subject(internal=28, external=64, total=90)
    assert status_fail == "FAILED"
    assert "Arithmetic mismatch" in err_fail

@pytest.mark.asyncio
async def test_confidence_guardrail_enforcement():
    # Guardrail Rule 1: High confidence (>=0.90) and PASSED validation -> Auto Approved
    auto_app_allowed = confidence_engine.should_auto_approve(confidence=0.96, validation_status="PASSED")
    assert auto_app_allowed is True

    # Guardrail Rule 2: Low confidence (<0.90) -> MUST NOT auto approve
    auto_app_denied_low_conf = confidence_engine.should_auto_approve(confidence=0.61, validation_status="PASSED")
    assert auto_app_denied_low_conf is False

    # Guardrail Rule 3: High confidence but FAILED validation -> MUST NOT auto approve
    auto_app_denied_failed_val = confidence_engine.should_auto_approve(confidence=0.95, validation_status="FAILED")
    assert auto_app_denied_failed_val is False

def test_canonical_normalization():
    extracted = {
        "student_name": {"value": "Rahul Kumar"},
        "roll_number": {"value": "22CS101"},
        "semester": {"value": 6},
        "subjects": [{"subject_code": "CS301", "total_marks": 92}],
        "total_marks": {"value": 351},
        "percentage": {"value": 87.75},
        "result": {"value": "DISTINCTION"}
    }
    canonical = normalization_service.build_canonical_model(
        document_id="DOC-TEST-1",
        document_type="MARKS_CARD",
        extracted_fields=extracted,
        file_name="clean_marks_card_22CS101.pdf",
        overall_confidence=0.96,
        is_verified=True,
        verified_by="SYSTEM_AUTO_APPROVE"
    )
    assert canonical["student"]["roll_number"] == "22CS101"
    assert canonical["student"]["name"] == "Rahul Kumar"
    assert canonical["academic"]["percentage"] == 87.75
    assert canonical["metadata"]["confidence"] == 0.96
    assert canonical["metadata"]["verified"] is True
