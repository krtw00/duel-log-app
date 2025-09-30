"""
デッキスキーマ
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class DeckBase(BaseModel):
    """デッキ基底スキーマ"""
    name: str = Field(..., min_length=1, max_length=100, description="デッキ名")
    is_opponent: bool = Field(default=False, description="対戦相手のデッキかどうか")


class DeckCreate(DeckBase):
    """デッキ作成スキーマ"""
    model_config = ConfigDict(extra="forbid")


class DeckUpdate(BaseModel):
    """デッキ更新スキーマ"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="デッキ名")
    is_opponent: Optional[bool] = Field(None, description="対戦相手のデッキかどうか")
    
    model_config = ConfigDict(extra="forbid")


class DeckRead(DeckBase):
    """デッキ読み取りスキーマ"""
    id: int
    user_id: int
    createdat: datetime
    updatedat: datetime
    
    model_config = ConfigDict(from_attributes=True)


class DeckWithStats(DeckRead):
    """統計情報付きデッキスキーマ"""
    total_duels: int = Field(default=0, description="総デュエル数")
    wins: int = Field(default=0, description="勝利数")
    losses: int = Field(default=0, description="敗北数")
    win_rate: float = Field(default=0.0, description="勝率")
