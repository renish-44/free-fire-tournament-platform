from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PaymentBase(BaseModel):
    registration_id: str
    tournament_id: str
    payment_method: str  # e.g., "UPI", "Bank Transfer"
    amount: float
    utr: Optional[str] = None
    payer_name: str
    screenshot_url: Optional[str] = None
    status: str = "pending"  # pending, verified, rejected
    rejection_reason: Optional[str] = None
    
    # SECURITY NOTE: Do not store UPI PIN, OTP, card number, CVV, or banking password
    # in this schema or in the database.

class PaymentCreate(PaymentBase):
    pass

class PaymentInDB(PaymentBase):
    id: str = Field(alias="_id")
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
