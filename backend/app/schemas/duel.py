"""
デュエルスキーマ
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from . import CustomBaseModel


class DuelBase(CustomBaseModel):
    """デュエル基底スキーマ"""

    deck_id: int = Field(..., gt=0, description="使用デッキID")
    opponent_deck_id: int = Field(..., gt=0, description="対戦相手デッキID")
    won_coin_toss: bool = Field(..., description="コイントスの結果（True: 表, False: 裏）")
    is_going_first: bool = Field(
        ..., description="先攻後政（True: 先攻, False: 後攻）"
    )
    is_win: bool = Field(..., description="対戦結果（True: 勝利, False: 敗北）")
    game_mode: Literal["RANK", "RATE", "EVENT", "DC"] = Field(
        default="RANK", description="ゲームモード（RANK/RATE/EVENT/DC）"
    )
    rank: Optional[int] = Field(None, description="ランク（RANKモード時のみ）")
    rate_value: Optional[int] = Field(
        None, ge=0, description="レート数値（RATEモード時のみ）"
    )
    dc_value: Optional[int] = Field(None, ge=0, description="DC数値（DCモード時のみ）")
    played_date: datetime = Field(..., description="対戦日時")
    notes: Optional[str] = Field(None, max_length=1000, description="メモ")

    @field_validator("played_date")
    @classmethod
    def validate_played_date(cls, v: datetime) -> datetime:
        """対戦日時の基本的なバリデーション"""
        # 注意: タイムゾーンの問題を避けるため、未来日時チェックは行わない
        # ユーザーは手動で時刻を調整できるため、柔軟な運用を許可
        return v

    @field_validator("rank")
    @classmethod
    def validate_rank(cls, v: Optional[int], info) -> Optional[int]:
        """RANKモード時はrankが必須"""
        game_mode = info.data.get("game_mode")
        if game_mode == "RANK" and v is None:
            raise ValueError("RANKモード時はrankを指定してください")
        if game_mode != "RANK" and v is not None:
            raise ValueError("RANK以外のモードではrankを指定できません")
        return v

    @field_validator("rate_value")
    @classmethod
    def validate_rate_value(cls, v: Optional[int], info) -> Optional[int]:
        """RATEモード時はrate_valueが必須"""
        game_mode = info.data.get("game_mode")
        if game_mode == "RATE" and v is None:
            raise ValueError("RATEモード時はrate_valueを指定してください")
        if game_mode != "RATE" and v is not None:
            raise ValueError("RATE以外のモードではrate_valueを指定できません")
        return v

    @field_validator("dc_value")
    @classmethod
    def validate_dc_value(cls, v: Optional[int], info) -> Optional[int]:
        """DCモード時はdc_valueが必須"""
        game_mode = info.data.get("game_mode")
        if game_mode == "DC" and v is None:
            raise ValueError("DCモード時はdc_valueを指定してください")
        if game_mode != "DC" and v is not None:
            raise ValueError("DC以外のモードではdc_valueを指定できません")
        return v


class DuelCreate(DuelBase):
    """デュエル作成スキーマ"""

    model_config = ConfigDict(extra="forbid")


class DuelUpdate(BaseModel):
    """デュエル更新スキーマ"""

    deck_id: Optional[int] = Field(None, gt=0, description="使用デッキID")
    opponent_deck_id: Optional[int] = Field(None, gt=0, description="対戦相手デッキID")
    won_coin_toss: Optional[bool] = Field(None, description="コイントスの結果")
    is_going_first: Optional[bool] = Field(None, description="先攻後攻")
    is_win: Optional[bool] = Field(None, description="対戦結果")
    game_mode: Optional[Literal["RANK", "RATE", "EVENT", "DC"]] = Field(
        None, description="ゲームモード"
    )
    rank: Optional[int] = Field(None, ge=1, le=32, description="ランク")
    rate_value: Optional[int] = Field(None, ge=0, description="レート数値")
    dc_value: Optional[int] = Field(None, ge=0, description="DC数値")
    played_date: Optional[datetime] = Field(None, description="対戦日時")
    notes: Optional[str] = Field(None, max_length=1000, description="メモ")

    model_config = ConfigDict(extra="forbid")

    @field_validator("played_date")
    @classmethod
    def validate_played_date(cls, v: Optional[datetime]) -> Optional[datetime]:
        """対戦日時の基本的なバリデーション"""
        # 注意: タイムゾーンの問題を避けるため、未来日時チェックは行わない
        # ユーザーは手動で時刻を調整できるため、柔軟な運用を許可
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
