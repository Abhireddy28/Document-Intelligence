from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime

class DocumentType(str, Enum):
    MARKS_CARD = "MARKS_CARD"
    ATTENDANCE_SHEET = "ATTENDANCE_SHEET"
    CERTIFICATE = "CERTIFICATE"
    CIRCULAR = "CIRCULAR"
    UNKNOWN = "UNKNOWN"

class DocumentStatus(str, Enum):
    UPLOADED = "UPLOADED"
    CLASSIFYING = "CLASSIFYING"
    PROCESSING = "PROCESSING"
    EXTRACTING = "EXTRACTING"
    VALIDATING = "VALIDATING"
    VERIFICATION_REQUIRED = "VERIFICATION_REQUIRED"
    APPROVED = "APPROVED"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"

class ExtractionMethod(str, Enum):
    DIRECT_TEXT = "DIRECT_TEXT"
    OCR = "OCR"
    TABLE_EXTRACTION = "TABLE_EXTRACTION"
    SPREADSHEET = "SPREADSHEET"
    DOCX_TEXT = "DOCX_TEXT"
    HYBRID = "HYBRID"

class TimelineStep(BaseModel):
    step: str
    status: str  # "COMPLETED", "IN_PROGRESS", "FAILED", "PENDING"
    timestamp: str
    details: Optional[str] = None

class DocumentBase(BaseModel):
    file_name: str
    file_type: str
    file_size: int
    source_path: str
    document_type: DocumentType = DocumentType.UNKNOWN
    status: DocumentStatus = DocumentStatus.UPLOADED
    processing_method: Optional[ExtractionMethod] = None
    overall_confidence: float = 0.0

class DocumentCreate(DocumentBase):
    document_id: str

class DocumentResponse(DocumentBase):
    document_id: str
    upload_date: str
    processed_date: Optional[str] = None
    processing_timeline: List[TimelineStep] = []
    error_message: Optional[str] = None
    preview_url: Optional[str] = None

class DocumentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    documents: List[DocumentResponse]
