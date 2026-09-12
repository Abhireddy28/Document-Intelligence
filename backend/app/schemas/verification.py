from pydantic import BaseModel
from typing import Optional, Any, List, Dict
from enum import Enum
from datetime import datetime

class VerificationItemStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CORRECTED = "CORRECTED"

class VerificationItem(BaseModel):
    verification_id: str
    document_id: str
    file_name: str
    document_type: str
    field_name: str
    field_label: str
    extracted_value: Any
    confidence: float
    validation_status: str
    validation_message: Optional[str] = None
    suggested_value: Optional[Any] = None
    source_page: int = 1
    bbox: Optional[List[float]] = None
    status: VerificationItemStatus = VerificationItemStatus.PENDING
    corrected_value: Optional[Any] = None
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    created_at: str

class VerificationActionRequest(BaseModel):
    action: Optional[str] = "APPROVE"  # "ACCEPT_SUGGESTED", "EDIT", "REJECT", "APPROVE"
    corrected_value: Optional[Any] = None
    reason: Optional[str] = None

class VerificationActionResponse(BaseModel):
    success: bool
    message: str
    verification_id: str
    document_id: str
    new_status: str
    updated_canonical: Optional[Dict[str, Any]] = None
