from fastapi import APIRouter
from typing import Dict, Any, List
from datetime import datetime, timedelta
from collections import Counter
from app.database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats():
    db = get_db()
    docs_col = db.get_collection("documents")
    queue_col = db.get_collection("verification_queue")

    total_docs = await docs_col.count_documents({})
    processed = await docs_col.count_documents({"status": {"$in": ["APPROVED", "VERIFIED", "VERIFICATION_REQUIRED"]}})
    auto_approved = await docs_col.count_documents({"status": "APPROVED"})
    verified_by_human = await docs_col.count_documents({"status": "VERIFIED"})
    pending_review = await queue_col.count_documents({"status": "PENDING"})

    cursor = docs_col.find({"status": {"$in": ["APPROVED", "VERIFIED", "VERIFICATION_REQUIRED"]}})
    all_processed_docs = await cursor.to_list(500)

    if all_processed_docs:
        avg_conf = sum(d.get("overall_confidence", 0.0) for d in all_processed_docs) / len(all_processed_docs)
    else:
        avg_conf = 0.0

    return {
        "total_documents": total_docs,
        "processed": processed,
        "auto_approved": auto_approved,
        "human_verified": verified_by_human,
        "pending_verification": pending_review,
        "average_confidence": round(avg_conf * 100, 1)
    }

@router.get("/recent")
async def get_recent_documents():
    db = get_db()
    docs_col = db.get_collection("documents")
    cursor = docs_col.find({}).sort("upload_date", -1).limit(8)
    recent = await cursor.to_list(8)
    return [{k: (str(v) if k == "_id" else v) for k, v in d.items()} for d in recent]

@router.get("/charts")
async def get_dashboard_charts():
    db = get_db()
    docs_col = db.get_collection("documents")
    cursor = docs_col.find({})
    docs = await cursor.to_list(500)

    # 1. By Day (last 7 days)
    days_data = []
    for i in range(6, -1, -1):
        day_date = datetime.utcnow() - timedelta(days=i)
        day_str = day_date.strftime("%Y-%m-%d")
        target_label = day_date.strftime("%b %d")
        
        # dynamic count for this day
        count = sum(1 for d in docs if (d.get("upload_date") or "")[:10] == day_str)
        approved_count = sum(1 for d in docs if (d.get("upload_date") or "")[:10] == day_str and d.get("status") == "APPROVED")
        days_data.append({"date": target_label, "documents": count, "approved": approved_count})

    # 2. Document Type Distribution
    type_counts = Counter([d.get("document_type", "UNKNOWN") for d in docs])
    type_dist = [
        {"name": "Marks Card", "value": type_counts.get("MARKS_CARD", 0), "color": "#426FA8"},
        {"name": "Attendance Sheet", "value": type_counts.get("ATTENDANCE_SHEET", 0), "color": "#5A3A8B"},
        {"name": "Certificate", "value": type_counts.get("CERTIFICATE", 0), "color": "#39B56B"},
        {"name": "Circular", "value": type_counts.get("CIRCULAR", 0), "color": "#E5A83B"},
    ]

    # 3. Confidence Distribution Buckets
    conf_buckets = [
        {"range": "95 - 100%", "count": sum(1 for d in docs if d.get("overall_confidence", 0) >= 0.95)},
        {"range": "90 - 94%", "count": sum(1 for d in docs if 0.90 <= d.get("overall_confidence", 0) < 0.95)},
        {"range": "75 - 89%", "count": sum(1 for d in docs if 0.75 <= d.get("overall_confidence", 0) < 0.90)},
        {"range": "< 75%", "count": sum(1 for d in docs if d.get("overall_confidence", 0) < 0.75 and d.get("overall_confidence", 0) > 0)},
    ]

    # 4. Status Breakdown
    status_counts = Counter([d.get("status", "APPROVED") for d in docs])
    status_breakdown = [
        {"name": "Auto-Approved", "count": status_counts.get("APPROVED", 0), "color": "#39B56B"},
        {"name": "Human Verified", "count": status_counts.get("VERIFIED", 0), "color": "#426FA8"},
        {"name": "Verification Required", "count": status_counts.get("VERIFICATION_REQUIRED", 0), "color": "#E5A83B"},
        {"name": "Rejected", "count": status_counts.get("REJECTED", 0), "color": "#D9534F"},
    ]

    return {
        "processed_by_day": days_data,
        "type_distribution": type_dist,
        "confidence_distribution": conf_buckets,
        "status_breakdown": status_breakdown
    }
