from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel

from app.database.connection import db
from app.auth.deps import get_current_admin
from app.schemas.admin import AdminResponse

router = APIRouter(prefix="/api/admin/payments", tags=["admin_payments"])

class RejectPaymentRequest(BaseModel):
    reason: str

@router.get("")
async def get_payments(
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_admin: AdminResponse = Depends(get_current_admin)
):
    pipeline = [
        {
            "$lookup": {
                "from": "registrations",
                "localField": "registration_id",
                "foreignField": "registration_id",
                "as": "registration"
            }
        },
        {"$unwind": {"path": "$registration", "preserveNullAndEmptyArrays": True}},
        {
            "$addFields": {
                "converted_t_id": {"$toObjectId": "$registration.tournament_id"}
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
            "$project": {
                "converted_t_id": 0
            }
        }
    ]

    match_conditions = []
    
    if status:
        match_conditions.append({"status": status.upper()})
        
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        match_conditions.append({
            "$or": [
                {"registration_id": search_regex},
                {"utr": search_regex},
                {"registration.team_name": search_regex},
                {"registration.players.full_name": search_regex},
                {"registration.players.uid": search_regex}
            ]
        })
        
    if match_conditions:
        if len(match_conditions) > 1:
            pipeline.append({"$match": {"$and": match_conditions}})
        else:
            pipeline.append({"$match": match_conditions[0]})
            
    pipeline.append({"$sort": {"created_at": -1}})
    pipeline.append({"$limit": 100})
    
    cursor = db.db.payments.aggregate(pipeline)
    payments = await cursor.to_list(length=100)
    
    result = []
    for p in payments:
        p["_id"] = str(p["_id"])
        if "registration" in p:
            p["registration"]["_id"] = str(p["registration"]["_id"])
        if "tournament" in p:
            p["tournament"]["_id"] = str(p["tournament"]["_id"])
        result.append(p)
        
    return result

@router.post("/{payment_id}/verify")
async def verify_payment(payment_id: str, current_admin: AdminResponse = Depends(get_current_admin)):
    try:
        payment = await db.db.payments.find_one({"_id": ObjectId(payment_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid Payment ID format")
        
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    if payment["status"] == "VERIFIED":
        raise HTTPException(status_code=400, detail="Payment is already verified")
        
    now = datetime.utcnow()
    
    # 1. Update Payment
    await db.db.payments.update_one(
        {"_id": ObjectId(payment_id)},
        {"$set": {
            "status": "VERIFIED",
            "verified_by": current_admin.id,
            "verified_at": now,
            "updated_at": now
        }}
    )
    
    # 2. Update Registration
    reg = await db.db.registrations.find_one({"registration_id": payment["registration_id"]})
    if reg:
        old_reg_status = reg["status"]
        await db.db.registrations.update_one(
            {"_id": reg["_id"]},
            {"$set": {"status": "CONFIRMED", "updated_at": now}}
        )
        
        # 3. Status History
        await db.db.status_history.insert_one({
            "entity_type": "registration",
            "entity_id": str(reg["_id"]),
            "registration_id": reg["registration_id"],
            "old_status": old_reg_status,
            "new_status": "CONFIRMED",
            "changed_by": current_admin.id,
            "created_at": now
        })
        
    # 4. Audit Log
    await db.db.audit_logs.insert_one({
        "action": "VERIFY_PAYMENT",
        "admin_id": current_admin.id,
        "target_id": payment_id,
        "target_type": "payment",
        "created_at": now
    })
    
    return {"message": "Payment verified and registration confirmed."}

@router.post("/{payment_id}/reject")
async def reject_payment(
    payment_id: str, 
    data: RejectPaymentRequest,
    current_admin: AdminResponse = Depends(get_current_admin)
):
    if not data.reason:
        raise HTTPException(status_code=400, detail="Rejection reason is required")
        
    try:
        payment = await db.db.payments.find_one({"_id": ObjectId(payment_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid Payment ID format")
        
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    now = datetime.utcnow()
    
    # 1. Update Payment
    await db.db.payments.update_one(
        {"_id": ObjectId(payment_id)},
        {"$set": {
            "status": "REJECTED",
            "rejection_reason": data.reason,
            "verified_by": current_admin.id,
            "verified_at": now,
            "updated_at": now
        }}
    )
    
    # 2. Update Registration
    reg = await db.db.registrations.find_one({"registration_id": payment["registration_id"]})
    if reg:
        old_reg_status = reg["status"]
        await db.db.registrations.update_one(
            {"_id": reg["_id"]},
            {"$set": {"status": "PAYMENT_REJECTED", "updated_at": now}}
        )
        
        # 3. Status History
        await db.db.status_history.insert_one({
            "entity_type": "registration",
            "entity_id": str(reg["_id"]),
            "registration_id": reg["registration_id"],
            "old_status": old_reg_status,
            "new_status": "PAYMENT_REJECTED",
            "reason": data.reason,
            "changed_by": current_admin.id,
            "created_at": now
        })
        
    # 4. Audit Log
    await db.db.audit_logs.insert_one({
        "action": "REJECT_PAYMENT",
        "admin_id": current_admin.id,
        "target_id": payment_id,
        "target_type": "payment",
        "details": {"reason": data.reason},
        "created_at": now
    })
    
    return {"message": "Payment rejected."}
