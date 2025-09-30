"""
共通の依存性注入
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedException


# HTTPベアラートークンのセキュリティスキーム
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    JWTトークンから現在のユーザーを取得
    
    Args:
        credentials: HTTPベアラートークン
        db: データベースセッション
    
    Returns:
        認証されたユーザーオブジェクト
    
    Raises:
        UnauthorizedException: 認証失敗時
    """
    # トークンをデコード
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise UnauthorizedException(detail="トークンが無効または期限切れです")
    
    # ペイロードからユーザーIDを取得
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException(detail="トークンにユーザーIDが含まれていません")
    
    # データベースからユーザーを取得
    try:
        user_id_int = int(user_id)
    except ValueError:
        raise UnauthorizedException(detail="ユーザーIDの形式が不正です")
    
    user = db.query(User).filter(User.id == user_id_int).first()
    
    if user is None:
        raise UnauthorizedException(detail="ユーザーが見つかりません")
    
    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    JWTトークンから現在のユーザーを取得（オプショナル版）
    
    トークンがない場合でもエラーを発生させず、Noneを返す
    認証が必須ではないエンドポイントで使用
    
    Args:
        credentials: HTTPベアラートークン（オプショナル）
        db: データベースセッション
    
    Returns:
        認証されたユーザーオブジェクト、またはNone
    """
    if credentials is None:
        return None
    
    try:
        return get_current_user(credentials, db)
    except UnauthorizedException:
        return None


__all__ = [
    "get_db",
    "get_current_user",
    "get_current_user_optional",
]
