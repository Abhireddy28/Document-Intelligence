from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from app.database import get_db
from app.schemas.student import StudentResponse, StudentCreate
from app.routers.auth import get_current_user

router = APIRouter(prefix="/students", tags=["Student Master Registry"])

@router.get("", response_model=List[StudentResponse])
async def list_students(
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None)
):
    db = get_db()
    students_col = db.get_collection("students")
    query = {}
    if department and department != "ALL":
        query["department"] = department
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"roll_number": {"$regex": search, "$options": "i"}},
            {"student_id": {"$regex": search, "$options": "i"}}
        ]

    cursor = students_col.find(query).sort("roll_number", 1)
    students = await cursor.to_list(100)
    
    # Calculate linked documents count
    docs_col = db.get_collection("documents")
    results = []
    for s in students:
        s_roll = s.get("roll_number")
        count = await docs_col.count_documents({"file_name": {"$regex": s_roll, "$options": "i"}})
        results.append({
            "student_id": s["student_id"],
            "roll_number": s["roll_number"],
            "name": s["name"],
            "department": s["department"],
            "semester": s.get("semester", 6),
            "email": s.get("email"),
            "batch": s.get("batch", "2022-2026"),
            "status": s.get("status", "ACTIVE"),
            "document_count": max(1, count)
        })

    return results


@router.get("/{roll_number}")
async def get_student_by_roll(roll_number: str):
    db = get_db()
    student = await db.get_collection("students").find_one({"roll_number": roll_number.upper()})
    if not student:
        raise HTTPException(status_code=404, detail=f"Student with roll number '{roll_number}' not found in registry")
    
    # Find associated extractions / canonical documents
    extractions = await db.get_collection("extractions").find({"canonical_data.student.roll_number": roll_number.upper()}).to_list(10)

    clean_student = {k: (str(v) if k == "_id" else v) for k, v in student.items()}
    clean_extractions = [{k: (str(v) if k == "_id" else v) for k, v in e.items()} for e in extractions]

    return {
        "student": clean_student,
        "linked_documents": clean_extractions
    }


@router.post("", response_model=StudentResponse)
async def create_student(student: StudentCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    students_col = db.get_collection("students")
    existing = await students_col.find_one({"roll_number": student.roll_number.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Student with this roll number already exists")

    new_stu = student.dict()
    new_stu["roll_number"] = new_stu["roll_number"].upper()
    await students_col.insert_one(new_stu)
    return new_stu
