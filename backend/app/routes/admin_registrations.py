from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel

from app.database.connection import db
from app.auth.deps import get_current_admin
from app.schemas.admin import AdminResponse

router = APIRouter(prefix="/api/admin/registrations", tags=["admin_registrations"])

class UpdateRegistrationRequest(BaseModel):
    status: Optional[str] = None
    players: Optional[List[Dict[str, Any]]] = None
    team_name: Optional[str] = None

@router.get("")
async def get_all_registrations(
    search: Optional[str] = None,
    tournament_id: Optional[str] = None,
    payment_status: Optional[str] = None,
    status: Optional[str] = None,
    mode: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_admin: AdminResponse = Depends(get_current_admin)
):
    skip = (page - 1) * limit

    pipeline = [
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
        {"$unwind": {"path": "$payment", "preserveNullAndEmptyArrays": True}}
    ]

    match_conditions = []

    if tournament_id:
        match_conditions.append({"tournament_id": tournament_id})
    if status:
        match_conditions.append({"status": status.upper() if status.upper() != "PENDING" else "pending"})
    if mode:
        match_conditions.append({"registration_type": mode.upper()})
    if payment_status:
        match_conditions.append({"payment.status": payment_status.upper()})

    if search:
        search_regex = {"$regex": search, "$options": "i"}
        match_conditions.append({
            "$or": [
                {"registration_id": search_regex},
                {"team_name": search_regex},
                {"players.full_name": search_regex},
                {"players.uid": search_regex},
                {"players.whatsapp": search_regex},
                {"payment.utr": search_regex}
            ]
        })

    if match_conditions:
        pipeline.append({"$match": {"$and": match_conditions}})

    # Get total count
    count_pipeline = pipeline + [{"$count": "total"}]
    count_cursor = await db.db.registrations.aggregate(count_pipeline).to_list(1)
    total_count = count_cursor[0]["total"] if count_cursor else 0

    # Add sorting and pagination
    pipeline.append({"$sort": {"created_at": -1}})
    pipeline.append({"$skip": skip})
    pipeline.append({"$limit": limit})
    
    # Remove large tournament description/rules to save bandwidth
    pipeline.append({
        "$project": {
            "converted_t_id": 0,
            "tournament.description": 0,
            "tournament.rules": 0,
            "tournament.instructions": 0
        }
    })

    cursor = db.db.registrations.aggregate(pipeline)
    registrations = await cursor.to_list(length=limit)

    for r in registrations:
        r["_id"] = str(r["_id"])
        if "tournament" in r and r["tournament"]:
            r["tournament"]["_id"] = str(r["tournament"]["_id"])
        if "payment" in r and r["payment"]:
            r["payment"]["_id"] = str(r["payment"]["_id"])

    return {
        "data": registrations,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit
    }

@router.get("/{id}")
async def get_registration_details(id: str, current_admin: AdminResponse = Depends(get_current_admin)):
    try:
        query = {"_id": ObjectId(id)}
    except:
        query = {"registration_id": id}

    reg = await db.db.registrations.find_one(query)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    reg["_id"] = str(reg["_id"])

    # Attach tournament
    if reg.get("tournament_id"):
        t = await db.db.tournaments.find_one({"_id": ObjectId(reg["tournament_id"])})
        if t:
            t["_id"] = str(t["_id"])
            reg["tournament"] = t

    # Attach payment
    payment = await db.db.payments.find_one({"registration_id": reg["registration_id"]})
    if payment:
        payment["_id"] = str(payment["_id"])
        reg["payment"] = payment

    # Attach status history
    history_cursor = db.db.status_history.find({"registration_id": reg["registration_id"]}).sort("created_at", -1)
    history = await history_cursor.to_list(100)
    for h in history:
        h["_id"] = str(h["_id"])
    reg["status_history"] = history

    return reg

@router.put("/{id}")
async def update_registration(id: str, data: UpdateRegistrationRequest, current_admin: AdminResponse = Depends(get_current_admin)):
    try:
        reg = await db.db.registrations.find_one({"_id": ObjectId(id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid Registration ID format")

    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    update_fields = {"updated_at": datetime.utcnow()}
    
    if data.team_name is not None:
        update_fields["team_name"] = data.team_name
        
    if data.players is not None:
        update_fields["players"] = data.players

    status_changed = False
    old_status = reg["status"]

    if data.status is not None and data.status != old_status:
        update_fields["status"] = data.status
        status_changed = True

    await db.db.registrations.update_one(
        {"_id": ObjectId(id)},
        {"$set": update_fields}
    )

    now = datetime.utcnow()

    if status_changed:
        await db.db.status_history.insert_one({
            "entity_type": "registration",
            "entity_id": str(reg["_id"]),
            "registration_id": reg["registration_id"],
            "old_status": old_status,
            "new_status": data.status,
            "changed_by": current_admin.id,
            "created_at": now
        })

    # Audit log
    await db.db.audit_logs.insert_one({
        "action": "UPDATE_REGISTRATION",
        "admin_id": current_admin.id,
        "target_id": id,
        "target_type": "registration",
        "details": {"status_changed": status_changed, "fields_updated": list(update_fields.keys())},
        "created_at": now
    })

    return {"message": "Registration updated successfully"}
