from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime
from typing import Optional

# ユーザー作成用
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=72, description="パスワード (8〜72文字)")

class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    password: str | None = Field(None, min_length=8, max_length=72, description="パスワード (8〜72文字)")

# レスポンス用
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    createdat: Optional[datetime]
    updatedat: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
