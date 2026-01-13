"""
Supabase認証ユーティリティ
"""

import logging
from typing import Optional

from jose import JWTError, jwt

from app.core.config import settings

logger = logging.getLogger(__name__)


def verify_supabase_token(token: str) -> Optional[dict]:
    """
    Supabase JWTトークンを検証してペイロードを返す

    Args:
        token: 検証するJWTトークン

    Returns:
        Optional[dict]: デコードされたペイロード。検証失敗時はNone
    """
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        logger.debug("Supabase token verified successfully")
        return payload
    except JWTError as e:
        logger.warning("Supabase token verification failed: %s", str(e))
        # audienceエラーの場合、audienceなしで再試行
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            logger.debug("Supabase token verified without audience check")
            return payload
        except JWTError as e2:
            logger.error("Supabase token verification failed (retry): %s", str(e2))
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
