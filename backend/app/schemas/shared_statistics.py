from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class SharedStatisticsBase(BaseModel):
    year: int = Field(..., description="対象年")
    month: int = Field(..., description="対象月")
    game_mode: Literal["RANK", "RATE", "EVENT", "DC"] = Field(
        ..., description="ゲームモード"
    )
    expires_at: Optional[datetime] = Field(None, description="有効期限日時 (UTC)")


class SharedStatisticsCreate(SharedStatisticsBase):
    model_config = ConfigDict(extra="forbid")


class SharedStatisticsRead(SharedStatisticsBase):
    id: int
    share_id: str
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
