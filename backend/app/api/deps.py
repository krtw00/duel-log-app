"""
共通の依存性注入
"""

from typing import Optional

from fastapi import Cookie, Depends
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User


def get_current_user(
    access_token: Optional[str] = Cookie(None), db: Session = Depends(get_db)
) -> User:
    """
    JWTトークン（クッキーから取得）を検証し、現在のユーザーを返す

    Args:
        access_token: リクエストクッキー内のJWTトークン
        db: データベースセッション

    Returns:
        認証されたユーザーオブジェクト

    Raises:
        UnauthorizedException: 認証失敗時
    """
    if access_token is None:
        raise UnauthorizedException(detail="認証されていません")

    # トークンをデコード
    payload = decode_access_token(access_token)
    if payload is None:
        raise UnauthorizedException(detail="トークンが無効または期限切れです")

    # ペイロードからユーザーIDを取得
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException(detail="トークンにユーザーIDが含まれていません")

    # データベースからユーザーを取得
    try:
        user_id_int = int(user_id)
    except ValueError as e:
        raise UnauthorizedException(detail="ユーザーIDの形式が不正です") from e

    user = db.query(User).filter(User.id == user_id_int).first()

    if user is None:
        raise UnauthorizedException(detail="ユーザーが見つかりません")

    return user


def get_current_user_optional(
    access_token: Optional[str] = Cookie(None), db: Session = Depends(get_db)
) -> Optional[User]:
    """
    JWTトークンから現在のユーザーを取得（オプショナル版）

    トークンがない、または無効な場合でもエラーを発生させず、Noneを返す

    Args:
        access_token: リクエストクッキー内のJWTトークン（オプショナル）
        db: データベースセッション

    Returns:
        認証されたユーザーオブジェクト、またはNone
    """
    if access_token is None:
        return None

    try:
        return get_current_user(access_token, db)
    except UnauthorizedException:
        return None


__all__ = [
    "get_db",
    "get_current_user",
    "get_current_user_optional",
]
