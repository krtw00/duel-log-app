import base64
import time

import jwt

from app.core import supabase_auth
from app.core.config import settings


def _make_token(*, secret: str | bytes, sub: str = "00000000-0000-0000-0000-000000000000") -> str:
    now = int(time.time())
    payload = {
        "sub": sub,
        "aud": "authenticated",
        "email": "test@example.com",
        "iat": now,
        "exp": now + 60,
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def test_verify_supabase_token_uses_raw_secret(monkeypatch):
    secret = "test-jwt-secret-for-testing-only-32chars"
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", secret)
    supabase_auth._jwt_secret_candidates = None

    token = _make_token(secret=secret)
    payload = supabase_auth.verify_supabase_token(token)

    assert payload is not None
    assert payload["sub"] == "00000000-0000-0000-0000-000000000000"


def test_verify_supabase_token_falls_back_to_base64_decoded_secret(monkeypatch):
    underlying_secret = "my-underlying-jwt-secret-32chars!!!!"
    env_value = base64.b64encode(underlying_secret.encode("utf-8")).decode("ascii")
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", env_value)
    supabase_auth._jwt_secret_candidates = None

    token = _make_token(secret=underlying_secret)
    payload = supabase_auth.verify_supabase_token(token)

    assert payload is not None
    assert payload["email"] == "test@example.com"
