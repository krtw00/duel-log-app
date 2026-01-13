"""
認証関連のPydanticスキーマ定義

注意: パスワードリセットはSupabase Authに移行済み。
レガシー互換性のためにLoginRequest等は残しています。
"""

from typing import Optional

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """ログインリクエスト（レガシー互換用）"""

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
