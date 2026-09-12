from fastapi import APIRouter, Query
from typing import List, Optional, Dict, Any
from app.database import get_db

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("")
async def list_audit_logs(
    document_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200)
):
    db = get_db()
    audit_col = db.get_collection("audit_logs")
    query = {}
    if document_id:
        query["document_id"] = document_id
    if action:
        query["action"] = {"$regex": action, "$options": "i"}

    cursor = audit_col.find(query).sort("timestamp", -1).limit(limit)
    logs = await cursor.to_list(limit)
    return [{k: (str(v) if k == "_id" else v) for k, v in l.items()} for l in logs]
