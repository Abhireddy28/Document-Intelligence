from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from app.database import get_db
from app.schemas.extraction import ExtractionResponse

router = APIRouter(prefix="/documents", tags=["Extraction"])

@router.get("/{document_id}/extraction", response_model=ExtractionResponse)
async def get_document_extraction(document_id: str):
    db = get_db()
    ext = await db.get_collection("extractions").find_one({"document_id": document_id})
    if not ext:
        raise HTTPException(status_code=404, detail=f"Extraction data for document '{document_id}' not found")
    
    doc = await db.get_collection("documents").find_one({"document_id": document_id})
    requires_verif = (doc.get("status") == "VERIFICATION_REQUIRED") if doc else False
    val_passed = (doc.get("status") in ["APPROVED", "VERIFIED"]) if doc else False

    return {
        "document_id": document_id,
        "document_type": ext.get("document_type", "UNKNOWN"),
        "overall_confidence": ext.get("overall_confidence", 0.0),
        "validation_passed": val_passed,
        "requires_human_verification": requires_verif,
        "extracted_fields": ext.get("extracted_fields", {}),
        "canonical_data": ext.get("canonical_data"),
        "raw_text": ext.get("raw_text", ""),
        "tables": ext.get("tables", []),
        "ocr_details": ext.get("ocr_details", [])
    }


@router.get("/{document_id}/canonical")
async def get_canonical_data(document_id: str):
    """
    Dedicated API endpoint for external institutional AI agents to consume trusted structured data.
    """
    db = get_db()
    ext = await db.get_collection("extractions").find_one({"document_id": document_id})
    if not ext or not ext.get("canonical_data"):
        raise HTTPException(status_code=404, detail=f"Canonical model for document '{document_id}' not found")
    
    return ext.get("canonical_data")
