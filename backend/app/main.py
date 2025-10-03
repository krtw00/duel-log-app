"""
メインアプリケーション
"""
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import os
import re

from app.api.routers import decks, users, duels, auth, me, statistics
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
# 環境変数から許可するオリジンを取得
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

# 複数のオリジンをサポート（カンマ区切り）
allowed_origins = [origin.strip() for origin in frontend_url.split(",")]

# 開発環境の場合はlocalhostを追加
if settings.ENVIRONMENT == "development":
    allowed_origins.extend([
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ])

print(f"Allowed CORS origins: {allowed_origins}")

# 許可するオリジンのパターン（正規表現）
allowed_patterns = [
    r"^https://.*\.vercel\.app$",  # すべてのVercelドメイン
    r"^http://localhost:\d+$",      # ローカルホスト
    r"^http://127\.0\.0\.1:\d+$",  # 127.0.0.1
]

def is_allowed_origin(origin: str) -> bool:
    """
    オリジンが許可されているか確認
    
    Args:
        origin: チェックするオリジン
        
    Returns:
        許可されている場合True
    """
    # 明示的に許可されたオリジンリストをチェック
    if origin in allowed_origins:
        return True
    
    # パターンマッチング
    for pattern in allowed_patterns:
        if re.match(pattern, origin):
            return True
    
    return False

# 標準のCORSミドルウェアを追加（基本的な設定用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# カスタムCORSミドルウェア（動的なVercelプレビューURL対応）
@app.middleware("http")
async def dynamic_cors_middleware(request: Request, call_next):
    """
    動的なCORSミドルウェア
    Vercelのプレビューデプロイメントなど、動的に生成されるURLに対応
    """
    origin = request.headers.get("origin")
    
    # プリフライトリクエスト（OPTIONS）の処理
    if request.method == "OPTIONS":
        if origin and is_allowed_origin(origin):
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Max-Age": "3600",
                }
            )
    
    # 通常のリクエスト処理
    response = await call_next(request)
    
    # オリジンが許可されている場合、CORSヘッダーを追加
    if origin and is_allowed_origin(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

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
app.include_router(statistics.router)


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
