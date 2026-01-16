"""
レート制限設定

slowapiを使用してAPIエンドポイントへのリクエスト数を制限
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.core.config import settings


def _get_real_client_ip(request: Request) -> str:
    """
    リアルクライアントIPを取得

    プロキシ/ロードバランサー経由の場合はX-Forwarded-Forヘッダーを参照
    """
    # X-Forwarded-For ヘッダーがある場合（プロキシ経由）
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # 最初のIPがクライアントIP
        return forwarded_for.split(",")[0].strip()

    # X-Real-IP ヘッダーがある場合
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # フォールバック: 直接接続のIP
    return get_remote_address(request)


# Limiterインスタンスを作成
# テスト環境ではレート制限を無効化
limiter = Limiter(
    key_func=_get_real_client_ip,
    default_limits=["200/minute"] if settings.ENVIRONMENT == "production" else [],
    enabled=settings.ENVIRONMENT != "test",
    storage_uri="memory://",  # インメモリストレージ（本番では Redis 推奨）
)


# レート制限の定数定義
class RateLimits:
    """レート制限の定数"""

    # 認証関連（厳しめ）
    AUTH_LOGIN = "5/minute"  # ログイン試行: 1分間に5回
    AUTH_REGISTER = "3/minute"  # 新規登録: 1分間に3回
    AUTH_PASSWORD_RESET = "3/minute"  # パスワードリセット: 1分間に3回

    # フィードバック（スパム防止）
    FEEDBACK = "5/minute"  # フィードバック投稿: 1分間に5回

    # 一般的なAPI（緩め）
    STANDARD = "60/minute"  # 標準API: 1分間に60回
    HEAVY = "30/minute"  # 重い処理: 1分間に30回

    # 管理者API
    ADMIN = "30/minute"  # 管理者API: 1分間に30回
