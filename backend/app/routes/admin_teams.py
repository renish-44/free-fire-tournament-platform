import re
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from bson import ObjectId
from datetime import datetime
from app.database.connection import db
from app.auth.deps import get_current_admin
from app.schemas.admin import AdminResponse

router = APIRouter(prefix="/api/admin/teams", tags=["admin_teams"])

@router.get("")
async def get_teams(
    search: Optional[str] = None,
    tournament_id: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_admin: AdminResponse = Depends(get_current_admin)
):
    skip = (page - 1) * limit
    
    # We define a team as any registration that is DUO or SQUAD, or has a team_name
    pipeline = [
        {"$match": {"$or": [{"registration_type": {"$in": ["DUO", "SQUAD"]}}, {"team_name": {"$ne": None, "$ne": ""}}]}},
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
                {"team_name": search_regex},
                {"registration_id": search_regex},
                {"players.full_name": search_regex}
            ]
        })
        
    if match_conditions:
        pipeline.append({"$match": {"$and": match_conditions}})
        
    # Count total
    count_pipeline = pipeline + [{"$count": "total"}]
    count_cursor = await db.db.registrations.aggregate(count_pipeline).to_list(1)
    total_count = count_cursor[0]["total"] if count_cursor else 0
    
    # Pagination & sort
    pipeline.append({"$sort": {"created_at": -1}})
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
    teams = await cursor.to_list(length=limit)
    
    for t in teams:
        t["_id"] = str(t["_id"])
        if "tournament" in t and t["tournament"]:
            t["tournament"]["_id"] = str(t["tournament"]["_id"])
            
    return {
        "data": teams,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit
    }
