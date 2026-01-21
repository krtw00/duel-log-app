"""
品質改善に関するテスト

Issue #314: エラースキーマ統一・ログPII対策・設定バリデーション
"""

import logging
import os
from unittest.mock import patch

import pytest
from fastapi import HTTPException, status
from pydantic import ValidationError

from app.core.config import Settings, validate_settings
from app.core.logging_config import PIIMaskingFormatter
from app.schemas.error import ErrorCode, ErrorResponse


class TestErrorSchema:
    """エラースキーマのテスト"""

    def test_error_response_has_code_field(self):
        """ErrorResponseにcodeフィールドが存在することを確認"""
        error = ErrorResponse(
            message="テストエラー", code=ErrorCode.NOT_FOUND, detail=None
        )

        assert error.message == "テストエラー"
        assert error.code == ErrorCode.NOT_FOUND
        assert error.detail is None

    def test_error_response_code_is_optional(self):
        """codeフィールドがオプショナルであることを確認（後方互換性）"""
        error = ErrorResponse(message="テストエラー", detail=None)

        assert error.message == "テストエラー"
        assert error.code is None
        assert error.detail is None

    def test_error_codes_are_defined(self):
        """エラーコードが定義されていることを確認"""
        assert hasattr(ErrorCode, "UNAUTHORIZED")
        assert hasattr(ErrorCode, "FORBIDDEN")
        assert hasattr(ErrorCode, "NOT_FOUND")
        assert hasattr(ErrorCode, "VALIDATION_ERROR")
        assert hasattr(ErrorCode, "INTERNAL_ERROR")

    def test_http_exception_handler_includes_error_code(self):
        """HTTPExceptionハンドラーがエラーコードを含むことを確認"""
        from fastapi import Request
        from fastapi.responses import JSONResponse

        from app.core.exception_handlers import http_exception_handler

        # HTTPExceptionを直接テスト
        exc = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")

        # Requestオブジェクトをモック
        from unittest.mock import Mock

        mock_request = Mock(spec=Request)
        mock_request.url.path = "/test"
        mock_request.headers = {}

        # ハンドラーを直接呼び出し（同期的に）
        import asyncio

        response = asyncio.run(http_exception_handler(mock_request, exc))

        assert isinstance(response, JSONResponse)
        assert response.status_code == status.HTTP_404_NOT_FOUND

        # レスポンスボディを確認
        import json

        body = json.loads(response.body.decode())
        assert "message" in body
        assert "code" in body
        assert body["code"] == ErrorCode.NOT_FOUND


class TestLoggingPIIMasking:
    """ログのPII対策テスト"""

    def test_email_masking(self):
        """メールアドレスがマスクされることを確認"""
        formatter = PIIMaskingFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="User email: test@example.com",
            args=(),
            exc_info=None,
        )

        formatted = formatter.format(record)
        assert "test@example.com" not in formatted
        assert "***@***.***" in formatted

    def test_jwt_token_masking(self):
        """JWTトークンがマスクされることを確認"""
        formatter = PIIMaskingFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
            args=(),
            exc_info=None,
        )

        formatted = formatter.format(record)
        assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in formatted
        assert "***TOKEN***" in formatted

    def test_password_masking(self):
        """パスワードがマスクされることを確認"""
        formatter = PIIMaskingFormatter()

        # JSON形式のパスワード
        record1 = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg='Login data: {"username": "test", "password": "secret123"}',
            args=(),
            exc_info=None,
        )
        formatted1 = formatter.format(record1)
        assert "secret123" not in formatted1
        assert "***PASSWORD***" in formatted1

        # キー=値形式のパスワード
        record2 = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="User login: password=secret123",
            args=(),
            exc_info=None,
        )
        formatted2 = formatter.format(record2)
        assert "secret123" not in formatted2
        assert "***PASSWORD***" in formatted2

    def test_multiple_pii_masking(self):
        """複数のPIIが同時にマスクされることを確認"""
        formatter = PIIMaskingFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="User login: email=test@example.com, password=secret123, token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.test",
            args=(),
            exc_info=None,
        )

        formatted = formatter.format(record)
        assert "test@example.com" not in formatted
        assert "secret123" not in formatted
        assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in formatted
        assert "***@***.***" in formatted
        assert "***PASSWORD***" in formatted
        assert "***TOKEN***" in formatted


class TestConfigValidation:
    """設定バリデーションのテスト"""

    def test_validate_settings_success(self):
        """正常な設定でバリデーションが成功することを確認"""
        # 環境変数が既に設定されている前提
        settings = validate_settings()
        assert settings is not None
        assert isinstance(settings, Settings)

    def test_missing_required_field_raises_error(self):
        """必須フィールドが不足している場合にエラーが発生することを確認"""
        with patch.dict(os.environ, {}, clear=True):
            # 必須環境変数を全て削除し、.envファイルからの読み込みも無効化
            with patch.object(Settings, "model_config", {**Settings.model_config, "env_file": None}):
                with pytest.raises(SystemExit):
                    validate_settings()

    def test_secret_key_validation(self):
        """SECRET_KEYのバリデーションが機能することを確認"""
        # プレースホルダーが検出される
        with patch.dict(
            os.environ,
            {
                "DATABASE_URL": "sqlite:///./test.db",
                "SUPABASE_URL": "http://localhost:55321",
                "SUPABASE_ANON_KEY": "test-key",
                "SUPABASE_JWT_SECRET": "test-secret",
                "SECRET_KEY": "your-secret-key-here",  # プレースホルダー
            },
        ):
            with pytest.raises((ValidationError, SystemExit)):
                Settings()  # type: ignore[call-arg]

    def test_log_level_validation(self):
        """LOG_LEVELのバリデーションが機能することを確認"""
        with patch.dict(
            os.environ,
            {
                "DATABASE_URL": "sqlite:///./test.db",
                "SUPABASE_URL": "http://localhost:55321",
                "SUPABASE_ANON_KEY": "test-key",
                "SUPABASE_JWT_SECRET": "test-secret",
                "SECRET_KEY": "a" * 33 + "!",  # 33文字の英数字+記号
                "LOG_LEVEL": "INVALID_LEVEL",  # 不正なログレベル
            },
        ):
            with pytest.raises((ValidationError, SystemExit)):
                Settings()  # type: ignore[call-arg]

    def test_environment_validation(self):
        """ENVIRONMENTのバリデーションが機能することを確認"""
        with patch.dict(
            os.environ,
            {
                "DATABASE_URL": "sqlite:///./test.db",
                "SUPABASE_URL": "http://localhost:55321",
                "SUPABASE_ANON_KEY": "test-key",
                "SUPABASE_JWT_SECRET": "test-secret",
                "SECRET_KEY": "a" * 33 + "!",
                "ENVIRONMENT": "invalid_env",  # 不正な環境
            },
        ):
            with pytest.raises((ValidationError, SystemExit)):
                Settings()  # type: ignore[call-arg]
