import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("agent64.normalization")

class NormalizationService:
    """Normalizes document-specific extractions into standard canonical representations for institutional AI agents."""

    @staticmethod
    def build_canonical_model(
        document_id: str,
        document_type: str,
        extracted_fields: Dict[str, Any],
        file_name: str,
        overall_confidence: float,
        is_verified: bool = False,
        verified_by: Optional[str] = None
    ) -> Dict[str, Any]:
        
        student_obj = None
        academic_obj = None
        cert_obj = None
        circular_obj = None

        def get_val(f_name: str, default=None):
            f = extracted_fields.get(f_name)
            if isinstance(f, dict):
                # Prefer corrected_value if verified
                if f.get("corrected_value") is not None:
                    return f.get("corrected_value")
                return f.get("value", default)
            return f if f is not None else default

        if document_type == "MARKS_CARD":
            student_obj = {
                "student_id": get_val("student_id", "STU1001"),
                "name": get_val("student_name", "Unknown"),
                "roll_number": get_val("roll_number", "UNKNOWN")
            }
            academic_obj = {
                "semester": get_val("semester", 6),
                "academic_year": get_val("academic_year", "2025-2026"),
                "subjects": extracted_fields.get("subjects", []),
                "total_marks": get_val("total_marks", 0),
                "percentage": get_val("percentage", 0.0),
                "result": get_val("result", "PASS")
            }
        elif document_type == "ATTENDANCE_SHEET":
            if "records" in extracted_fields:
                academic_obj = {
                    "type": "BATCH_ATTENDANCE",
                    "records_count": len(extracted_fields.get("records", [])),
                    "records": extracted_fields.get("records", [])
                }
            else:
                student_obj = {
                    "name": get_val("student_name", "Unknown"),
                    "roll_number": get_val("roll_number", "UNKNOWN")
                }
                academic_obj = {
                    "semester": get_val("semester", 6),
                    "total_classes": get_val("total_classes", 0),
                    "present": get_val("present", 0),
                    "absent": get_val("absent", 0),
                    "attendance_percentage": get_val("attendance_percentage", 0.0)
                }
        elif document_type == "CERTIFICATE":
            student_obj = {
                "name": get_val("student_name", "Unknown"),
                "roll_number": get_val("roll_number", "")
            }
            cert_obj = {
                "certificate_type": get_val("certificate_type", "Merit Certificate"),
                "certificate_number": get_val("certificate_number", ""),
                "issue_date": get_val("issue_date", ""),
                "issuer": get_val("issuer", "Vignan's University"),
                "description": get_val("description", "")
            }
        elif document_type == "CIRCULAR":
            circular_obj = {
                "title": get_val("title", "Official Notice"),
                "date": get_val("date", ""),
                "department": get_val("department", "Administration"),
                "subject": get_val("subject", ""),
                "content": get_val("content", ""),
                "important_dates": extracted_fields.get("important_dates", [])
            }

        canonical_doc = {
            "document_id": document_id,
            "document_type": document_type,
            "student": student_obj,
            "academic": academic_obj,
            "certificate": cert_obj,
            "circular": circular_obj,
            "metadata": {
                "confidence": overall_confidence,
                "verified": is_verified,
                "verified_by": verified_by,
                "verified_at": datetime.utcnow().isoformat() if is_verified else None,
                "source_document": file_name,
                "source_page": 1,
                "document_type": document_type,
                "extracted_at": datetime.utcnow().isoformat()
            }
        }

        return canonical_doc

normalization_service = NormalizationService()
