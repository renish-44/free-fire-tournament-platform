from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TournamentBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    game_name: str = "Free Fire"
    mode: str  # e.g., "SOLO", "DUO", "SQUAD"
    poster_url: Optional[str] = None
    tournament_date: datetime
    start_time: str
    registration_start: datetime
    registration_deadline: datetime
    maximum_slots: int
    entry_fee: float = 0.0
    prize_pool: float = 0.0
    first_prize: float = 0.0
    second_prize: float = 0.0
    third_prize: float = 0.0
    organizer_name: str
    organizer_contact: str
    whatsapp: Optional[str] = None
    upi_id: Optional[str] = None
    payment_name: Optional[str] = None
    payment_qr_url: Optional[str] = None
    rules: Optional[str] = None
    instructions: Optional[str] = None
    google_form_url: Optional[str] = None
    status: str = "DRAFT"  # DRAFT, PUBLISHED, CLOSED, COMPLETED

class TournamentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    game_name: str = "Free Fire"
    mode: str
    tournament_date: datetime
    start_time: str
    registration_start: datetime
    registration_deadline: datetime
    maximum_slots: int
    entry_fee: float = 0.0
    prize_pool: float = 0.0
    first_prize: float = 0.0
    second_prize: float = 0.0
    third_prize: float = 0.0
    organizer_name: str
    organizer_contact: str
    whatsapp: Optional[str] = None
    upi_id: Optional[str] = None
    payment_name: Optional[str] = None
    payment_qr_url: Optional[str] = None
    rules: Optional[str] = None
    instructions: Optional[str] = None
    google_form_url: Optional[str] = None
    poster_url: Optional[str] = None

class TournamentUpdate(TournamentCreate):
    pass

class TournamentInDB(TournamentBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class TournamentPublic(TournamentInDB):
    registered_count: int = 0
    available_slots: int = 0
