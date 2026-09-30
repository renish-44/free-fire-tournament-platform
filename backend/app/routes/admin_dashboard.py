from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from app.database.connection import db
from app.auth.deps import get_current_admin
from app.schemas.admin import AdminResponse

router = APIRouter(prefix="/api/admin/dashboard", tags=["dashboard"])

@router.get("")
async def get_dashboard_stats(current_admin: AdminResponse = Depends(get_current_admin)):
    total_tournaments = await db.db.tournaments.count_documents({})
    active_tournaments = await db.db.tournaments.count_documents({"status": "PUBLISHED"})
    
    total_registrations = await db.db.registrations.count_documents({})
    verified_registrations = await db.db.registrations.count_documents({"status": "CONFIRMED"})
    
    pending_payments = await db.db.payments.count_documents({"status": "PENDING"})
    rejected_payments = await db.db.payments.count_documents({"status": "REJECTED"})
    
    verified_payments_cursor = db.db.payments.aggregate([
        {"$match": {"status": "VERIFIED"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}}}
    ])
    verified_payments = await verified_payments_cursor.to_list(length=1)
    total_revenue = verified_payments[0]["total"] if verified_payments else 0
    
    pub_tournaments = await db.db.tournaments.find({"status": "PUBLISHED"}).to_list(length=100)
    total_slots = sum([t.get("maximum_slots", 0) for t in pub_tournaments])
    total_registered_pub = sum([t.get("registered_count", 0) for t in pub_tournaments])
    available_slots = max(0, total_slots - total_registered_pub)
    
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    regs_over_time = await db.db.registrations.aggregate([
        {"$match": {"created_at": {"$gte": seven_days_ago}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]).to_list(length=7)
    
    payments_over_time = await db.db.payments.aggregate([
        {"$match": {"created_at": {"$gte": seven_days_ago}, "status": "VERIFIED"}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "amount": {"$sum": "$amount_paid"}
            }
        },
        {"$sort": {"_id": 1}}
    ]).to_list(length=7)
    
    payment_status = await db.db.payments.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]).to_list(length=10)
    
    tourney_regs = await db.db.tournaments.aggregate([
        {"$project": {"name": 1, "registered_count": 1, "maximum_slots": 1}},
        {"$sort": {"_id": -1}},
        {"$limit": 5}
    ]).to_list(length=5)
    
    for tr in tourney_regs:
        tr["_id"] = str(tr["_id"])
    
    recent_pipeline = [
        {"$sort": {"created_at": -1}},
        {"$limit": 10},
        {
            "$addFields": {
                "converted_t_id": {"$toObjectId": "$tournament_id"}
            }
        },
        {
            "$lookup": {
                "from": "tournaments",
                "localField": "converted_t_id",
                "foreignField": "_id",
                "as": "tournament"
            }
        },
        {"$unwind": {"path": "$tournament", "preserveNullAndEmptyArrays": True}},
        {
            "$lookup": {
                "from": "payments",
                "localField": "registration_id",
                "foreignField": "registration_id",
                "as": "payment"
            }
        },
        {"$unwind": {"path": "$payment", "preserveNullAndEmptyArrays": True}},
        {
            "$project": {
                "converted_t_id": 0
            }
        }
    ]
    
    recent_regs = await db.db.registrations.aggregate(recent_pipeline).to_list(length=10)
    for r in recent_regs:
        r["_id"] = str(r["_id"])
        if "tournament" in r and r["tournament"]:
            r["tournament"]["_id"] = str(r["tournament"]["_id"])
        if "payment" in r and r["payment"]:
            r["payment"]["_id"] = str(r["payment"]["_id"])
            
    return {
        "stats": {
            "total_tournaments": total_tournaments,
            "active_tournaments": active_tournaments,
            "total_registrations": total_registrations,
            "verified_registrations": verified_registrations,
            "pending_payments": pending_payments,
            "rejected_payments": rejected_payments,
            "total_revenue": total_revenue,
            "available_slots": available_slots
        },
        "charts": {
            "registrations_over_time": regs_over_time,
            "payments_over_time": payments_over_time,
            "payment_status": payment_status,
            "tournament_registrations": tourney_regs
        },
        "recent_registrations": recent_regs
    }
