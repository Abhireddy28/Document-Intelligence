from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from enum import Enum

class ValidationStatus(str, Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    WARNING = "WARNING"
    SKIPPED = "SKIPPED"

class SourceReference(BaseModel):
    document_id: str
    file_name: str
    page: int = 1
    bbox: Optional[List[float]] = None  # [x1, y1, x2, y2]
    extraction_method: Optional[str] = None
    ocr_confidence: Optional[float] = None
    raw_snippet: Optional[str] = None

class FieldConfidence(BaseModel):
    value: Any
    confidence: float
    validation_status: ValidationStatus = ValidationStatus.PASSED
    validation_message: Optional[str] = None
    source: Optional[SourceReference] = None
    suggested_value: Optional[Any] = None
    is_critical: bool = False
    is_verified: bool = False
    corrected_value: Optional[Any] = None

class SubjectMarks(BaseModel):
    subject_code: str
    subject_name: str
    internal_marks: int
    external_marks: int
    total_marks: int
    grade: str
    confidence: float = 1.0
    validation_status: ValidationStatus = ValidationStatus.PASSED

class MarksCardData(BaseModel):
    student_name: FieldConfidence
    roll_number: FieldConfidence
    student_id: Optional[FieldConfidence] = None
    semester: FieldConfidence
    academic_year: FieldConfidence
    subjects: List[SubjectMarks] = []
    total_marks: FieldConfidence
    percentage: FieldConfidence
    result: FieldConfidence

class AttendanceRecord(BaseModel):
    student_name: str
    roll_number: str
    semester: Optional[Union[str, int]] = None
    total_classes: int
    present: int
    absent: int
    attendance_percentage: float
    confidence: float = 1.0
    validation_status: ValidationStatus = ValidationStatus.PASSED
    suggested_roll_number: Optional[str] = None

class AttendanceData(BaseModel):
    student_name: Optional[FieldConfidence] = None
    roll_number: Optional[FieldConfidence] = None
    semester: Optional[FieldConfidence] = None
    total_classes: Optional[FieldConfidence] = None
    present: Optional[FieldConfidence] = None
    absent: Optional[FieldConfidence] = None
    attendance_percentage: Optional[FieldConfidence] = None
    records: Optional[List[AttendanceRecord]] = None

class CertificateData(BaseModel):
    student_name: FieldConfidence
    certificate_type: FieldConfidence
    certificate_number: FieldConfidence
    issue_date: FieldConfidence
    issuer: FieldConfidence
    description: FieldConfidence

class CircularData(BaseModel):
    title: FieldConfidence
    date: FieldConfidence
    department: FieldConfidence
    subject: FieldConfidence
    content: FieldConfidence
    important_dates: List[Dict[str, str]] = []

class CanonicalStudent(BaseModel):
    student_id: Optional[str] = None
    name: str
    roll_number: str
    department: Optional[str] = None

class CanonicalAcademic(BaseModel):
    semester: Optional[Union[str, int]] = None
    academic_year: Optional[str] = None
    subjects: Optional[List[Dict[str, Any]]] = None
    attendance: Optional[Dict[str, Any]] = None
    total_marks: Optional[int] = None
    percentage: Optional[float] = None
    result: Optional[str] = None

class CanonicalMetadata(BaseModel):
    confidence: float
    verified: bool
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    source_document: str
    source_page: int
    document_type: str
    extracted_at: str

class CanonicalDocumentModel(BaseModel):
    document_id: str
    document_type: str
    student: Optional[CanonicalStudent] = None
    academic: Optional[CanonicalAcademic] = None
    certificate: Optional[Dict[str, Any]] = None
    circular: Optional[Dict[str, Any]] = None
    metadata: CanonicalMetadata

class ExtractionResponse(BaseModel):
    document_id: str
    document_type: str
    overall_confidence: float
    validation_passed: bool
    requires_human_verification: bool
    extracted_fields: Dict[str, Any]
    canonical_data: Optional[Dict[str, Any]] = None
    raw_text: Optional[str] = None
    tables: Optional[List[Dict[str, Any]]] = None
    ocr_details: Optional[List[Dict[str, Any]]] = None
