"""
認証関連ユーティリティのテスト
Safari判定、Cookie設定、パスワードハッシュ、JWT処理のテスト
"""

from datetime import timedelta

from app.core.security import (
    _truncate_password,
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from app.utils.auth_cookies import is_safari_browser, resolve_cookie_policy


class TestIsSafariBrowser:
    """Safari判定のテスト"""

    def test_safari_macos(self):
        """macOS Safari"""
        ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
        assert is_safari_browser(ua) is True

    def test_safari_iphone(self):
        """iPhone Safari"""
        ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        assert is_safari_browser(ua) is True

    def test_safari_ipad(self):
        """iPad Safari"""
        ua = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        assert is_safari_browser(ua) is True

    def test_chrome(self):
        """Chrome is not Safari"""
        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        assert is_safari_browser(ua) is False

    def test_edge(self):
        """Edge is not Safari"""
        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
        assert is_safari_browser(ua) is False

    def test_firefox(self):
        """Firefox is not Safari"""
        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0"
        assert is_safari_browser(ua) is False

    def test_chrome_ios(self):
        """iOS Chrome (still detected as iOS device)"""
        ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1"
        # iOS devices are always treated as Safari-like due to WebKit
        assert is_safari_browser(ua) is True

    def test_empty_user_agent(self):
        """空のUser-Agent"""
        assert is_safari_browser("") is False

    def test_none_user_agent(self):
        """NoneのUser-Agent"""
        assert is_safari_browser(None) is False  # type: ignore

    def test_case_insensitive(self):
        """大文字小文字を区別しない"""
        ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 SAFARI/605.1.15"
        assert is_safari_browser(ua) is True


class TestResolveCookiePolicy:
    """Cookie設定の解決テスト"""

    def test_safari_production(self):
        """Safari + 本番環境"""
        ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1"
        samesite, secure, is_safari = resolve_cookie_policy(ua, is_production=True)

        assert samesite == "lax"
        assert secure is True
        assert is_safari is True

    def test_safari_development(self):
        """Safari + 開発環境"""
        ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1"
        samesite, secure, is_safari = resolve_cookie_policy(ua, is_production=False)

        assert samesite == "lax"
        assert secure is False
        assert is_safari is True

    def test_chrome_production(self):
        """Chrome + 本番環境"""
        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"
        samesite, secure, is_safari = resolve_cookie_policy(ua, is_production=True)

        assert samesite == "none"
        assert secure is True
        assert is_safari is False

    def test_chrome_development(self):
        """Chrome + 開発環境"""
        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"
        samesite, secure, is_safari = resolve_cookie_policy(ua, is_production=False)

        assert samesite == "lax"
        assert secure is False
        assert is_safari is False

    def test_none_user_agent(self):
        """User-AgentがNone"""
        samesite, secure, is_safari = resolve_cookie_policy(None, is_production=True)

        # Noneは非Safariとして扱う
        assert is_safari is False
        assert samesite == "none"
        assert secure is True


class TestPasswordTruncation:
    """パスワード72バイト切り詰めのテスト"""

    def test_short_password(self):
        """短いパスワードはそのまま"""
        password = "short"
        result = _truncate_password(password)
        assert result == "short"

    def test_exactly_72_bytes(self):
        """ちょうど72バイトはそのまま"""
        password = "a" * 72
        result = _truncate_password(password)
        assert result == password

    def test_longer_than_72_bytes(self):
        """72バイトより長いパスワードは切り詰められる"""
        password = "a" * 100
        result = _truncate_password(password)
        assert len(result.encode("utf-8")) <= 72

    def test_multibyte_characters(self):
        """マルチバイト文字を含むパスワード"""
        # 日本語文字はUTF-8で3バイト
        password = "あ" * 30  # 90バイト
        result = _truncate_password(password)

        # 72バイト以下に収まる
        assert len(result.encode("utf-8")) <= 72
        # 文字境界で切れている（デコード可能）
        result.encode("utf-8")  # Should not raise

    def test_mixed_characters(self):
        """ASCII文字とマルチバイト文字の混在"""
        password = "password" + "日本語" * 20  # 8 + 60 = 68バイト超過
        result = _truncate_password(password)

        assert len(result.encode("utf-8")) <= 72
        result.encode("utf-8")  # Should not raise


class TestPasswordHashVerify:
    """パスワードハッシュ化と検証のテスト"""

    def test_hash_and_verify(self):
        """基本的なハッシュ化と検証"""
        password = "testpassword123"
        hashed = get_password_hash(password)

        assert hashed != password
        assert verify_password(password, hashed) is True

    def test_wrong_password(self):
        """間違ったパスワードの検証"""
        password = "testpassword123"
        hashed = get_password_hash(password)

        assert verify_password("wrongpassword", hashed) is False

    def test_long_password(self):
        """長いパスワードのハッシュ化と検証"""
        password = "a" * 100
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_unicode_password(self):
        """Unicode文字を含むパスワード"""
        password = "日本語パスワード123"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_empty_password(self):
        """空のパスワード"""
        password = ""
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True
        assert verify_password("notempty", hashed) is False

    def test_special_characters(self):
        """特殊文字を含むパスワード"""
        password = "p@$$w0rd!#$%^&*()"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_invalid_hash_format(self):
        """不正なハッシュフォーマット"""
        # 不正なハッシュに対してはFalseを返す（例外は発生しない）
        assert verify_password("password", "invalid_hash") is False

    def test_hash_consistency(self):
        """同じパスワードでも異なるハッシュが生成される（salt）"""
        password = "testpassword"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        assert hash1 != hash2  # Different salts
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestJWTToken:
    """JWTトークンの生成と検証のテスト"""

    def test_create_and_decode_token(self):
        """基本的なトークン生成とデコード"""
        data = {"sub": "user123", "role": "admin"}
        token = create_access_token(data)

        decoded = decode_access_token(token)

        assert decoded is not None
        assert decoded["sub"] == "user123"
        assert decoded["role"] == "admin"
        assert "exp" in decoded

    def test_token_with_custom_expiry(self):
        """カスタム有効期限のトークン"""
        data = {"sub": "user123"}
        expires = timedelta(hours=1)
        token = create_access_token(data, expires_delta=expires)

        decoded = decode_access_token(token)

        assert decoded is not None
        assert decoded["sub"] == "user123"

    def test_expired_token(self):
        """期限切れトークンのデコード"""
        data = {"sub": "user123"}
        # 負の有効期限で即座に期限切れ
        expires = timedelta(seconds=-10)
        token = create_access_token(data, expires_delta=expires)

        decoded = decode_access_token(token)

        assert decoded is None

    def test_invalid_token(self):
        """不正なトークンのデコード"""
        decoded = decode_access_token("invalid.token.string")
        assert decoded is None

    def test_tampered_token(self):
        """改ざんされたトークンのデコード"""
        data = {"sub": "user123"}
        token = create_access_token(data)

        # トークンを改ざん
        parts = token.split(".")
        parts[1] = parts[1][:-5] + "XXXXX"  # ペイロード部分を改変
        tampered_token = ".".join(parts)

        decoded = decode_access_token(tampered_token)
        assert decoded is None

    def test_empty_token(self):
        """空のトークンのデコード"""
        decoded = decode_access_token("")
        assert decoded is None

    def test_original_data_not_modified(self):
        """元のデータが変更されない"""
        data = {"sub": "user123"}
        original_data = data.copy()

        create_access_token(data)

        assert data == original_data
