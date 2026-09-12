from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

class StudentBase(BaseModel):
    student_id: str
    roll_number: str
    name: str
    department: str
    semester: int
    email: Optional[EmailStr] = None
    batch: Optional[str] = "2022-2026"
    status: Optional[str] = "ACTIVE"

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    id: Optional[str] = None
    created_at: Optional[str] = None
    document_count: Optional[int] = 0
