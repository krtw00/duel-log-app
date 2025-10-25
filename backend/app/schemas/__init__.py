from datetime import datetime
from zoneinfo import ZoneInfo

from pydantic import BaseModel, ConfigDict

from .deck import DeckCreate, DeckRead, DeckUpdate
from .shared_statistics import SharedStatisticsCreate, SharedStatisticsRead
from .user import UserCreate, UserResponse


class CustomBaseModel(BaseModel):
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.astimezone(ZoneInfo("Asia/Tokyo")).isoformat()
        }
    )
