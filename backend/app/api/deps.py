"""
共通の依存性注入
"""

import logging
import secrets
from typing import Optional

from fastapi import Cookie, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_access_token
from app.core.supabase_auth import verify_supabase_token
from app.db.session import get_db
from app.models.user import User

logger = logging.getLogger(__name__)


def _create_user_from_supabase(
    db: Session, supabase_uuid: str, email: Optional[str], username: Optional[str]
) -> User:
    """
    Supabase認証情報から新しいユーザーを作成（JIT Provisioning）

    Args:
        db: データベースセッション
        supabase_uuid: SupabaseのユーザーUUID
        email: メールアドレス
        username: ユーザー名

    Returns:
        作成されたユーザー
    """
    # ユーザー名がない場合はメールから生成
    if not username:
        if email:
            username = email.split("@")[0]
        else:
            username = f"user_{supabase_uuid[:8]}"

    # ユーザー名の重複チェック
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        # 重複する場合はランダムサフィックスを追加
        username = f"{username}_{secrets.token_hex(4)}"

    # メールの重複チェック
    if email:
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            # 既存ユーザーにsupabase_uuidを紐付け
            existing_email.supabase_uuid = supabase_uuid
            db.commit()
            db.refresh(existing_email)
            logger.info(
                "Linked existing user (id=%d) to Supabase UUID: %s",
                existing_email.id,
                supabase_uuid,
            )
            return existing_email

    # 新規ユーザー作成
    # パスワードハッシュはSupabase認証のため使用しないがNOT NULLなのでダミー値を設定
    new_user = User(
        supabase_uuid=supabase_uuid,
        username=username,
        email=email,
        passwordhash="supabase_auth_user",  # Supabase認証ユーザーを示すマーカー
        streamer_mode=False,
        theme_preference="dark",
        is_admin=False,
        enable_screen_analysis=False,
        status="active",  # 新規ユーザーは常にactive
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(
        "Created new user via JIT Provisioning: id=%d, username=%s, supabase_uuid=%s",
        new_user.id,
        new_user.username,
        supabase_uuid,
    )
    return new_user


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

    # Supabase JWTトークンを検証
    payload = verify_supabase_token(token)
    if payload is None:
        raise UnauthorizedException(message="トークンが無効または期限切れです")

    # ペイロードからSupabase UUIDを取得
    supabase_uuid: Optional[str] = payload.get("sub")
    if supabase_uuid is None:
        raise UnauthorizedException(message="トークンにユーザーIDが含まれていません")

    logger.debug("Supabase UUID from token: %s", supabase_uuid)

    # データベースからユーザーを取得（Supabase UUIDで検索）
    user = db.query(User).filter(User.supabase_uuid == supabase_uuid).first()

    if user is None:
        # JIT Provisioning: ユーザーが見つからない場合は自動作成
        logger.info(
            "User not found for Supabase UUID: %s, attempting JIT provisioning",
            supabase_uuid,
        )
        email: Optional[str] = payload.get("email")
        # user_metadataからユーザー名を取得（Supabase signup時に設定される）
        user_metadata = payload.get("user_metadata", {})
        username: Optional[str] = (
            user_metadata.get("username") if isinstance(user_metadata, dict) else None
        )

        try:
            user = _create_user_from_supabase(db, supabase_uuid, email, username)
        except Exception as e:
            logger.error("JIT Provisioning failed: %s", str(e))
            raise UnauthorizedException(message="ユーザーの作成に失敗しました") from e

    # status チェック
    if user.status == "suspended":
        logger.warning(f"Suspended user attempted access: user_id={user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このアカウントは一時停止されています",
        )

    if user.status == "deleted":
        logger.warning(f"Deleted user attempted access: user_id={user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このアカウントは削除されています",
        )

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


def get_obs_overlay_user(
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """
    OBSオーバーレイ向けのユーザー取得

    優先順位:
    1) クエリ `token`（OBS URL に埋め込む）
    2) Authorization ヘッダー（Bearer）

    受け入れるトークン:
    - OBS専用トークン（/auth/obs-token が発行する、scope=obs_overlay のアプリJWT）
    - （互換）Supabase JWT（通常ログイン時のアクセストークン）
    """
    raw_token: Optional[str] = None

    if token:
        raw_token = token
    elif authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            raw_token = parts[1]

    if not raw_token:
        raise UnauthorizedException(message="認証されていません")

    # 1) OBS専用トークン（アプリJWT）として検証
    app_payload = decode_access_token(raw_token)
    if app_payload is not None and app_payload.get("scope") == "obs_overlay":
        sub = app_payload.get("sub")
        try:
            user_id = int(sub)
        except (TypeError, ValueError) as e:
            raise UnauthorizedException(message="トークンが不正です") from e

        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise UnauthorizedException(message="ユーザーが見つかりません")

        if user.status != "active":
            logger.warning(
                f"Non-active user attempted OBS access: user_id={user.id}, status={user.status}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="このアカウントではOBSオーバーレイを使用できません",
            )
        return user

    # 2) Supabase JWTとして検証（互換）
    supabase_payload = verify_supabase_token(raw_token)
    if supabase_payload is None:
        raise UnauthorizedException(message="トークンが無効または期限切れです")

    supabase_uuid: Optional[str] = supabase_payload.get("sub")
    if supabase_uuid is None:
        raise UnauthorizedException(message="トークンにユーザーIDが含まれていません")

    user = db.query(User).filter(User.supabase_uuid == supabase_uuid).first()
    if user is None:
        logger.info(
            "User not found for Supabase UUID: %s, attempting JIT provisioning (OBS overlay)",
            supabase_uuid,
        )
        email: Optional[str] = supabase_payload.get("email")
        user_metadata = supabase_payload.get("user_metadata", {})
        username: Optional[str] = (
            user_metadata.get("username") if isinstance(user_metadata, dict) else None
        )
        try:
            user = _create_user_from_supabase(db, supabase_uuid, email, username)
        except Exception as e:
            logger.error("JIT Provisioning failed (OBS overlay): %s", str(e))
            raise UnauthorizedException(message="ユーザーの作成に失敗しました") from e

    if user.status != "active":
        logger.warning(
            f"Non-active user attempted OBS access: user_id={user.id}, status={user.status}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このアカウントではOBSオーバーレイを使用できません",
        )

    return user


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
    "get_obs_overlay_user",
    "get_admin_user",
]
