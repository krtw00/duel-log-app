"""
カスタム例外クラス
"""

from typing import Any, Optional


class AppException(Exception):
    """アプリケーション基底例外"""

    def __init__(
        self, message: str, status_code: int = 500, detail: Optional[Any] = None
    ):
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.message)


class NotFoundException(AppException):
    """リソースが見つからない例外"""

    def __init__(
        self, message: str = "リソースが見つかりません", detail: Optional[Any] = None
    ):
        super().__init__(message=message, status_code=404, detail=detail)


class UnauthorizedException(AppException):
    """認証エラー例外"""

    def __init__(self, message: str = "認証が必要です", detail: Optional[Any] = None):
        super().__init__(message=message, status_code=401, detail=detail)


class ForbiddenException(AppException):
    """権限エラー例外"""

    def __init__(
        self, message: str = "アクセス権限がありません", detail: Optional[Any] = None
    ):
        super().__init__(message=message, status_code=403, detail=detail)


class ValidationException(AppException):
    """バリデーションエラー例外"""

    def __init__(self, message: str = "入力値が不正です", detail: Optional[Any] = None):
        super().__init__(message=message, status_code=422, detail=detail)


class ConflictException(AppException):
    """競合エラー例外"""

    def __init__(
        self, message: str = "リソースが競合しています", detail: Optional[Any] = None
    ):
        super().__init__(message=message, status_code=409, detail=detail)


__all__ = [
    "AppException",
    "NotFoundException",
    "UnauthorizedException",
    "ForbiddenException",
    "ValidationException",
    "ConflictException",
]
