"""
グローバル例外ハンドラー

全てのAPIエラーを統一フォーマット {"message": ..., "detail": ...} で返却する。
HTTPExceptionも含め、このハンドラを通すことで一貫したエラーレスポンスを実現。
"""

import logging
import re

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import AppException
from app.schemas.error import ErrorCode

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
            "code": getattr(exc, "code", None),
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
            "code": ErrorCode.VALIDATION_ERROR,
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
            "code": ErrorCode.DATABASE_ERROR,
            "detail": "サーバー内部エラー",
        },
    )

    return add_cors_headers(response, request)


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    HTTPExceptionハンドラー

    FastAPIのHTTPExceptionを統一フォーマットに変換する。
    元の {\"detail\": ...} 形式を {\"message\": ..., \"code\": ..., \"detail\": ...} に変換。
    """
    # ログレベルはステータスコードに応じて調整
    if exc.status_code >= 500:
        logger.error(
            f"HTTP {exc.status_code}: {exc.detail}",
            extra={"path": request.url.path},
        )
    elif exc.status_code >= 400:
        logger.warning(
            f"HTTP {exc.status_code}: {exc.detail}",
            extra={"path": request.url.path},
        )

    # ステータスコードに応じたエラーコードを設定
    error_code_map = {
        400: ErrorCode.BAD_REQUEST,
        401: ErrorCode.UNAUTHORIZED,
        403: ErrorCode.FORBIDDEN,
        404: ErrorCode.NOT_FOUND,
        422: ErrorCode.VALIDATION_ERROR,
        500: ErrorCode.INTERNAL_ERROR,
    }
    error_code = error_code_map.get(exc.status_code, ErrorCode.INTERNAL_ERROR)

    response = JSONResponse(
        status_code=exc.status_code,
        content={
            "message": exc.detail if isinstance(exc.detail, str) else str(exc.detail),
            "code": error_code,
            "detail": None,
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
            "code": ErrorCode.INTERNAL_ERROR,
            "detail": (
                str(exc) if logger.level == logging.DEBUG else "サーバー内部エラー"
            ),
        },
    )

    return add_cors_headers(response, request)
