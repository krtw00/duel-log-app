"""
グローバル例外ハンドラー
"""

import logging
import re

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import AppException

logger = logging.getLogger(__name__)


def add_cors_headers(response: JSONResponse, request: Request) -> JSONResponse:
    """
    レスポンスにCORSヘッダーを追加

    Args:
        response: JSONResponse
        request: Request

    Returns:
        CORSヘッダーが追加されたJSONResponse
    """
    origin = request.headers.get("origin")

    if not origin:
        return response

    # 許可するオリジンのパターン
    allowed_patterns = [
        r"^https://.*\.vercel\.app$",  # すべてのVercelドメイン
        r"^http://localhost:\d+$",  # ローカルホスト
        r"^http://127\.0\.0\.1:\d+$",  # 127.0.0.1
    ]

    # FRONTEND_URL環境変数からも取得
    import os

    frontend_url = os.getenv("FRONTEND_URL", "")
    allowed_origins = [
        origin.strip() for origin in frontend_url.split(",") if origin.strip()
    ]

    # オリジンが許可されているかチェック
    is_allowed = False

    # 明示的なリストをチェック
    if origin in allowed_origins:
        is_allowed = True

    # パターンマッチング
    if not is_allowed:
        for pattern in allowed_patterns:
            if re.match(pattern, origin):
                is_allowed = True
                break

    # 許可されている場合、CORSヘッダーを追加
    if is_allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        )
        response.headers["Access-Control-Allow-Headers"] = (
            "Content-Type, Authorization, Accept, Origin, User-Agent, X-Requested-With"
        )
        response.headers["Vary"] = "Origin"

    return response


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """
    カスタムアプリケーション例外ハンドラー
    """
    logger.error(
        f"AppException occurred: {exc.message}",
        extra={
            "status_code": exc.status_code,
            "detail": exc.detail,
            "path": request.url.path,
        },
    )

    response = JSONResponse(
        status_code=exc.status_code,
        content={
            "message": exc.message,
            "detail": exc.detail,
        },
    )

    return add_cors_headers(response, request)


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    バリデーションエラーハンドラー
    """
    logger.warning(
        "Validation error occurred",
        extra={
            "errors": exc.errors(),
            "path": request.url.path,
        },
    )

    # エラーをJSONシリアライズ可能な形式に変換
    errors = []
    for error in exc.errors():
        errors.append(
            {
                "loc": error["loc"],
                "msg": error["msg"],
                "type": error["type"],
            }
        )

    response = JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "message": "入力値が不正です",
            "detail": errors,
        },
    )

    return add_cors_headers(response, request)


async def sqlalchemy_exception_handler(
    request: Request, exc: SQLAlchemyError
) -> JSONResponse:
    """
    SQLAlchemyエラーハンドラー
    """
    logger.error(
        f"Database error occurred: {str(exc)}",
        extra={
            "path": request.url.path,
        },
        exc_info=True,
    )

    response = JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "message": "データベースエラーが発生しました",
            "detail": "サーバー内部エラー",
        },
    )

    return add_cors_headers(response, request)


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    一般例外ハンドラー（キャッチオール）
    """
    logger.error(
        f"Unexpected error occurred: {str(exc)}",
        extra={
            "path": request.url.path,
        },
        exc_info=True,
    )

    response = JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "message": "予期しないエラーが発生しました",
            "detail": (
                str(exc) if logger.level == logging.DEBUG else "サーバー内部エラー"
            ),
        },
    )

    return add_cors_headers(response, request)
