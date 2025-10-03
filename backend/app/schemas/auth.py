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


class ForgotPasswordRequest(BaseModel):
    """パスワード再設定リクエスト"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """パスワードリセットリクエスト"""
    token: str
    new_password: str
    confirm_password: str
