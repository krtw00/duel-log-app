"""
メインアプリケーション
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.api.routers import decks, users, duels, auth, me
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.exceptions import AppException
from app.core.exception_handlers import (
    app_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler,
)

# ロギング設定
setup_logging(level=settings.LOG_LEVEL)

# FastAPIアプリケーション
app = FastAPI(
    title="Duel Log API",
    description="遊戯王デュエルログ管理API",
    version="1.0.0",
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 例外ハンドラーの登録
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# ルーターの登録
app.include_router(auth.router)
app.include_router(me.router)
app.include_router(users.router)
app.include_router(decks.router)
app.include_router(duels.router)


@app.get("/", tags=["root"])
def root():
    """ルートエンドポイント"""
    return {
        "message": "Duel Log API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["health"])
def health_check():
    """ヘルスチェックエンドポイント"""
    return {
        "status": "healthy",
        "database": "connected"
    }
