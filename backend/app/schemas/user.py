from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional

# ユーザー作成用
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str  # 受け取ったらAPI側でハッシュ化して保存する

class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    password: str | None = None  # 受け取ったらAPI側でハッシュ化して保存する

# レスポンス用
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    createdat: Optional[datetime]
    updatedat: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
