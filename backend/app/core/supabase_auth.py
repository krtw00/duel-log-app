"""
Supabase認証ユーティリティ

Supabase JWT検証:
- ES256 (ECDSA) とHS256両方をサポート
- ES256の場合: JWKSエンドポイントから公開鍵を取得して検証
- HS256の場合: JWT Secretを使用して検証
"""

import base64
import binascii
import logging
from typing import Optional
from urllib.parse import urlparse

import jwt  # PyJWT library
from jwt import PyJWKClient

from app.core.config import settings

logger = logging.getLogger(__name__)

# JWKS client for ES256 verification
_jwks_client: Optional[PyJWKClient] = None

# JWT secret candidates for HS256 (raw / decoded fallback)
_jwt_secret_candidates: Optional[list[tuple[str, str | bytes]]] = None


def _get_jwks_client() -> PyJWKClient:
    """
    JWKSクライアントを取得（キャッシュ付き）
    """
    global _jwks_client
    if _jwks_client is None:
        jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
        logger.info("JWKS client initialized: %s", jwks_url)
    return _jwks_client


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
    HS256 JWT検証用のシークレット候補を取得
    """
    global _jwt_secret_candidates
    if _jwt_secret_candidates is not None:
        return _jwt_secret_candidates

    secret_raw = _normalize_env_secret(settings.SUPABASE_JWT_SECRET)
    candidates: list[tuple[str, str | bytes]] = [("raw", secret_raw)]

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


def _verify_with_es256(token: str) -> Optional[dict]:
    """
    ES256 (ECDSA) でトークンを検証
    JWKSエンドポイントから公開鍵を取得して使用
    """
    try:
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
        logger.debug("Supabase token verified with ES256 (JWKS)")
        return payload
    except jwt.InvalidAudienceError:
        # audience検証なしで再試行
        try:
            jwks_client = _get_jwks_client()
            signing_key = jwks_client.get_signing_key_from_jwt(token)

            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256"],
                options={"verify_aud": False},
            )
            logger.debug("Supabase token verified with ES256 without audience check")
            return payload
        except Exception as e:
            logger.debug("ES256 verification failed (no aud): %s", str(e))
            return None
    except Exception as e:
        logger.debug("ES256 verification failed: %s", str(e))
        return None


def _verify_with_hs256(token: str) -> Optional[dict]:
    """
    HS256 (HMAC) でトークンを検証
    JWT Secretを使用
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
            logger.debug("Supabase token verified with HS256 (method=%s)", label)
            return payload
        except jwt.InvalidAudienceError:
            try:
                payload = jwt.decode(
                    token,
                    secret,
                    algorithms=["HS256"],
                    options={"verify_aud": False},
                )
                logger.debug(
                    "Supabase token verified with HS256 without audience check (method=%s)",
                    label,
                )
                return payload
            except jwt.PyJWTError as e:
                last_error = e
                continue
        except jwt.PyJWTError as e:
            last_error = e
            continue

    if last_error is not None:
        logger.debug(
            "HS256 verification failed: %s (methods_tried=%d)",
            type(last_error).__name__,
            len(secrets),
        )
    return None


def verify_supabase_token(token: str) -> Optional[dict]:
    """
    Supabase JWTトークンを検証してペイロードを返す

    トークンのアルゴリズムに応じて適切な検証方法を使用:
    - ES256: JWKSから公開鍵を取得して検証
    - HS256: JWT Secretで検証

    Args:
        token: 検証するJWTトークン

    Returns:
        Optional[dict]: デコードされたペイロード。検証失敗時はNone
    """
    # トークンのアルゴリズムを確認
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "").upper()
    except Exception:
        alg = ""

    # アルゴリズムに応じて検証
    if alg == "ES256":
        payload = _verify_with_es256(token)
        if payload:
            return payload
    elif alg == "HS256":
        payload = _verify_with_hs256(token)
        if payload:
            return payload
    else:
        # 不明なアルゴリズムの場合、両方試す
        payload = _verify_with_es256(token)
        if payload:
            return payload
        payload = _verify_with_hs256(token)
        if payload:
            return payload

    # 検証失敗時のログ
    logger.warning("Supabase token verification failed for alg=%s", alg)
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
