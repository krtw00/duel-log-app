"""
Supabase認証ユーティリティ

Supabase JWT検証:
- Supabase JWT SecretはダッシュボードでBase64エンコードされた形式で表示される
- PyJWTライブラリを使用してHS256アルゴリズムで検証
- Base64デコードしたバイト列を鍵として使用
"""

import base64
import logging
from typing import Optional

import jwt  # PyJWT library

from app.core.config import settings

logger = logging.getLogger(__name__)

# Supabase JWT secretをBase64デコードしたバイト列
_decoded_jwt_secret: Optional[bytes] = None


def _get_jwt_secret() -> bytes:
    """
    JWT検証用のシークレットを取得

    Returns:
        bytes: Base64デコードされたJWTシークレット
    """
    global _decoded_jwt_secret
    if _decoded_jwt_secret is None:
        _decoded_jwt_secret = base64.b64decode(settings.SUPABASE_JWT_SECRET)
        logger.info("JWT secret decoded (length: %d bytes)", len(_decoded_jwt_secret))
    return _decoded_jwt_secret


def verify_supabase_token(token: str) -> Optional[dict]:
    """
    Supabase JWTトークンを検証してペイロードを返す

    Args:
        token: 検証するJWTトークン

    Returns:
        Optional[dict]: デコードされたペイロード。検証失敗時はNone
    """
    secret = _get_jwt_secret()

    try:
        # PyJWTでデコード（audienceチェック付き）
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        logger.debug("Supabase token verified successfully")
        return payload
    except jwt.InvalidAudienceError:
        # audienceエラーの場合、audienceなしで再試行
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            logger.debug("Supabase token verified without audience check")
            return payload
        except jwt.PyJWTError as e:
            logger.error("Supabase token verification failed (no aud): %s", str(e))
            return None
    except jwt.PyJWTError as e:
        logger.warning("Supabase token verification failed: %s", str(e))
        return None


def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Supabase JWTトークンからユーザーIDを取得

    Args:
        token: JWTトークン

    Returns:
        Optional[str]: ユーザーID（UUID）。取得失敗時はNone
    """
    payload = verify_supabase_token(token)
    if payload:
        return payload.get("sub")  # Supabaseは'sub'クレームにユーザーIDを格納
    return None
