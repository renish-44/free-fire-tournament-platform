from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from bson import ObjectId
from datetime import datetime
from app.database.connection import db
from app.auth.deps import get_current_admin
from app.schemas.admin import AdminResponse

router = APIRouter(prefix="/api/admin/players", tags=["admin_players"])

@router.get("")
async def get_players(
    search: Optional[str] = None,
    tournament_id: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_admin: AdminResponse = Depends(get_current_admin)
):
    skip = (page - 1) * limit
    
    # We extract players from the registrations array
    pipeline = [
        {"$unwind": {"path": "$players", "includeArrayIndex": "player_index"}},
        {"$match": {"players.deleted": {"$ne": True}}},
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
        {"$unwind": {"path": "$tournament", "preserveNullAndEmptyArrays": True}}
    ]
    
    match_conditions = []
    
    if tournament_id:
        match_conditions.append({"tournament_id": tournament_id})
    if status:
        match_conditions.append({"status": status.upper() if status.upper() != "PENDING" else "pending"})
        
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        match_conditions.append({
            "$or": [
                {"players.full_name": search_regex},
                {"players.ign": search_regex},
                {"players.uid": search_regex},
                {"players.email": search_regex},
                {"players.whatsapp": search_regex}
            ]
        })
        
    if match_conditions:
        pipeline.append({"$match": {"$and": match_conditions}})
        
    # Count total
    count_pipeline = pipeline + [{"$count": "total"}]
    count_cursor = await db.db.registrations.aggregate(count_pipeline).to_list(1)
    total_count = count_cursor[0]["total"] if count_cursor else 0
    
    # Pagination & sort
    pipeline.append({"$sort": {"created_at": -1, "player_index": 1}})
    pipeline.append({"$skip": skip})
    pipeline.append({"$limit": limit})
    
    pipeline.append({
        "$project": {
            "converted_t_id": 0,
            "tournament.description": 0,
            "tournament.rules": 0
        }
    })
    
    cursor = db.db.registrations.aggregate(pipeline)
    players = await cursor.to_list(length=limit)
    
    # Restructure output to make 'player' the top level concept for the frontend table
    result = []
    for doc in players:
        doc["_id"] = str(doc["_id"])
        if "tournament" in doc and doc["tournament"]:
            doc["tournament"]["_id"] = str(doc["tournament"]["_id"])
            
        player_obj = doc["players"]
        
        item = {
            "_id": f"{doc['_id']}_{doc['player_index']}",
            "registration_mongo_id": doc["_id"],
            "registration_id": doc["registration_id"],
            "player_index": doc["player_index"],
            "team_name": doc.get("team_name"),
            "registration_type": doc.get("registration_type"),
            "status": doc.get("status"),
            "tournament": doc.get("tournament"),
            "player": player_obj
        }
        result.append(item)
            
    return {
        "data": result,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit
    }

@router.delete("/{registration_mongo_id}/player/{player_index}")
async def delete_player(
    registration_mongo_id: str, 
    player_index: int, 
    current_admin: AdminResponse = Depends(get_current_admin)
):
    """
    Soft deletes a player from a registration.
    """
    try:
        reg_id = ObjectId(registration_mongo_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    reg = await db.db.registrations.find_one({"_id": reg_id})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
        
    if player_index == 0:
        raise HTTPException(status_code=400, detail="Cannot delete the team captain. Reject the entire registration instead.")
        
    if player_index >= len(reg.get("players", [])):
        raise HTTPException(status_code=404, detail="Player not found in registration")
        
    # Soft delete the specific player
    field_path = f"players.{player_index}.deleted"
    
    await db.db.registrations.update_one(
        {"_id": reg_id},
        {
            "$set": {
                field_path: True,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Audit log
    await db.db.audit_logs.insert_one({
        "action": "DELETE_PLAYER",
        "admin_id": current_admin.id,
        "target_id": registration_mongo_id,
        "target_type": "registration_player",
        "details": {"player_index": player_index},
        "created_at": datetime.utcnow()
    })
    
    return {"message": "Player successfully removed."}
