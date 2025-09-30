import os
from dotenv import load_dotenv
from typing import Optional
import logging

load_dotenv()

logger = logging.getLogger(__name__)


class Settings:
    """アプリケーション設定"""
    
    # データベース設定
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # JWT設定
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    def __init__(self):
        # 必須環境変数のチェック（警告のみ）
        if not self.DATABASE_URL:
            logger.warning("⚠️ DATABASE_URL is not set in environment variables.")
        
        if not self.SECRET_KEY:
            logger.warning("⚠️ SECRET_KEY is not set in environment variables. JWT authentication will not work properly.")
    
    def validate_for_production(self):
        """本番環境用の厳格な検証"""
        errors = []
        
        if not self.DATABASE_URL:
            errors.append("DATABASE_URL is not set")
        
        if not self.SECRET_KEY:
            errors.append("SECRET_KEY is not set")
        
        if len(self.SECRET_KEY) < 32:
            errors.append("SECRET_KEY is too short (minimum 32 characters)")
        
        if errors:
            raise RuntimeError(f"Configuration errors: {', '.join(errors)}")


# グローバル設定インスタンス
settings = Settings()
