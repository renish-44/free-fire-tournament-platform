import pymongo
from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime, timezone

from app.database.connection import db
from app.schemas.tournament import TournamentPublic, TournamentInDB
from app.schemas.registration import RegistrationSubmit

router = APIRouter(prefix="/api/public", tags=["public"])

@router.get("/tournaments", response_model=List[TournamentInDB])
async def list_public_tournaments():
    cursor = db.db.tournaments.find({"status": {"$in": ["PUBLISHED", "CLOSED", "COMPLETED"]}}).sort("created_at", -1)
    tournaments = await cursor.to_list(length=20)
    for t in tournaments:
        t["_id"] = str(t["_id"])
    return tournaments

@router.get("/tournaments/{slug}")
async def get_tournament_by_slug(slug: str):
    t = await db.db.tournaments.find_one({"slug": slug})
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    t["_id"] = str(t["_id"])
    
    # Calculate registered count (excluding rejected)
    reg_count = await db.db.registrations.count_documents({
        "tournament_id": t["_id"], 
        "status": {"$in": ["pending", "CONFIRMED"]}
    })
    
    t["registered_count"] = reg_count
    t["available_slots"] = max(0, t.get("maximum_slots", 0) - reg_count)
    
    # Fetch active custom fields
    cursor = db.db.tournament_fields.find({"tournament_id": t["_id"], "active": True}).sort("order", 1)
    fields = await cursor.to_list(length=50)
    for f in fields:
        f["_id"] = str(f["_id"])
    
    t["custom_fields"] = fields
    
    return t

@router.post("/tournaments/{slug}/register")
async def register_for_tournament(slug: str, reg_data: RegistrationSubmit):
    # 1. Fetch tournament
    t = await db.db.tournaments.find_one({"slug": slug})
    if not t:
        raise HTTPException(404, "Tournament not found")
        
    # 2. Check conditions
    if t.get("status") != "PUBLISHED":
        raise HTTPException(400, "Tournament is not open for registration")
        
    # Convert naive to aware if necessary for comparison
    now = datetime.utcnow()
    deadline = t.get("registration_deadline")
    if deadline and deadline.tzinfo is not None:
        now = now.replace(tzinfo=timezone.utc)
        
    if now > deadline:
        raise HTTPException(400, "Registration deadline has passed")
        
    # Mode validation
    mode = t.get("mode", "SQUAD").upper()
    num_players = len(reg_data.players)
    if mode == "SOLO" and num_players != 1:
        raise HTTPException(400, "SOLO mode requires exactly 1 player")
    elif mode == "DUO" and num_players != 2:
        raise HTTPException(400, "DUO mode requires exactly 2 players")
    elif mode == "SQUAD" and num_players != 4:
        raise HTTPException(400, "SQUAD mode requires exactly 4 players")
        
    # UID Uniqueness within tournament
    uids = [p.uid for p in reg_data.players]
    if len(set(uids)) != len(uids):
        raise HTTPException(400, "Duplicate UIDs in the same registration form")
        
    existing_players = await db.db.registrations.find_one({
        "tournament_id": str(t["_id"]),
        "status": {"$in": ["pending", "CONFIRMED"]},
        "players.uid": {"$in": uids}
    })
    if existing_players:
        raise HTTPException(400, "One or more UIDs are already actively registered in this tournament")

    # 1. Validate custom fields FIRST before consuming a slot
    cursor = db.db.tournament_fields.find({"tournament_id": t["_id"], "active": True})
    custom_fields = await cursor.to_list(length=50)
    
    validated_custom_data = {}
    if custom_fields:
        for cf in custom_fields:
            field_name = cf["field_name"]
            val = reg_data.custom_fields_data.get(field_name)
            
            if cf.get("required") and (val is None or val == ""):
                raise HTTPException(400, f"Field '{cf['label']}' is required")
                
            if val is not None and val != "":
                if cf["field_type"] in ["dropdown", "radio"] and cf.get("options"):
                    if val not in cf["options"]:
                        raise HTTPException(400, f"Invalid value for '{cf['label']}'")
                elif cf["field_type"] == "number":
                    try:
                        val = float(val)
                    except:
                        raise HTTPException(400, f"Field '{cf['label']}' must be a number")
                
            validated_custom_data[field_name] = val

    # 2. DB-safe overbooking prevention using atomic update
    if "registered_count" not in t:
        count = await db.db.registrations.count_documents({"tournament_id": str(t["_id"]), "status": {"$in": ["pending", "CONFIRMED"]}})
        await db.db.tournaments.update_one({"_id": t["_id"]}, {"$set": {"registered_count": count}})
        t["registered_count"] = count

    update_result = await db.db.tournaments.update_one(
        {"_id": t["_id"], "registered_count": {"$lt": t["maximum_slots"]}},
        {"$inc": {"registered_count": 1}}
    )
    if update_result.modified_count == 0:
        raise HTTPException(400, "Registration is full")

    try:
        # Generate safe sequence ID
        seq_doc = await db.db.counters.find_one_and_update(
            {"_id": "registration_id"},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=pymongo.ReturnDocument.AFTER
        )
        year = datetime.utcnow().year
        reg_id = f"FF{year}-{seq_doc['seq']:04d}"

        # Insert registration
        doc = {
            "registration_id": reg_id,
            "tournament_id": str(t["_id"]),
            "registration_type": mode,
            "team_name": reg_data.team_name,
            "players": [p.model_dump() for p in reg_data.players],
            "custom_fields": validated_custom_data,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.db.registrations.insert_one(doc)
        
        return {
            "message": "Registration Successful",
            "registration_id": reg_id,
            "tournament": {
                "entry_fee": t.get("entry_fee", 0),
                "upi_id": t.get("upi_id"),
                "payment_qr_url": t.get("payment_qr_url"),
                "payment_name": t.get("payment_name")
            }
        }
    except Exception as e:
        # Rollback counter if insert fails
        await db.db.tournaments.update_one({"_id": t["_id"]}, {"$inc": {"registered_count": -1}})
        raise HTTPException(500, "Registration failed on server")

from bson import ObjectId

@router.get("/registrations/{registration_id}")
async def get_public_registration_status(registration_id: str):
    reg = await db.db.registrations.find_one({"registration_id": registration_id.upper()})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    try:
        t = await db.db.tournaments.find_one({"_id": ObjectId(reg["tournament_id"])})
    except:
        t = None
        
    payment = await db.db.payments.find_one({"registration_id": reg["registration_id"]})

    # Sanitize players (remove contact info for public view)
    safe_players = []
    for p in reg.get("players", []):
        if not p.get("deleted"):
            safe_players.append({
                "full_name": p.get("full_name"),
                "ign": p.get("ign"),
                "uid": p.get("uid")
            })

    # Determine reason if rejected
    rejection_reason = None
    if reg.get("status") == "PAYMENT_REJECTED":
        history = await db.db.status_history.find_one(
            {"registration_id": reg["registration_id"], "new_status": "PAYMENT_REJECTED"},
            sort=[("created_at", -1)]
        )
        if history and history.get("reason"):
            rejection_reason = history["reason"]

    return {
        "registration_id": reg["registration_id"],
        "tournament_name": t.get("name") if t else "Unknown Tournament",
        "team_name": reg.get("team_name"),
        "registration_type": reg.get("registration_type"),
        "players": safe_players,
        "registration_status": reg.get("status"),
        "payment_status": payment.get("status") if payment else "UNPAID",
        "created_at": reg.get("created_at"),
        "rejection_reason": rejection_reason
    }
