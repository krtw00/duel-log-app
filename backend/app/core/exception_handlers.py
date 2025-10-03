"""
グローバル例外ハンドラー
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import AppException
import logging

logger = logging.getLogger(__name__)


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
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "message": exc.message,
            "detail": exc.detail,
        }
    )


async def validation_exception_handler(
    request: Request, 
    exc: RequestValidationError
) -> JSONResponse:
    """
    バリデーションエラーハンドラー
    """
    logger.warning(
        f"Validation error occurred",
        extra={
            "errors": exc.errors(),
            "path": request.url.path,
        }
    )
    
    # エラーをJSONシリアライズ可能な形式に変換
    errors = []
    for error in exc.errors():
        errors.append({
            "loc": error["loc"],
            "msg": error["msg"],
            "type": error["type"],
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "message": "入力値が不正です",
            "detail": errors,
        }
    )


async def sqlalchemy_exception_handler(
    request: Request,
    exc: SQLAlchemyError
) -> JSONResponse:
    """
    SQLAlchemyエラーハンドラー
    """
    logger.error(
        f"Database error occurred: {str(exc)}",
        extra={
            "path": request.url.path,
        },
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "message": "データベースエラーが発生しました",
            "detail": "サーバー内部エラー",
        }
    )


async def general_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """
    一般例外ハンドラー（キャッチオール）
    """
    logger.error(
        f"Unexpected error occurred: {str(exc)}",
        extra={
            "path": request.url.path,
        },
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "message": "予期しないエラーが発生しました",
            "detail": str(exc) if logger.level == logging.DEBUG else "サーバー内部エラー",
        }
    )
