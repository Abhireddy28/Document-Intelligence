import asyncio
import os
from datetime import datetime
from app.config import settings
from app.database import get_db, db_manager
from app.utils.auth import hash_password
from app.schemas.auth import UserRole

SEED_USERS = [
    {
        "_id": "usr-admin-01",
        "email": "admin@example.com",
        "name": "Dr. Ramesh Varma (Admin)",
        "password": hash_password("admin123"),
        "role": UserRole.ADMIN.value,
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "_id": "usr-verif-01",
        "email": "verifier@example.com",
        "name": "Prof. Anita Sharma (Verifier)",
        "password": hash_password("verifier123"),
        "role": UserRole.VERIFIER.value,
        "created_at": datetime.utcnow().isoformat()
    }
]

# Student Master Registry (Required reference registry for cross-referencing incoming documents)
SEED_STUDENTS = [
    {"student_id": "STU1001", "roll_number": "22CS101", "name": "Rahul Kumar", "department": "CSE", "semester": 6, "email": "rahul.kumar@vignan.ac.in", "batch": "2022-2026", "status": "ACTIVE"},
    {"student_id": "STU1002", "roll_number": "22CS102", "name": "Priya Sharma", "department": "CSE", "semester": 6, "email": "priya.s@vignan.ac.in", "batch": "2022-2026", "status": "ACTIVE"},
    {"student_id": "STU1003", "roll_number": "22CS103", "name": "Ananya Reddy", "department": "CSE", "semester": 6, "email": "ananya.r@vignan.ac.in", "batch": "2022-2026", "status": "ACTIVE"},
    {"student_id": "STU1004", "roll_number": "22CS104", "name": "Vikramaditya Rao", "department": "CSE", "semester": 6, "email": "vikram.rao@vignan.ac.in", "batch": "2022-2026", "status": "ACTIVE"},
    {"student_id": "STU1005", "roll_number": "22CS105", "name": "Sneha Patel", "department": "CSE", "semester": 6, "email": "sneha.p@vignan.ac.in", "batch": "2022-2026", "status": "ACTIVE"},
    {"student_id": "STU1006", "roll_number": "22IT101", "name": "Karthik Varma", "department": "IT", "semester": 6, "email": "karthik.v@vignan.ac.in", "batch": "2022-2026", "status": "ACTIVE"},
    {"student_id": "STU1007", "roll_number": "22IT102", "name": "Deepa Nair", "department": "IT", "semester": 6, "email": "deepa.n@vignan.ac.in", "batch": "2022-2026", "status": "ACTIVE"},
    {"student_id": "STU1008", "roll_number": "22ECE101", "name": "Rohan Gupta", "department": "ECE", "semester": 6, "email": "rohan.g@vignan.ac.in", "batch": "2022-2026", "status": "ACTIVE"},
    {"student_id": "STU1009", "roll_number": "22ECE102", "name": "Meera Joshi", "department": "ECE", "semester": 6, "email": "meera.j@vignan.ac.in", "batch": "2022-2026", "status": "ACTIVE"},
    {"student_id": "STU1010", "roll_number": "22AI101", "name": "Arjun Krishna", "department": "AI&DS", "semester": 6, "email": "arjun.k@vignan.ac.in", "batch": "2022-2026", "status": "ACTIVE"}
]

async def seed_data():
    await db_manager.connect()
    db = get_db()

    users_col = db.get_collection("users")
    students_col = db.get_collection("students")
    docs_col = db.get_collection("documents")
    extractions_col = db.get_collection("extractions")
    queue_col = db.get_collection("verification_queue")
    corrections_col = db.get_collection("corrections")
    audit_col = db.get_collection("audit_logs")

    # Clear everything
    await users_col.delete_many({})
    await students_col.delete_many({})
    await docs_col.delete_many({})
    await extractions_col.delete_many({})
    await queue_col.delete_many({})
    await corrections_col.delete_many({})
    await audit_col.delete_many({})

    # Populate only essential master database (Users & Student Master Registry)
    await users_col.insert_many(SEED_USERS)
    await students_col.insert_many(SEED_STUDENTS)

    print("Clean state initialized: Users and Student Master Registry active. Zero pre-seeded documents.")

if __name__ == "__main__":
    asyncio.run(seed_data())
