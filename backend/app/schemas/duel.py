"""
デュエルスキーマ
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime
from typing import Optional


class DuelBase(BaseModel):
    """デュエル基底スキーマ"""
    deck_id: int = Field(..., gt=0, description="使用デッキID")
    opponentDeck_id: int = Field(..., gt=0, description="対戦相手デッキID")
    coin: bool = Field(..., description="コイントスの結果（True: 表, False: 裏）")
    first_or_second: bool = Field(..., description="先攻後攻（True: 先攻, False: 後攻）")
    result: bool = Field(..., description="対戦結果（True: 勝利, False: 敗北）")
    rank: Optional[int] = Field(None, ge=1, description="ランク")
    played_date: datetime = Field(..., description="対戦日時")
    notes: Optional[str] = Field(None, max_length=1000, description="メモ")
    
    @field_validator('played_date')
    @classmethod
    def validate_played_date(cls, v: datetime) -> datetime:
        """対戦日時が未来でないことを確認"""
        from datetime import timezone
        # タイムゾーン情報を持っている場合、UTCに変換
        if v.tzinfo is not None:
            v_utc = v.astimezone(timezone.utc).replace(tzinfo=None)
        else:
            v_utc = v
        
        if v_utc > datetime.utcnow():
            raise ValueError('対戦日時を未来の日付に設定することはできません')
        return v


class DuelCreate(DuelBase):
    """デュエル作成スキーマ"""
    model_config = ConfigDict(extra="forbid")


class DuelUpdate(BaseModel):
    """デュエル更新スキーマ"""
    deck_id: Optional[int] = Field(None, gt=0, description="使用デッキID")
    opponentDeck_id: Optional[int] = Field(None, gt=0, description="対戦相手デッキID")
    coin: Optional[bool] = Field(None, description="コイントスの結果")
    first_or_second: Optional[bool] = Field(None, description="先攻後攻")
    result: Optional[bool] = Field(None, description="対戦結果")
    rank: Optional[int] = Field(None, ge=1, description="ランク")
    played_date: Optional[datetime] = Field(None, description="対戦日時")
    notes: Optional[str] = Field(None, max_length=1000, description="メモ")
    
    model_config = ConfigDict(extra="forbid")
    
    @field_validator('played_date')
    @classmethod
    def validate_played_date(cls, v: Optional[datetime]) -> Optional[datetime]:
        """対戦日時が未来でないことを確認"""
        if v is not None:
            from datetime import timezone
            # タイムゾーン情報を持っている場合、UTCに変換
            if v.tzinfo is not None:
                v_utc = v.astimezone(timezone.utc).replace(tzinfo=None)
            else:
                v_utc = v
            
            if v_utc > datetime.utcnow():
                raise ValueError('対戦日時を未来の日付に設定することはできません')
        return v


class DuelRead(DuelBase):
    """デュエル読み取りスキーマ"""
    id: int
    user_id: int
    create_date: datetime
    update_date: datetime
    
    model_config = ConfigDict(from_attributes=True)


class DuelWithDeckNames(DuelRead):
    """デッキ名付きデュエルスキーマ"""
    deck_name: str = Field(..., description="使用デッキ名")
    opponent_deck_name: str = Field(..., description="対戦相手デッキ名")
