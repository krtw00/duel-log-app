# app/schemas/deck.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class DeckBase(BaseModel):
    name: str
    is_opponent: bool = False

class DeckCreate(DeckBase):
    """新規作成用"""
    user_id: int = Field(..., description="ユーザーID")
    
    class Config:
        extra = "forbid"


class DeckUpdate(BaseModel):
    """更新用"""
    name: Optional[str] = None
    is_opponent: Optional[bool] = None

class DeckRead(DeckBase):
    id: int
    user_id: int
    createdat: datetime
    updatedat: datetime

    class Config:
        orm_mode = True