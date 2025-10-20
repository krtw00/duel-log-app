from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ユーザー作成用
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(
        min_length=8, max_length=72, description="パスワード (8〜72文字)"
    )


class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    password: str | None = Field(
        None, min_length=8, max_length=72, description="パスワード (8〜72文字)"
    )
    streamer_mode: bool | None = None
    theme_preference: str | None = None


# レスポンス用
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    streamer_mode: bool
    theme_preference: str
    createdat: Optional[datetime]
    updatedat: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
