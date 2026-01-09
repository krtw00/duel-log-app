"""管理者API用のスキーマ"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr


class UserAdminResponse(BaseModel):
    """管理者向けユーザー情報レスポンス"""

    id: int
    username: str
    email: EmailStr
    is_admin: bool
    createdat: datetime

    class Config:
        from_attributes = True


class UsersListResponse(BaseModel):
    """ユーザー一覧レスポンス"""

    users: List[UserAdminResponse]
    total: int
    page: int
    per_page: int


class UpdateAdminStatusRequest(BaseModel):
    """管理者権限更新リクエスト"""

    is_admin: bool


class UpdateAdminStatusResponse(BaseModel):
    """管理者権限更新レスポンス"""

    success: bool
    user: UserAdminResponse
