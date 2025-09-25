# app/schemas/deck.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DeckBase(BaseModel):
    name: str

class DeckCreate(DeckBase):
    """新規作成用"""
    pass

class DeckUpdate(BaseModel):
    """更新用"""
    name: Optional[str] = None

class DeckRead(DeckBase):
    id: int
    createdat: datetime
    updatedat: datetime

    class Config:
        orm_mode = True