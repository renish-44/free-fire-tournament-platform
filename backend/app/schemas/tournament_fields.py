from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class TournamentFieldBase(BaseModel):
    label: str
    field_type: str  # text, textarea, number, email, phone, dropdown, radio, checkbox, date, file
    required: bool = False
    placeholder: Optional[str] = None
    description: Optional[str] = None
    options: Optional[List[str]] = []  # For dropdown, radio, checkbox
    validation: Optional[Dict[str, Any]] = {}
    active: bool = True

class TournamentFieldCreate(TournamentFieldBase):
    pass

class TournamentFieldUpdate(TournamentFieldBase):
    pass

class TournamentFieldInDB(TournamentFieldBase):
    id: str = Field(alias="_id")
    tournament_id: str
    field_name: str
    order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
