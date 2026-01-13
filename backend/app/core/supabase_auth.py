"""
Supabase認証ユーティリティ

Supabase JWT検証:
- PyJWTライブラリを使用してHS256アルゴリズムで検証
- 秘密鍵はSupabaseダッシュボードの「JWT Secret」をそのまま使用する（Base64デコードしない）
"""

import base64
import binascii
import logging
from typing import Optional

import jwt  # PyJWT library

from app.core.config import settings

logger = logging.getLogger(__name__)

# JWT secret candidates (raw / decoded fallback)
_jwt_secret_candidates: Optional[list[tuple[str, str | bytes]]] = None


def _normalize_env_secret(secret: str) -> str:
    secret = secret.strip()
    if (
        (secret.startswith('"') and secret.endswith('"'))
        or (secret.startswith("'") and secret.endswith("'"))
    ) and len(secret) >= 2:
        secret = secret[1:-1]
    return secret.strip()


def _get_jwt_secret_candidates() -> list[tuple[str, str | bytes]]:
    """
    JWT検証用のシークレット候補を取得

    Returns:
        list[tuple[str, str | bytes]]: (label, key) の候補リスト
    """
    global _jwt_secret_candidates
    if _jwt_secret_candidates is not None:
        return _jwt_secret_candidates

    secret_raw = _normalize_env_secret(settings.SUPABASE_JWT_SECRET)
    candidates: list[tuple[str, str | bytes]] = [("raw", secret_raw)]

    # Backward compatibility: 以前の実装ではBase64デコードしたバイト列を鍵としていたため、
    # 署名検証に失敗した場合のフォールバックとして候補に加える。
    try:
        decoded = base64.b64decode(secret_raw, validate=True)
        if decoded:
            candidates.append(("base64", decoded))
    except (binascii.Error, ValueError):
        pass

    try:
        decoded_urlsafe = base64.b64decode(secret_raw, altchars=b"-_", validate=True)
        decoded_values = {v for _, v in candidates if isinstance(v, (bytes, bytearray))}
        if decoded_urlsafe and decoded_urlsafe not in decoded_values:
            candidates.append(("base64url", decoded_urlsafe))
    except (binascii.Error, ValueError):
        pass

    _jwt_secret_candidates = candidates
    logger.info(
        "Supabase JWT secret loaded (candidates=%d, raw_length=%d)",
        len(candidates),
        len(secret_raw),
    )
    return candidates


def verify_supabase_token(token: str) -> Optional[dict]:
    """
    Supabase JWTトークンを検証してペイロードを返す

    Args:
        token: 検証するJWTトークン

    Returns:
        Optional[dict]: デコードされたペイロード。検証失敗時はNone
    """
    secrets = _get_jwt_secret_candidates()

    last_error: Optional[Exception] = None

    for label, secret in secrets:
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
            logger.debug("Supabase token verified successfully (key=%s)", label)
            return payload
        except jwt.InvalidAudienceError:
            try:
                payload = jwt.decode(
                    token,
                    secret,
                    algorithms=["HS256"],
                    options={"verify_aud": False},
                )
                logger.debug("Supabase token verified without audience check (key=%s)", label)
                return payload
            except jwt.PyJWTError as e:
                last_error = e
                continue
        except jwt.PyJWTError as e:
            last_error = e
            continue

    if last_error is not None:
        logger.warning(
            "Supabase token verification failed: %s (check SUPABASE_JWT_SECRET)",
            str(last_error),
        )
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
