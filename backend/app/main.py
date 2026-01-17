"""
メインアプリケーション
"""

import logging
import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.api.routers import (
    admin,
    auth,
    decks,
    duels,
    feedback,
    me,
    shared_statistics,
    statistics,
    users,
)
from app.core.config import settings
from app.core.exception_handlers import (
    app_exception_handler,
    general_exception_handler,
    http_exception_handler,
    sqlalchemy_exception_handler,
    validation_exception_handler,
)
from app.core.exceptions import AppException
from app.core.logging_config import setup_logging
from app.core.rate_limit import limiter

# サービス層の依存性注入設定
from app.services.user_service import UserService


def _get_duel_service():
    """DuelServiceのファクトリー関数（循環依存回避のため遅延インポート）"""
    from app.services.duel_service import duel_service

    return duel_service


UserService.set_duel_service_factory(_get_duel_service)

# ロギング設定
setup_logging(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# FastAPIアプリケーション
app = FastAPI(
    title="Duel Log API",
    description="遊戯王デュエルログ管理API",
    version="1.0.0",
)

# --- レート制限設定 ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS設定 ---
# ## セキュリティポリシー: CORS Origin の厳格化
# 本番環境では、明示的な許可リストのみを受け入れ、ワイルドカードや正規表現は使用しない。
# 開発環境では、localhost/127.0.0.1 の自動展開と正規表現パターンをサポート。
#
# ### オリジン決定の優先順位
# 1. ALLOWED_ORIGINS が設定されている場合は優先的に使用（推奨）
# 2. 未設定の場合は FRONTEND_URL をフォールバック（後方互換性）
if settings.ALLOWED_ORIGINS:
    # カンマ区切りの文字列をリストに変換
    allowed_origins = [
        origin.strip()
        for origin in settings.ALLOWED_ORIGINS.split(",")
        if origin.strip()
    ]
    logger.info(f"Using ALLOWED_ORIGINS: {allowed_origins}")
else:
    # フォールバック: FRONTEND_URLを使用（後方互換性のため）
    allowed_origins = [
        origin.strip() for origin in settings.FRONTEND_URL.split(",") if origin.strip()
    ]
    logger.info(f"ALLOWED_ORIGINS not set, using FRONTEND_URL: {allowed_origins}")

# 開発環境では localhost と 127.0.0.1 のどちらでもアクセスされ得るため、
# 片方だけ許可しているとCORSプリフライトで失敗することがある。
if settings.ENVIRONMENT != "production":
    expanded: list[str] = []
    for origin in allowed_origins:
        expanded.append(origin)
        expanded.append(origin.replace("://localhost", "://127.0.0.1"))
        expanded.append(origin.replace("://127.0.0.1", "://localhost"))
    # 重複排除（順序は保持）
    allowed_origins = list(dict.fromkeys([o for o in expanded if o]))
    logger.info(f"Expanded origins for development: {allowed_origins}")

# ### 正規表現パターンによるオリジン許可（開発環境のみ）
# セキュリティベストプラクティス: 本番環境では正規表現パターンを無効化
# - 開発環境: Vercel等のプレビュー環境URL（例: https://.*\.vercel\.app）を許可可能
# - 本番環境: 正規表現を無効化し、明示的なリストのみを許可（セキュリティ強化）
allow_origin_regex = None
if settings.ENVIRONMENT != "production" and settings.ALLOWED_ORIGIN_REGEX:
    allow_origin_regex = settings.ALLOWED_ORIGIN_REGEX
    logger.info(
        f"Development mode: allowing origin regex pattern: {allow_origin_regex}"
    )
else:
    logger.info("Production mode: origin regex disabled for security")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Cookie", "Set-Cookie"],
    expose_headers=["Set-Cookie"],
)


# --- セキュリティヘッダー設定 ---
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """セキュリティヘッダーを追加するミドルウェア"""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # X-Frame-Options: クリックジャッキング攻撃を防ぐ
        # DENY: すべてのフレーム内での表示を禁止
        # SAMEORIGIN: 同一オリジンのフレーム内でのみ表示を許可
        response.headers["X-Frame-Options"] = "DENY"
        # X-Content-Type-Options: MIMEタイプスニッフィングを防ぐ
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response


app.add_middleware(SecurityHeadersMiddleware)

# --- 例外ハンドラーの登録 ---
# Note: Starlette/FastAPIの型定義ではExceptionHandlerの戻り値が厳密に定義されているため
# type: ignoreを使用しています。実行時には問題なく動作します。
# 全てのエラーレスポンスを統一フォーマット {"message": ..., "detail": ...} で返却
app.add_exception_handler(AppException, app_exception_handler)  # type: ignore[arg-type]
app.add_exception_handler(HTTPException, http_exception_handler)  # type: ignore[arg-type]
app.add_exception_handler(RequestValidationError, validation_exception_handler)  # type: ignore[arg-type]
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)  # type: ignore[arg-type]
app.add_exception_handler(Exception, general_exception_handler)

# --- ルーターの登録 ---
app.include_router(auth.router)
app.include_router(me.router)
app.include_router(users.router)
app.include_router(decks.router)
app.include_router(duels.router)
app.include_router(statistics.router)
app.include_router(shared_statistics.router)
app.include_router(feedback.router)
app.include_router(admin.router)


@app.get("/", tags=["root"])
def root():
    """ルートエンドポイント"""
    return {"message": "Duel Log API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health_check():
    """ヘルスチェックエンドポイント"""
    return {"status": "healthy"}
