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
from urllib.parse import urlparse

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


def _hostname(url: str) -> str:
    try:
        return urlparse(url).hostname or ""
    except Exception:
        return ""


def _try_b64decode(secret: str, *, altchars: bytes | None = None) -> Optional[bytes]:
    """
    Best-effort Base64 decode with padding normalization.

    環境変数の設定方法により、JWT Secret が Base64(またはURL-safe Base64) の文字列として
    扱われるケースがあるため、互換のためにデコード候補を作る。
    """
    try:
        normalized = secret.strip()
        padded = normalized + ("=" * (-len(normalized) % 4))
        decoded = base64.b64decode(padded, altchars=altchars)
        return decoded if decoded else None
    except (binascii.Error, ValueError):
        return None


def _log_unverified_token_summary(token: str) -> None:
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        kid = header.get("kid")
    except Exception:
        alg = None
        kid = None

    try:
        payload = jwt.decode(
            token,
            options={
                "verify_signature": False,
                "verify_aud": False,
                "verify_exp": False,
                "verify_iss": False,
            },
        )
        iss = payload.get("iss")
        aud = payload.get("aud")
        exp = payload.get("exp")
        iat = payload.get("iat")
    except Exception:
        iss = None
        aud = None
        exp = None
        iat = None

    configured_host = _hostname(settings.SUPABASE_URL)
    token_host = _hostname(iss) if isinstance(iss, str) else ""

    logger.warning(
        "Token summary (unverified): alg=%s kid=%s iss_host=%s aud=%s exp=%s iat=%s configured_supabase_host=%s",
        alg,
        kid,
        token_host or None,
        aud,
        exp,
        iat,
        configured_host or None,
    )
    if token_host and configured_host and token_host != configured_host:
        logger.error(
            "Supabase project mismatch: token issuer host (%s) != SUPABASE_URL host (%s). "
            "Check frontend(VITE_SUPABASE_URL/ANON_KEY) and backend(SUPABASE_URL/JWT_SECRET) are the same project.",
            token_host,
            configured_host,
        )


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
    decoded = _try_b64decode(secret_raw)
    if decoded:
        candidates.append(("base64", decoded))

    decoded_urlsafe = _try_b64decode(secret_raw, altchars=b"-_")
    if decoded_urlsafe:
        decoded_values = {v for _, v in candidates if isinstance(v, (bytes, bytearray))}
        if decoded_urlsafe not in decoded_values:
            candidates.append(("base64url", decoded_urlsafe))

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
            "Supabase token verification failed: %s (keys_tried=%s)",
            str(last_error),
            [label for label, _ in secrets],
        )
        _log_unverified_token_summary(token)
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
