"""
メインアプリケーション
"""

import logging
import os

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.api.routers import auth, decks, duels, me, shared_statistics, statistics, users
from app.core.config import settings
from app.core.exception_handlers import (
    app_exception_handler,
    general_exception_handler,
    sqlalchemy_exception_handler,
    validation_exception_handler,
)
from app.core.exceptions import AppException
from app.core.logging_config import setup_logging

# ロギング設定
setup_logging(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# FastAPIアプリケーション
app = FastAPI(
    title="Duel Log API",
    description="遊戯王デュエルログ管理API",
    version="1.0.0",
)

# --- CORS設定 ---
# 環境変数から許可するオリジンを取得
# 例: "http://localhost:5173,https://your-production-domain.com"
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [origin.strip() for origin in frontend_url.split(",") if origin.strip()]

logger.info(f"Allowed CORS origins from FRONTEND_URL: {allowed_origins}")

# Vercelのプレビューデプロイメント用の正規表現パターン
# 例: https://duel-log-app-git-feature-branch-your-team.vercel.app
vercel_preview_pattern = r"https://.*\.vercel\.app"
logger.info(f"Allowing CORS for Vercel preview pattern: {vercel_preview_pattern}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=vercel_preview_pattern,
    allow_credentials=True,
    allow_methods=["*"],  # すべてのメソッドを許可
    allow_headers=["*"],  # すべてのヘッダーを許可
)

# --- 例外ハンドラーの登録 ---
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# --- ルーターの登録 ---
app.include_router(auth.router)
app.include_router(me.router)
app.include_router(users.router)
app.include_router(decks.router)
app.include_router(duels.router)
app.include_router(statistics.router)
app.include_router(shared_statistics.router)


@app.get("/", tags=["root"])
def root():
    """ルートエンドポイント"""
    return {"message": "Duel Log API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health_check():
    """ヘルスチェックエンドポイント"""
    return {"status": "healthy"}
