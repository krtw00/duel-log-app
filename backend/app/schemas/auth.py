"""
認証関連のPydanticスキーマ定義
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    """ログインリクエスト"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """トークンレスポンス"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """トークンのペイロードデータ"""
    user_id: Optional[int] = None
    email: Optional[str] = None
