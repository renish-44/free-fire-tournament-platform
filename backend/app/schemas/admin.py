from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class AdminBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "admin"

class AdminCreate(AdminBase):
    password: str

class AdminInDB(AdminBase):
    id: str = Field(alias="_id")
    password_hash: str
    created_at: datetime
    updated_at: datetime

class AdminResponse(AdminBase):
    id: str = Field(alias="_id")
    created_at: datetime

    class Config:
        populate_by_name = True

class Token(BaseModel):
    access_token: str
    token_type: str
