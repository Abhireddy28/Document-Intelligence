import os
import shutil
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends, BackgroundTasks
from app.config import settings
from app.database import get_db
from app.schemas.document import DocumentResponse, DocumentListResponse, DocumentStatus, DocumentType, ExtractionMethod
from app.services.pdf_extractor import pdf_extractor
from app.services.spreadsheet_extractor import spreadsheet_extractor
from app.services.word_extractor import word_extractor
from app.services.ocr_service import ocr_service
from app.services.document_classifier import document_classifier
from app.services.field_extractor import field_extractor
from app.services.normalization import normalization_service
from app.services.correction_learning import correction_learning_service
from app.routers.auth import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

def serialize_doc(d: Optional[dict]) -> Optional[dict]:
    """Helper to convert MongoDB _id into a string or remove it for JSON serialization."""
    if not d:
        return None
    res = dict(d)
    if "_id" in res:
        res["_id"] = str(res["_id"])
    return res

def resolve_source_path(file_path: str, file_name: str = "") -> str:
    """Resolves the physical file path across potential upload directories."""
    if file_path and os.path.exists(file_path):
        return file_path
    
    base_name = os.path.basename(file_path) if file_path else file_name
    candidates = [
        file_path,
        os.path.join(settings.UPLOAD_DIR, base_name),
        os.path.join(os.getcwd(), "uploads", base_name),
        os.path.join(os.getcwd(), "backend", "uploads", base_name),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads", base_name),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "backend", "uploads", base_name),
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    return file_path or os.path.join(settings.UPLOAD_DIR, base_name)

async def run_pipeline_for_document(document_id: str):
    """Executes the full automated Document Intelligence Pipeline."""
    db = get_db()
    docs_col = db.get_collection("documents")
    extractions_col = db.get_collection("extractions")
    queue_col = db.get_collection("verification_queue")
    audit_col = db.get_collection("audit_logs")

    doc = await docs_col.find_one({"document_id": document_id})
    if not doc:
        return

    timeline = []
    def add_step(name: str, status="COMPLETED", details=None):
        timeline.append({
            "step": name,
            "status": status,
            "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
            "details": details
        })

    # Step 1: Ingestion & Upload Confirmed
    add_step("Document Uploaded", details=f"File: {doc['file_name']}")

    # Step 2: Extract preliminary content / text
    file_path = resolve_source_path(doc.get("source_path", ""), doc.get("file_name", ""))
    ext = os.path.splitext(doc["file_name"])[1].lower()
    
    raw_text = ""
    tables = []
    ocr_tokens = []
    extraction_method = ExtractionMethod.DIRECT_TEXT.value

    try:
        if ext in [".pdf"]:
            pdf_data = pdf_extractor.extract(file_path)
            raw_text = pdf_data["raw_text"]
            extraction_method = pdf_data["extraction_method"]
            # Combine words from all pages for OCR tokens
            for p in pdf_data.get("pages", []):
                ocr_tokens.extend(p.get("words", []))
            
            # Extract tables with pdfplumber
            from app.services.table_extractor import table_extractor
            tables = table_extractor.extract_tables_from_pdf(file_path)

        elif ext in [".xlsx", ".xls", ".csv"]:
            sheet_data = spreadsheet_extractor.extract(file_path)
            raw_text = f"Spreadsheet data ({sheet_data['total_rows']} rows)"
            tables = [{"rows": sheet_data["records"]}]
            extraction_method = ExtractionMethod.SPREADSHEET.value

        elif ext in [".docx", ".doc"]:
            docx_data = word_extractor.extract(file_path)
            raw_text = docx_data["raw_text"]
            tables = docx_data["tables"]
            extraction_method = ExtractionMethod.DOCX_TEXT.value

        elif ext in [".jpg", ".jpeg", ".png"]:
            ocr_tokens = ocr_service.extract_from_image(file_path, page_num=1)
            raw_text = " ".join([t["text"] for t in ocr_tokens])
            extraction_method = ExtractionMethod.OCR.value

        add_step(f"Extraction Method Selected: {extraction_method}", details=f"Detected {len(ocr_tokens)} tokens / {len(tables)} tables")

        # Step 3: Classification
        classification = document_classifier.classify(doc["file_name"], raw_text, tables)
        doc_type = classification["document_type"]
        add_step(f"Document Classified: {doc_type}", details=f"Confidence: {int(classification['confidence']*100)}% ({classification.get('reason','')})")

        # Step 4: Document-Specific Field Extraction
        add_step("Field Extraction", status="IN_PROGRESS")
        extraction_res = await field_extractor.extract_and_process(
            document_id=document_id,
            file_name=doc["file_name"],
            document_type=doc_type,
            raw_text=raw_text,
            tables=tables,
            extraction_method=extraction_method,
            ocr_tokens=ocr_tokens,
            db=db
        )
        extracted_fields = extraction_res["extracted_fields"]
        overall_confidence = extraction_res["overall_confidence"]
        requires_verification = extraction_res["requires_verification"]
        add_step("Field Extraction & Validation Completed", details=f"Fields extracted with {int(overall_confidence*100)}% confidence")

        # Step 5: Canonical Model Normalization
        canonical_model = normalization_service.build_canonical_model(
            document_id=document_id,
            document_type=doc_type,
            extracted_fields=extracted_fields,
            file_name=doc["file_name"],
            overall_confidence=overall_confidence,
            is_verified=not requires_verification,
            verified_by="SYSTEM_AUTO_APPROVE" if not requires_verification else None
        )

        # Step 6: Route to Auto-Approve or Human Verification Queue
        final_status = DocumentStatus.VERIFICATION_REQUIRED.value if requires_verification else DocumentStatus.APPROVED.value
        if requires_verification:
            add_step("Human Verification Required", details="Confidence below threshold or critical field validation failed")
            # 1. If batch records exist (like attendance spreadsheet), push only failing student rows
            if "records" in extracted_fields and isinstance(extracted_fields["records"], list) and len(extracted_fields["records"]) > 0:
                for rec in extracted_fields["records"]:
                    if isinstance(rec, dict) and rec.get("validation_status") != "PASSED":
                        v_id = f"VERIF-{uuid.uuid4().hex[:8].upper()}"
                        v_item = {
                            "verification_id": v_id,
                            "document_id": document_id,
                            "file_name": doc["file_name"],
                            "document_type": doc_type,
                            "field_name": f"attendance_row_{rec.get('roll_number', 'UNKNOWN')}",
                            "field_label": f"Student Attendance: {rec.get('student_name', 'Student')} ({rec.get('roll_number', 'N/A')})",
                            "extracted_value": f"Present: {rec.get('present')}/{rec.get('total_classes')} ({rec.get('attendance_percentage')}%)",
                            "confidence": overall_confidence,
                            "validation_status": rec.get("validation_status", "FAILED"),
                            "validation_message": rec.get("validation_message", "Arithmetic integrity check failed (Present > Total Classes)"),
                            "suggested_value": rec.get("suggested_value"),
                            "source_page": 1,
                            "bbox": [100, 150, 400, 200],
                            "status": "PENDING",
                            "created_at": datetime.utcnow().isoformat()
                        }
                        await queue_col.insert_one(v_item)

            # 2. If subject marks exist (like marksheet), push only failing subjects
            elif "subjects" in extracted_fields and isinstance(extracted_fields["subjects"], list) and len(extracted_fields["subjects"]) > 0:
                for subj in extracted_fields["subjects"]:
                    if isinstance(subj, dict) and subj.get("validation_status") != "PASSED":
                        v_id = f"VERIF-{uuid.uuid4().hex[:8].upper()}"
                        v_item = {
                            "verification_id": v_id,
                            "document_id": document_id,
                            "file_name": doc["file_name"],
                            "document_type": doc_type,
                            "field_name": f"subject_{subj.get('subject_code', 'SUB')}",
                            "field_label": f"Subject: {subj.get('subject_name', 'Subject')} ({subj.get('subject_code', '')})",
                            "extracted_value": f"Total: {subj.get('total_marks')} (Int: {subj.get('internal_marks')}, Ext: {subj.get('external_marks')})",
                            "confidence": overall_confidence,
                            "validation_status": subj.get("validation_status", "FAILED"),
                            "validation_message": "Internal + External marks arithmetic mismatch",
                            "suggested_value": None,
                            "source_page": 1,
                            "bbox": [100, 200, 400, 250],
                            "status": "PENDING",
                            "created_at": datetime.utcnow().isoformat()
                        }
                        await queue_col.insert_one(v_item)

            # 3. Otherwise (Single document / Form / Certificate), push failed scalar fields
            else:
                for f_name, f_data in extracted_fields.items():
                    if f_name not in ["records", "subjects"] and isinstance(f_data, dict) and (f_data.get("validation_status") != "PASSED" or f_data.get("confidence", 1.0) < settings.CONFIDENCE_THRESHOLD):
                        v_id = f"VERIF-{uuid.uuid4().hex[:8].upper()}"
                        v_item = {
                            "verification_id": v_id,
                            "document_id": document_id,
                            "file_name": doc["file_name"],
                            "document_type": doc_type,
                            "field_name": f_name,
                            "field_label": f_name.replace("_", " ").title(),
                            "extracted_value": str(f_data.get("value", "")),
                            "confidence": overall_confidence,
                            "validation_status": f_data.get("validation_status", "FAILED"),
                            "validation_message": f_data.get("validation_message", "Low confidence or registry mismatch"),
                            "suggested_value": f_data.get("suggested_value"),
                            "source_page": 1,
                            "bbox": f_data.get("source", {}).get("bbox", [100, 100, 250, 150]) if isinstance(f_data.get("source"), dict) else [100, 100, 250, 150],
                            "status": "PENDING",
                            "created_at": datetime.utcnow().isoformat()
                        }
                        await queue_col.insert_one(v_item)
        else:
            add_step("Auto-Approved", details=f"All guardrails satisfied. Confidence {int(overall_confidence*100)}% >= {int(settings.CONFIDENCE_THRESHOLD*100)}%")

        # Update document record
        await docs_col.update_one(
            {"document_id": document_id},
            {"$set": {
                "document_type": doc_type,
                "status": final_status,
                "processing_method": extraction_method,
                "overall_confidence": overall_confidence,
                "error_message": None,
                "processed_date": datetime.utcnow().isoformat(),
                "processing_timeline": timeline
            }}
        )

        # Store extraction result
        await extractions_col.delete_one({"document_id": document_id})
        await extractions_col.insert_one({
            "document_id": document_id,
            "document_type": doc_type,
            "overall_confidence": overall_confidence,
            "extracted_fields": extracted_fields,
            "canonical_data": canonical_model,
            "raw_text": raw_text[:5000],
            "tables": tables[:5],
            "ocr_details": ocr_tokens[:100],
            "created_at": datetime.utcnow().isoformat()
        })

        # Add Audit log
        await audit_col.insert_one({
            "action": f"DOCUMENT_PROCESSED_{final_status}",
            "document_id": document_id,
            "user": "System (Agent 64)",
            "timestamp": datetime.utcnow().isoformat(),
            "details": f"Processed {doc['file_name']} -> {doc_type} with confidence {int(overall_confidence*100)}%"
        })

    except Exception as e:
        add_step("Processing Failed", status="FAILED", details=str(e))
        await docs_col.update_one(
            {"document_id": document_id},
            {"$set": {
                "status": DocumentStatus.FAILED.value,
                "error_message": str(e),
                "processing_timeline": timeline
            }}
        )


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: dict = Depends(get_current_user)
):
    # Validate extension
    allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg", ".docx", ".xlsx", ".csv"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats: PDF, PNG, JPG, DOCX, XLSX, CSV"
        )

    document_id = f"DOC-{uuid.uuid4().hex[:6].upper()}"
    saved_filename = f"{document_id}_{file.filename}"
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    saved_path = os.path.join(settings.UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Mirror to workspace root uploads/ directory if different
    root_uploads = os.path.join(os.getcwd(), "uploads")
    if os.path.abspath(root_uploads) != os.path.abspath(settings.UPLOAD_DIR):
        try:
            os.makedirs(root_uploads, exist_ok=True)
            shutil.copy(saved_path, os.path.join(root_uploads, saved_filename))
        except Exception:
            pass

    file_size = os.path.getsize(saved_path)

    doc_record = {
        "document_id": document_id,
        "file_name": file.filename,
        "file_type": ext.replace(".", "").upper(),
        "file_size": file_size,
        "source_path": saved_path,
        "document_type": DocumentType.UNKNOWN.value,
        "status": DocumentStatus.UPLOADED.value,
        "processing_method": None,
        "overall_confidence": 0.0,
        "upload_date": datetime.utcnow().isoformat(),
        "processed_date": None,
        "processing_timeline": [
            {
                "step": "Document Uploaded",
                "status": "COMPLETED",
                "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
                "details": f"Uploaded {file.filename} ({round(file_size/1024, 1)} KB)"
            }
        ],
        "preview_url": f"/uploads/{saved_filename}"
    }

    db = get_db()
    await db.get_collection("documents").insert_one(doc_record)

    # Automatically trigger processing pipeline
    await run_pipeline_for_document(document_id)

    # Return refreshed record
    refreshed = await db.get_collection("documents").find_one({"document_id": document_id})
    return serialize_doc(refreshed)


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    doc_type: Optional[str] = Query(None, alias="type"),
    status: Optional[str] = Query(None),
    min_confidence: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    db = get_db()
    docs_col = db.get_collection("documents")
    query = {}

    if doc_type and doc_type != "ALL":
        query["document_type"] = doc_type
    if status and status != "ALL":
        query["status"] = status
    if min_confidence is not None:
        query["overall_confidence"] = {"$gte": min_confidence}
    if search:
        query["$or"] = [
            {"file_name": {"$regex": search, "$options": "i"}},
            {"document_id": {"$regex": search, "$options": "i"}}
        ]

    total = await docs_col.count_documents(query)
    cursor = docs_col.find(query).sort("upload_date", -1).skip((page - 1) * page_size).limit(page_size)
    docs = await cursor.to_list(page_size)

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "documents": [serialize_doc(d) for d in docs]
    }


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str):
    db = get_db()
    doc = await db.get_collection("documents").find_one({"document_id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found")
    return serialize_doc(doc)


@router.post("/{document_id}/process")
async def process_document(document_id: str):
    db = get_db()
    doc = await db.get_collection("documents").find_one({"document_id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    await run_pipeline_for_document(document_id)
    refreshed = await db.get_collection("documents").find_one({"document_id": document_id})
    return {"message": "Processing executed successfully", "document": serialize_doc(refreshed)}


@router.post("/{document_id}/retry")
async def retry_document(document_id: str):
    return await process_document(document_id)


@router.delete("/{document_id}")
async def delete_document(document_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    docs_col = db.get_collection("documents")
    doc = await docs_col.find_one({"document_id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    await docs_col.delete_one({"document_id": document_id})
    await db.get_collection("extractions").delete_one({"document_id": document_id})
    await db.get_collection("verification_queue").delete_many({"document_id": document_id})

    # Record audit log
    await db.get_collection("audit_logs").insert_one({
        "action": "DOCUMENT_DELETED",
        "document_id": document_id,
        "user": current_user.get("name", "Admin"),
        "timestamp": datetime.utcnow().isoformat(),
        "details": f"Document {doc.get('file_name')} deleted from system"
    })

    return {"success": True, "message": f"Document {document_id} deleted"}
