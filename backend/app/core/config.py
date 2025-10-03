"""
アプリケーション設定
"""
import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """アプリケーション設定"""
    
    # アプリケーション設定
    APP_NAME: str = Field(default="Duel Log API", description="アプリケーション名")
    APP_VERSION: str = Field(default="1.0.0", description="アプリケーションバージョン")
    DEBUG: bool = Field(default=False, description="デバッグモード")
    ENVIRONMENT: str = Field(default="production", description="実行環境 (development/production)")
    
    # データベース設定
    DATABASE_URL: str = Field(..., description="データベース接続URL")
    DATABASE_ECHO: bool = Field(default=False, description="SQLログ出力")
    
    # JWT設定
    SECRET_KEY: str = Field(..., min_length=32, description="JWT署名用秘密鍵")
    ALGORITHM: str = Field(default="HS256", description="JWT署名アルゴリズム")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, ge=1, description="アクセストークン有効期限（分）")
    
    # CORS設定
    CORS_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        description="許可するオリジン"
    )
    
    # ログ設定
    LOG_LEVEL: str = Field(default="INFO", description="ログレベル")
    
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
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# グローバル設定インスタンス
settings = Settings()
