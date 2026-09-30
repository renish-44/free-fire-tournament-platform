from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime

class Player(BaseModel):
    full_name: str
    ign: str
    uid: str
    age: Optional[int] = None
    whatsapp: Optional[str] = None
    email: Optional[EmailStr] = None
    city: Optional[str] = None

    @field_validator('uid')
    @classmethod
    def uid_must_be_numeric(cls, v: str):
        if not v.isdigit():
            raise ValueError('UID must be numeric')
        return v

class RegistrationSubmit(BaseModel):
    team_name: Optional[str] = None
    players: List[Player]
    custom_fields_data: Optional[dict] = {}

class RegistrationBase(BaseModel):
    registration_id: str
    tournament_id: str
    team_id: Optional[str] = None
    players: List[Player]
    registration_type: str  # SOLO, DUO, SQUAD
    status: str = "pending"  # pending, approved, rejected

class RegistrationCreate(RegistrationBase):
    pass

class RegistrationInDB(RegistrationBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
