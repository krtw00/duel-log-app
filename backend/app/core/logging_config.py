"""
ロギング設定
"""

import logging
import re
import sys
from typing import Optional


class PIIMaskingFormatter(logging.Formatter):
    """
    個人情報（PII）をマスキングするログフォーマッター

    以下の情報をマスクします：
    - メールアドレス
    - JWTトークン
    """

    def format(self, record: logging.LogRecord) -> str:
        """
        ログレコードをフォーマットし、PIIをマスクする

        Args:
            record: ログレコード

        Returns:
            PIIがマスクされたログメッセージ
        """
        message = super().format(record)

        # メールアドレスをマスク
        message = re.sub(r"[\w\.-]+@[\w\.-]+\.\w+", "***@***.***", message)

        # JWTトークンをマスク（eyJで始まる標準的なJWTパターン）
        message = re.sub(r"eyJ[\w-]+\.[\w-]+\.[\w-]+", "***TOKEN***", message)

        return message


def setup_logging(level: Optional[str] = None) -> None:
    """
    アプリケーション全体のロギングを設定

    Args:
        level: ログレベル（DEBUG, INFO, WARNING, ERROR, CRITICAL）
    """
    log_level = level or "INFO"

    # ログフォーマット
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # PIIMaskingFormatterを使用したハンドラーを作成
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(PIIMaskingFormatter(log_format))

    # 基本設定
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        handlers=[handler],
    )

    # SQLAlchemyのログレベルを調整（開発時以外は警告以上のみ）
    if log_level.upper() != "DEBUG":
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured with level: {log_level}")


def get_logger(name: str) -> logging.Logger:
    """
    ロガーインスタンスを取得

    Args:
        name: ロガー名（通常は__name__を渡す）

    Returns:
        ロガーインスタンス
    """
    return logging.getLogger(name)
