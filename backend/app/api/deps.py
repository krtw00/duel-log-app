"""
共通の依存性注入
"""

import logging
from typing import Optional

from fastapi import Cookie, Depends, Header
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

logger = logging.getLogger(__name__)


def get_current_user(
    access_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """
    JWTトークン（クッキーまたはAuthorizationヘッダーから取得）を検証し、現在のユーザーを返す

    Safari ITP対策として、Authorizationヘッダーでの認証にも対応
    優先順位: 1. Authorizationヘッダー, 2. Cookie

    Args:
        access_token: リクエストクッキー内のJWTトークン（オプショナル）
        authorization: Authorizationヘッダー（オプショナル）
        db: データベースセッション

    Returns:
        認証されたユーザーオブジェクト

    Raises:
        UnauthorizedException: 認証失敗時
    """
    token = None

    # 1. Authorizationヘッダーから取得（Safari ITP対策）
    if authorization:
        # "Bearer <token>" 形式から取得
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            logger.info("Token found in Authorization header (Safari/iOS mode)")
        else:
            logger.warning("Invalid Authorization header format")

    # 2. Cookieから取得（通常のブラウザ）
    if not token and access_token:
        token = access_token
        logger.info("Token found in Cookie (normal browser mode)")

    if not token:
        logger.warning(
            "No access token found - neither Cookie nor Authorization header"
        )
        raise UnauthorizedException(message="認証されていません")

    logger.debug("Access token received (length: %d)", len(token))

    # トークンをデコード
    payload = decode_access_token(token)
    if payload is None:
        raise UnauthorizedException(message="トークンが無効または期限切れです")

    # ペイロードからユーザーIDを取得
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException(message="トークンにユーザーIDが含まれていません")

    # データベースからユーザーを取得
    try:
        user_id_int = int(user_id)
    except ValueError as e:
        raise UnauthorizedException(message="ユーザーIDの形式が不正です") from e

    user = db.query(User).filter(User.id == user_id_int).first()

    if user is None:
        raise UnauthorizedException(message="ユーザーが見つかりません")

    return user


def get_current_user_optional(
    access_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    JWTトークンから現在のユーザーを取得（オプショナル版）

    トークンがない、または無効な場合でもエラーを発生させず、Noneを返す

    Args:
        access_token: リクエストクッキー内のJWTトークン（オプショナル）
        authorization: Authorizationヘッダー（オプショナル）
        db: データベースセッション

    Returns:
        認証されたユーザーオブジェクト、またはNone
    """
    if access_token is None and authorization is None:
        return None

    try:
        return get_current_user(access_token, authorization, db)
    except UnauthorizedException:
        return None


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    現在のユーザーが管理者であるかを確認する

    Args:
        current_user: 現在の認証済みユーザー

    Returns:
        管理者ユーザーオブジェクト

    Raises:
        ForbiddenException: ユーザーが管理者でない場合
    """
    if not current_user.is_admin:
        raise ForbiddenException(message="管理者権限が必要です")
    return current_user


__all__ = [
    "get_db",
    "get_current_user",
    "get_current_user_optional",
    "get_admin_user",
]
