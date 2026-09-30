import re
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel

from app.database.connection import db
from app.auth.deps import get_current_admin
from app.schemas.admin import AdminResponse
from app.schemas.tournament_fields import TournamentFieldCreate, TournamentFieldUpdate, TournamentFieldInDB

router = APIRouter(prefix="/api/admin/tournaments", tags=["tournament_fields"])

def generate_field_name(label: str) -> str:
    # safe variable name logic
    name = re.sub(r'[^a-zA-Z0-9]+', '_', label.lower()).strip('_')
    return name

@router.get("/{id}/fields", response_model=List[TournamentFieldInDB])
async def get_fields(id: str, current_admin: AdminResponse = Depends(get_current_admin)):
    cursor = db.db.tournament_fields.find({"tournament_id": id}).sort("order", 1)
    fields = await cursor.to_list(length=100)
    for f in fields:
        f["_id"] = str(f["_id"])
    return fields

@router.post("/{id}/fields", response_model=TournamentFieldInDB)
async def create_field(
    id: str, 
    field: TournamentFieldCreate,
    current_admin: AdminResponse = Depends(get_current_admin)
):
    # Ensure tournament exists
    t = await db.db.tournaments.find_one({"_id": ObjectId(id)})
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    field_name = generate_field_name(field.label)
    if not field_name:
        raise HTTPException(status_code=400, detail="Invalid field label")
        
    # Check if field_name already exists in this tournament
    existing = await db.db.tournament_fields.find_one({"tournament_id": id, "field_name": field_name})
    if existing:
        raise HTTPException(status_code=400, detail=f"A field with name '{field_name}' already exists.")
        
    # Get max order
    last_field = await db.db.tournament_fields.find_one(
        {"tournament_id": id}, 
        sort=[("order", -1)]
    )
    new_order = (last_field["order"] + 1) if last_field else 0
    
    doc = field.model_dump()
    doc["tournament_id"] = id
    doc["field_name"] = field_name
    doc["order"] = new_order
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    
    result = await db.db.tournament_fields.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@router.put("/{id}/fields/{field_id}", response_model=TournamentFieldInDB)
async def update_field(
    id: str, 
    field_id: str, 
    field: TournamentFieldUpdate,
    current_admin: AdminResponse = Depends(get_current_admin)
):
    try:
        existing = await db.db.tournament_fields.find_one({"_id": ObjectId(field_id), "tournament_id": id})
    except:
        raise HTTPException(status_code=400, detail="Invalid Field ID")
        
    if not existing:
        raise HTTPException(status_code=404, detail="Field not found")
        
    new_field_name = generate_field_name(field.label)
    
    # Check name collision if label changed
    if new_field_name != existing["field_name"]:
        collision = await db.db.tournament_fields.find_one({
            "tournament_id": id, 
            "field_name": new_field_name, 
            "_id": {"$ne": ObjectId(field_id)}
        })
        if collision:
            raise HTTPException(status_code=400, detail=f"A field with name '{new_field_name}' already exists.")
            
    doc = field.model_dump()
    doc["field_name"] = new_field_name
    doc["updated_at"] = datetime.utcnow()
    
    await db.db.tournament_fields.update_one({"_id": ObjectId(field_id)}, {"$set": doc})
    
    updated = await db.db.tournament_fields.find_one({"_id": ObjectId(field_id)})
    updated["_id"] = str(updated["_id"])
    return updated

@router.delete("/{id}/fields/{field_id}")
async def delete_field(id: str, field_id: str, current_admin: AdminResponse = Depends(get_current_admin)):
    try:
        result = await db.db.tournament_fields.delete_one({"_id": ObjectId(field_id), "tournament_id": id})
    except:
        raise HTTPException(status_code=400, detail="Invalid Field ID")
        
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Field not found")
    return {"message": "Field deleted"}

class ReorderRequest(BaseModel):
    field_ids: List[str]

@router.post("/{id}/fields/reorder")
async def reorder_fields(id: str, req: ReorderRequest, current_admin: AdminResponse = Depends(get_current_admin)):
    # req.field_ids is an ordered list of IDs
    for index, fid in enumerate(req.field_ids):
        try:
            await db.db.tournament_fields.update_one(
                {"_id": ObjectId(fid), "tournament_id": id},
                {"$set": {"order": index, "updated_at": datetime.utcnow()}}
            )
        except:
            pass # Ignore invalid IDs
            
    return {"message": "Fields reordered"}
