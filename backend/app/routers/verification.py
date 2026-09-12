from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.database import get_db
from app.schemas.verification import VerificationItem, VerificationActionRequest, VerificationActionResponse
from app.schemas.document import DocumentStatus
from app.services.correction_learning import correction_learning_service
from app.services.normalization import normalization_service
from app.routers.auth import get_current_user

router = APIRouter(prefix="/verification", tags=["Human Verification"])

@router.get("", response_model=List[VerificationItem])
async def list_verification_queue(
    status: Optional[str] = Query("PENDING"),
    document_id: Optional[str] = Query(None)
):
    db = get_db()
    queue_col = db.get_collection("verification_queue")
    query = {}
    if status and status != "ALL":
        query["status"] = status
    if document_id:
        query["document_id"] = document_id

    cursor = queue_col.find(query).sort("created_at", -1)
    items = await cursor.to_list(100)
    return items

@router.get("/{verification_id}", response_model=VerificationItem)
async def get_verification_item(verification_id: str):
    db = get_db()
    item = await db.get_collection("verification_queue").find_one({"verification_id": verification_id})
    if not item:
        raise HTTPException(status_code=404, detail="Verification item not found")
    return item

@router.post("/{verification_id}/approve", response_model=VerificationActionResponse)
async def approve_verification(
    verification_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    queue_col = db.get_collection("verification_queue")
    item = await queue_col.find_one({"verification_id": verification_id})
    if not item:
        raise HTTPException(status_code=404, detail="Verification item not found")

    user_name = current_user.get("name", "Verifier")
    
    # Mark queue item as APPROVED
    await queue_col.update_one(
        {"verification_id": verification_id},
        {"$set": {
            "status": "APPROVED",
            "verified_by": user_name,
            "verified_at": datetime.utcnow().isoformat()
        }}
    )

    # Check if all queue items for this document are resolved
    doc_id = item["document_id"]
    remaining_pending = await queue_col.count_documents({"document_id": doc_id, "status": "PENDING"})

    if remaining_pending == 0:
        await db.get_collection("documents").update_one(
            {"document_id": doc_id},
            {"$set": {"status": DocumentStatus.VERIFIED.value, "overall_confidence": 0.99}}
        )

    # Record Audit Log
    await db.get_collection("audit_logs").insert_one({
        "action": "VERIFICATION_APPROVED",
        "document_id": doc_id,
        "user": user_name,
        "timestamp": datetime.utcnow().isoformat(),
        "details": f"Approved extracted value for field '{item['field_name']}': {item['extracted_value']}"
    })

    return {
        "success": True,
        "message": f"Field '{item['field_label']}' approved by {user_name}",
        "verification_id": verification_id,
        "document_id": doc_id,
        "new_status": "APPROVED"
    }

@router.post("/{verification_id}/reject", response_model=VerificationActionResponse)
async def reject_verification(
    verification_id: str,
    request: Optional[VerificationActionRequest] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    queue_col = db.get_collection("verification_queue")
    item = await queue_col.find_one({"verification_id": verification_id})
    if not item:
        raise HTTPException(status_code=404, detail="Verification item not found")

    user_name = current_user.get("name", "Verifier")
    doc_id = item["document_id"]

    await queue_col.update_one(
        {"verification_id": verification_id},
        {"$set": {
            "status": "REJECTED",
            "verified_by": user_name,
            "verified_at": datetime.utcnow().isoformat()
        }}
    )

    # Mark document as REJECTED
    await db.get_collection("documents").update_one(
        {"document_id": doc_id},
        {"$set": {"status": DocumentStatus.REJECTED.value}}
    )

    # Record Audit Log
    await db.get_collection("audit_logs").insert_one({
        "action": "VERIFICATION_REJECTED",
        "document_id": doc_id,
        "user": user_name,
        "timestamp": datetime.utcnow().isoformat(),
        "details": f"Rejected field '{item['field_name']}' value '{item['extracted_value']}'. Reason: {request.reason if request else 'Unverifiable'}"
    })

    return {
        "success": True,
        "message": f"Document and field rejected by {user_name}",
        "verification_id": verification_id,
        "document_id": doc_id,
        "new_status": "REJECTED"
    }

@router.post("/{verification_id}/correct", response_model=VerificationActionResponse)
async def correct_verification(
    verification_id: str,
    payload: VerificationActionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Accepts suggested value or manual human correction:
    1. Updates extraction record
    2. Learns OCR character correction
    3. Rebuilds canonical data
    4. Marks verification item as CORRECTED
    5. Checks if document can transition to VERIFIED
    """
    db = get_db()
    queue_col = db.get_collection("verification_queue")
    docs_col = db.get_collection("documents")
    extractions_col = db.get_collection("extractions")

    item = await queue_col.find_one({"verification_id": verification_id})
    if not item:
        raise HTTPException(status_code=404, detail="Verification item not found")

    user_name = current_user.get("name", "Verifier")
    corrected_val = payload.corrected_value or item.get("suggested_value") or item.get("extracted_value")
    doc_id = item["document_id"]
    field_name = item["field_name"]

    # 1. Update queue item
    await queue_col.update_one(
        {"verification_id": verification_id},
        {"$set": {
            "status": "CORRECTED",
            "corrected_value": corrected_val,
            "verified_by": user_name,
            "verified_at": datetime.utcnow().isoformat()
        }}
    )

    # 2. Record in Correction Learning Service
    await correction_learning_service.record_correction(
        document_id=doc_id,
        field=field_name,
        original_value=item["extracted_value"],
        corrected_value=corrected_val,
        corrected_by=user_name,
        reason=payload.reason or "Human verification resolution"
    )

    # 3. Update extraction record & Rebuild canonical model
    ext = await extractions_col.find_one({"document_id": doc_id})
    updated_canonical = None
    if ext:
        fields = ext.get("extracted_fields", {})
        if field_name in fields and isinstance(fields[field_name], dict):
            fields[field_name]["value"] = corrected_val
            fields[field_name]["corrected_value"] = corrected_val
            fields[field_name]["confidence"] = 0.99
            fields[field_name]["validation_status"] = "PASSED"
            fields[field_name]["is_verified"] = True

        doc = await docs_col.find_one({"document_id": doc_id})
        updated_canonical = normalization_service.build_canonical_model(
            document_id=doc_id,
            document_type=ext.get("document_type", "MARKS_CARD"),
            extracted_fields=fields,
            file_name=doc.get("file_name", "document.pdf") if doc else "document.pdf",
            overall_confidence=0.99,
            is_verified=True,
            verified_by=user_name
        )

        await extractions_col.update_one(
            {"document_id": doc_id},
            {"$set": {
                "extracted_fields": fields,
                "canonical_data": updated_canonical,
                "overall_confidence": 0.99
            }}
        )

    # 4. Check remaining pending queue items for this document
    remaining_pending = await queue_col.count_documents({"document_id": doc_id, "status": "PENDING"})
    if remaining_pending == 0:
        await docs_col.update_one(
            {"document_id": doc_id},
            {"$set": {
                "status": DocumentStatus.VERIFIED.value,
                "overall_confidence": 0.99
            }}
        )

    return {
        "success": True,
        "message": f"Field '{item['field_label']}' corrected to '{corrected_val}' by {user_name}",
        "verification_id": verification_id,
        "document_id": doc_id,
        "new_status": "CORRECTED",
        "updated_canonical": updated_canonical
    }


@router.post("/document/{document_id}/approve-all")
async def approve_all_for_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Approves all pending verification items for a specific document and marks the document as VERIFIED."""
    db = get_db()
    queue_col = db.get_collection("verification_queue")
    docs_col = db.get_collection("documents")
    user_name = current_user.get("name", "Verifier")

    await queue_col.update_many(
        {"document_id": document_id, "status": "PENDING"},
        {"$set": {
            "status": "APPROVED",
            "verified_by": user_name,
            "verified_at": datetime.utcnow().isoformat()
        }}
    )

    await docs_col.update_one(
        {"document_id": document_id},
        {"$set": {"status": DocumentStatus.VERIFIED.value, "overall_confidence": 0.99}}
    )

    await db.get_collection("audit_logs").insert_one({
        "action": "DOCUMENT_VERIFIED_ALL",
        "document_id": document_id,
        "user": user_name,
        "timestamp": datetime.utcnow().isoformat(),
        "details": f"All pending fields for document {document_id} verified and approved by {user_name}"
    })

    return {"success": True, "message": f"All fields approved and document {document_id} verified"}


@router.post("/approve-all")
async def approve_all_pending(
    current_user: dict = Depends(get_current_user)
):
    """Approves all pending verification items in the entire queue."""
    db = get_db()
    queue_col = db.get_collection("verification_queue")
    docs_col = db.get_collection("documents")
    user_name = current_user.get("name", "Verifier")

    pending_items = await queue_col.find({"status": "PENDING"}).to_list(500)
    doc_ids = list(set([it["document_id"] for it in pending_items if "document_id" in it]))

    await queue_col.update_many(
        {"status": "PENDING"},
        {"$set": {
            "status": "APPROVED",
            "verified_by": user_name,
            "verified_at": datetime.utcnow().isoformat()
        }}
    )

    for doc_id in doc_ids:
        await docs_col.update_one(
            {"document_id": doc_id},
            {"$set": {"status": DocumentStatus.VERIFIED.value, "overall_confidence": 0.99}}
        )

    await db.get_collection("audit_logs").insert_one({
        "action": "QUEUE_VERIFIED_ALL",
        "user": user_name,
        "timestamp": datetime.utcnow().isoformat(),
        "details": f"Approved {len(pending_items)} pending items across {len(doc_ids)} documents"
    })

    return {"success": True, "message": f"Approved {len(pending_items)} items across {len(doc_ids)} documents"}

