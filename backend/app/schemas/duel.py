# app/schemas/duel.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class DuelBase(BaseModel):
    deck_id: int
    opponentDeck_id: int
    coin: bool
    first_or_second: bool
    result: bool
    rank: Optional[int] = None
    played_date: datetime
    notes: Optional[str] = None

class DuelCreate(DuelBase):
    
    class Config:
        extra = "forbid"

class DuelUpdate(BaseModel):
    deck_id: Optional[int] = None
    opponentDeck_id: Optional[int] = None
    coin: Optional[bool] = None
    first_or_second: Optional[bool] = None
    result: Optional[bool] = None
    rank: Optional[int] = None
    played_date: Optional[datetime] = None
    notes: Optional[str] = None

class DuelRead(DuelBase):
    id: int
    user_id: int
    create_date: datetime
    update_date: datetime

    class Config:
        orm_mode = True
