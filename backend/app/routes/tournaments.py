import re
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId

from app.database.connection import db
from app.auth.deps import get_current_admin
from app.schemas.admin import AdminResponse
from app.schemas.tournament import TournamentCreate, TournamentUpdate, TournamentInDB

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])

def generate_slug(name: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return slug

async def ensure_unique_slug(base_slug: str, exclude_id: str = None) -> str:
    slug = base_slug
    counter = 1
    while True:
        query = {"slug": slug}
        if exclude_id:
            query["_id"] = {"$ne": ObjectId(exclude_id)}
        existing = await db.db.tournaments.find_one(query)
        if not existing:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1

@router.post("", response_model=TournamentInDB)
async def create_tournament(
    tournament: TournamentCreate,
    current_admin: AdminResponse = Depends(get_current_admin)
):
    base_slug = generate_slug(tournament.name)
    slug = await ensure_unique_slug(base_slug)
    
    doc = tournament.model_dump()
    doc["slug"] = slug
    doc["status"] = "DRAFT"
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    
    result = await db.db.tournaments.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@router.get("", response_model=List[TournamentInDB])
async def list_tournaments(current_admin: AdminResponse = Depends(get_current_admin)):
    cursor = db.db.tournaments.find().sort("created_at", -1)
    tournaments = await cursor.to_list(length=100)
    for t in tournaments:
        t["_id"] = str(t["_id"])
    return tournaments

@router.get("/{id}", response_model=TournamentInDB)
async def get_tournament(id: str, current_admin: AdminResponse = Depends(get_current_admin)):
    try:
        t = await db.db.tournaments.find_one({"_id": ObjectId(id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
    t["_id"] = str(t["_id"])
    return t

@router.put("/{id}", response_model=TournamentInDB)
async def update_tournament(
    id: str,
    tournament: TournamentUpdate,
    current_admin: AdminResponse = Depends(get_current_admin)
):
    try:
        existing = await db.db.tournaments.find_one({"_id": ObjectId(id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    if not existing:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    doc = tournament.model_dump()
    
    # Handle slug updates if name changed
    if tournament.name != existing.get("name"):
        base_slug = generate_slug(tournament.name)
        doc["slug"] = await ensure_unique_slug(base_slug, id)
    else:
        doc["slug"] = existing["slug"]
        
    doc["status"] = existing["status"] # Preserve status
    doc["created_at"] = existing["created_at"]
    doc["updated_at"] = datetime.utcnow()
    
    await db.db.tournaments.update_one({"_id": ObjectId(id)}, {"$set": doc})
    
    updated = await db.db.tournaments.find_one({"_id": ObjectId(id)})
    updated["_id"] = str(updated["_id"])
    return updated

@router.delete("/{id}")
async def delete_tournament(id: str, current_admin: AdminResponse = Depends(get_current_admin)):
    try:
        result = await db.db.tournaments.delete_one({"_id": ObjectId(id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return {"message": "Tournament deleted successfully"}

@router.post("/{id}/publish")
async def publish_tournament(id: str, current_admin: AdminResponse = Depends(get_current_admin)):
    try:
        t = await db.db.tournaments.find_one({"_id": ObjectId(id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    # Validation
    required_fields = ["name", "mode", "tournament_date", "start_time", 
                       "registration_start", "registration_deadline", 
                       "maximum_slots", "organizer_name", "organizer_contact"]
                       
    missing = [f for f in required_fields if not t.get(f)]
    if missing:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot publish. Missing required fields: {', '.join(missing)}"
        )
        
    if t.get("entry_fee", 0) > 0:
        if not t.get("upi_id") and not t.get("payment_qr_url"):
            raise HTTPException(
                status_code=400,
                detail="Cannot publish. Paid tournaments require UPI ID or Payment QR."
            )
            
    await db.db.tournaments.update_one(
        {"_id": ObjectId(id)}, 
        {"$set": {"status": "PUBLISHED", "updated_at": datetime.utcnow()}}
    )
    return {"message": "Tournament published successfully"}

@router.post("/{id}/close")
async def close_tournament(id: str, current_admin: AdminResponse = Depends(get_current_admin)):
    try:
        result = await db.db.tournaments.update_one(
            {"_id": ObjectId(id)}, 
            {"$set": {"status": "CLOSED", "updated_at": datetime.utcnow()}}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    if result.modified_count == 0:
        # Check if exists
        exists = await db.db.tournaments.find_one({"_id": ObjectId(id)})
        if not exists:
            raise HTTPException(status_code=404, detail="Tournament not found")
            
    return {"message": "Tournament closed successfully"}

from fastapi import UploadFile, File
import os
import uuid
import aiofiles
import qrcode
import io
from fastapi.responses import Response

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def validate_image(file: UploadFile):
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension not allowed. Use {ALLOWED_EXTENSIONS}")
    return ext

@router.post("/{id}/upload-poster")
async def upload_poster(id: str, file: UploadFile = File(...), current_admin: AdminResponse = Depends(get_current_admin)):
    try:
        t_id = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Tournament ID")
        
    ext = validate_image(file)
    filename = f"poster_{uuid.uuid4().hex}.{ext}"
    os.makedirs("uploads/posters", exist_ok=True)
    filepath = f"uploads/posters/{filename}"
    
    async with aiofiles.open(filepath, 'wb') as out_file:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Max 5MB.")
        await out_file.write(content)
        
    url = f"/uploads/posters/{filename}"
    await db.db.tournaments.update_one({"_id": t_id}, {"$set": {"poster_url": url}})
    return {"message": "Poster uploaded", "url": url}

@router.post("/{id}/upload-qr")
async def upload_payment_qr(id: str, file: UploadFile = File(...), current_admin: AdminResponse = Depends(get_current_admin)):
    try:
        t_id = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Tournament ID")
        
    ext = validate_image(file)
    filename = f"paymentqr_{uuid.uuid4().hex}.{ext}"
    os.makedirs("uploads/qrs", exist_ok=True)
    filepath = f"uploads/qrs/{filename}"
    
    async with aiofiles.open(filepath, 'wb') as out_file:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Max 5MB.")
        await out_file.write(content)
        
    url = f"/uploads/qrs/{filename}"
    await db.db.tournaments.update_one({"_id": t_id}, {"$set": {"payment_qr_url": url}})
    return {"message": "Payment QR uploaded", "url": url}

@router.get("/{id}/registration-qr")
async def get_registration_qr(id: str, frontend_url: str):
    try:
        t_id = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Tournament ID")
        
    t = await db.db.tournaments.find_one({"_id": t_id})
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    link = f"{frontend_url}/tournament/{t['slug']}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(link)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")
