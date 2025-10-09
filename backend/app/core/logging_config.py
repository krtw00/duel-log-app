"""
ロギング設定
"""

import logging
import sys
from typing import Optional


def setup_logging(level: Optional[str] = None) -> None:
    """
    アプリケーション全体のロギングを設定

    Args:
        level: ログレベル（DEBUG, INFO, WARNING, ERROR, CRITICAL）
    """
    log_level = level or "INFO"

    # ログフォーマット
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # 基本設定
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)],
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
