"""
認証関連のAPIエンドポイント

注意: メイン認証はSupabase Authに移行済み。
このファイルには以下の互換性・補助エンドポイントのみ残しています:
- /logout: レガシーCookieクリア用
- /obs-token: OBS連携用トークン発行
"""

import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, Header, Response

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User
from app.utils.auth_cookies import resolve_cookie_policy

# ルーター定義
router = APIRouter(prefix="/auth", tags=["authentication"])

# ロガー初期化
logger = logging.getLogger(__name__)


@router.post("/logout")
def logout(response: Response, user_agent: str | None = Header(None)):
    """
    ユーザーログアウト

    レガシーHttpOnlyクッキーをクリアする（Supabase Auth移行前のセッション用）
    """
    is_production = settings.ENVIRONMENT == "production"
    samesite_value, secure_value, is_safari = resolve_cookie_policy(
        user_agent, is_production
    )
    logger.info(
        "Safari/iOS detected on logout - using SameSite=Lax for cookie deletion"
        if is_safari
        else "Non-Safari browser on logout - using SameSite policy for cookie deletion"
    )

    response.set_cookie(
        key="access_token",
        value="",
        httponly=True,
        samesite=samesite_value,
        secure=secure_value,
        path="/",
        max_age=0,
    )

    return {"message": "Logout successful"}


@router.post("/obs-token")
def get_obs_token(
    current_user: User = Depends(get_current_user),
):
    """
    OBS連携用の限定スコープトークンを取得する

    このエンドポイントは、OBSオーバーレイなど外部ツール向けに
    短寿命で統計情報閲覧のみに限定されたトークンを発行します。

    - 有効期限: 24時間
    - スコープ: obs_overlay（統計情報の読み取りのみ）
    - セキュリティ: 通常のJWTトークンと異なり、書き込み操作は不可

    Returns:
        dict: OBS専用トークンと有効期限情報
    """
    # OBS専用のトークンデータ（スコープを限定）
    token_data = {
        "sub": str(current_user.id),
        "scope": "obs_overlay",  # 統計情報閲覧のみ
        "username": current_user.username,
    }

    # 24時間有効のトークンを生成
    obs_token = create_access_token(data=token_data, expires_delta=timedelta(hours=24))

    logger.info(f"OBS token generated for user ID {current_user.id}")

    return {
        "obs_token": obs_token,
        "expires_in": 24 * 60 * 60,  # 秒単位
        "scope": "obs_overlay",
        "message": "OBS連携用トークンを発行しました。このトークンは24時間有効です。",
    }
