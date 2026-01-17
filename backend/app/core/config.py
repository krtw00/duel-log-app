"""
アプリケーション設定
"""

from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """アプリケーション設定"""

    # アプリケーション設定
    APP_NAME: str = Field(default="Duel Log API", description="アプリケーション名")
    APP_VERSION: str = Field(default="1.0.0", description="アプリケーションバージョン")
    DEBUG: bool = Field(default=False, description="デバッグモード")
    ENVIRONMENT: str = Field(
        default="production", description="実行環境 (development/production)"
    )

    # データベース設定
    DATABASE_URL: str = Field(..., description="データベース接続URL")
    DATABASE_ECHO: bool = Field(default=False, description="SQLログ出力")

    # JWT設定（OBSトークン用に維持）
    SECRET_KEY: str = Field(..., min_length=32, description="JWT署名用秘密鍵")
    ALGORITHM: str = Field(default="HS256", description="JWT署名アルゴリズム")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=10080, ge=1, description="アクセストークン有効期限（分）"
    )

    # Supabase設定
    SUPABASE_URL: str = Field(..., description="SupabaseプロジェクトURL")
    SUPABASE_ANON_KEY: str = Field(..., description="Supabase匿名キー（公開キー）")
    SUPABASE_JWT_SECRET: str = Field(
        ..., description="Supabase JWT署名検証用シークレット"
    )
    SUPABASE_SERVICE_ROLE_KEY: str | None = Field(
        default=None,
        description="Supabase Service Role Key（管理者パスワードリセット用）",
    )

    # CORS設定
    CORS_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            # "https://your-production-domain.com" # 本番環境のドメイン
        ],
        description="許可するオリジン",
    )

    # フロントエンドURL
    FRONTEND_URL: str = Field(
        default="http://localhost:5173", description="フロントエンドのURL"
    )

    # CORS許可オリジンリスト（明示的な許可リスト）
    # カンマ区切りで複数指定可能: "https://app.example.com,https://preview.example.com"
    # 設定されている場合はこれを優先、なければFRONTEND_URLをフォールバック
    ALLOWED_ORIGINS: str | None = Field(
        default=None,
        description="許可するCORSオリジン（カンマ区切り）。本番環境では明示的に設定すること。",
    )

    # Vercel等のプレビュー環境用の正規表現パターン（開発環境のみ有効）
    # 本番環境ではセキュリティのため無効化される
    ALLOWED_ORIGIN_REGEX: str | None = Field(
        default=None,
        description="許可するCORSオリジンの正規表現パターン（開発環境のみ有効）",
    )

    # ログ設定
    LOG_LEVEL: str = Field(default="INFO", description="ログレベル")

    # GitHub設定（フィードバック機能用）
    GITHUB_TOKEN: str | None = Field(
        default=None, description="GitHub Personal Access Token for issue creation"
    )
    GITHUB_REPO_OWNER: str = Field(
        default="krtw00", description="GitHub repository owner"
    )
    GITHUB_REPO_NAME: str = Field(
        default="duel-log-app", description="GitHub repository name"
    )

    # 開発者連絡先設定
    DEVELOPER_X_HANDLE: str = Field(
        default="@XrIGT", description="Developer X (Twitter) handle"
    )
    DEVELOPER_X_URL: str = Field(
        default="https://x.com/XrIGT", description="Developer X (Twitter) URL"
    )

    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """ログレベルの検証"""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        v_upper = v.upper()
        if v_upper not in valid_levels:
            raise ValueError(f"LOG_LEVEL must be one of {valid_levels}")
        return v_upper

    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """環境の検証"""
        valid_environments = ["development", "production", "staging"]
        v_lower = v.lower()
        if v_lower not in valid_environments:
            raise ValueError(f"ENVIRONMENT must be one of {valid_environments}")
        return v_lower

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """SECRET_KEYのセキュリティ検証"""
        # プレースホルダーの検出
        insecure_patterns = [
            "your-secret-key",
            "your_secret_key",
            "change-me",
            "changeme",
            "replace-with",
            "example",
            "test-key",
            "demo-key",
        ]

        v_lower = v.lower()
        for pattern in insecure_patterns:
            if pattern in v_lower:
                raise ValueError(
                    f"SECRET_KEYにプレースホルダーが含まれています: '{pattern}'\n"
                    "安全な秘密鍵を生成してください: openssl rand -hex 32"
                )

        # 複雑さのチェック（英数字のみではダメ）
        if v.isalnum():
            raise ValueError(
                "SECRET_KEYは英数字のみでは不十分です。\n"
                "より安全な鍵を生成してください: openssl rand -hex 32"
            )

        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


# グローバル設定インスタンス
settings = Settings()  # type: ignore[call-arg]
