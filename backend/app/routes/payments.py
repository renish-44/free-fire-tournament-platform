import os
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from datetime import datetime
from bson import ObjectId

from app.database.connection import db

router = APIRouter(prefix="/api", tags=["payments"])

UPLOAD_DIR = "uploads/payments"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.get("/registrations/{registration_id}/payment")
async def get_registration_payment_info(registration_id: str):
    reg = await db.db.registrations.find_one({"registration_id": registration_id})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
        
    t = await db.db.tournaments.find_one({"_id": ObjectId(reg["tournament_id"])})
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    payment = await db.db.payments.find_one({"registration_id": registration_id})
    
    return {
        "registration_id": reg["registration_id"],
        "registration_status": reg["status"],
        "tournament_name": t.get("name"),
        "entry_fee": t.get("entry_fee", 0),
        "upi_id": t.get("upi_id"),
        "payment_qr_url": t.get("payment_qr_url"),
        "payment_name": t.get("payment_name"),
        "payment_submitted": bool(payment),
        "payment_status": payment["status"] if payment else None
    }

@router.post("/payments")
async def submit_payment(
    registration_id: str = Form(...),
    payment_method: str = Form(...),
    payer_name: str = Form(...),
    amount_paid: float = Form(...),
    utr: str = Form(...),
    screenshot: UploadFile = File(...)
):
    if not utr.strip():
        raise HTTPException(400, "UTR / Transaction ID is required")
        
    ext = screenshot.filename.split('.')[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Invalid file type. Allowed: JPG, JPEG, PNG, WEBP")
        
    content = await screenshot.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large. Max size is 5MB.")
        
    reg = await db.db.registrations.find_one({"registration_id": registration_id})
    if not reg:
        raise HTTPException(404, "Registration not found")
        
    t = await db.db.tournaments.find_one({"_id": ObjectId(reg["tournament_id"])})
    expected_fee = t.get("entry_fee", 0)
    
    if expected_fee > 0 and amount_paid < expected_fee:
        raise HTTPException(400, f"Amount paid must be exactly or greater than ₹{expected_fee}")
        
    existing_utr = await db.db.payments.find_one({"utr": utr, "status": {"$ne": "REJECTED"}})
    if existing_utr:
        raise HTTPException(400, "This UTR has already been submitted and is not rejected.")
        
    existing_payment = await db.db.payments.find_one({"registration_id": registration_id, "status": {"$ne": "REJECTED"}})
    if existing_payment:
        raise HTTPException(400, "Payment already submitted for this registration.")
        
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, 'wb') as f:
        f.write(content)
        
    screenshot_url = f"/uploads/payments/{filename}"
    
    doc = {
        "registration_id": registration_id,
        "payment_method": payment_method,
        "payer_name": payer_name,
        "amount_paid": amount_paid,
        "utr": utr,
        "screenshot_url": screenshot_url,
        "status": "PENDING",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.db.payments.insert_one(doc)
    
    return {"message": "Payment submitted successfully"}
