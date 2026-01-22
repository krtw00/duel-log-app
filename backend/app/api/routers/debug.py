"""
デバッグ用API（開発環境のみ）

画面解析ログの保存など、開発時のデバッグ機能を提供
"""

import base64
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Body
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/debug", tags=["debug"])

# ログ保存先ディレクトリ（backendディレクトリ直下）
# Docker環境: /app/logs/screen-analysis/ = ./backend/logs/screen-analysis/
# __file__ = /app/app/api/routers/debug.py
# .parent x 4 = /app/
LOG_DIR = Path(__file__).parent.parent.parent.parent / "logs" / "screen-analysis"
IMAGE_DIR = Path(__file__).parent.parent.parent.parent / "logs" / "debug-images"


class SaveLogRequest(BaseModel):
    """ログ保存リクエスト"""

    content: str
    filename: str | None = None


class SaveLogResponse(BaseModel):
    """ログ保存レスポンス"""

    success: bool
    filepath: str
    message: str


@router.post("/logs/screen-analysis", response_model=SaveLogResponse)
async def save_screen_analysis_log(
    request: SaveLogRequest = Body(...),
) -> SaveLogResponse:
    """
    画面解析ログをファイルに保存

    保存先: {project_root}/logs/screen-analysis/
    """
    try:
        # ディレクトリを作成
        LOG_DIR.mkdir(parents=True, exist_ok=True)

        # ファイル名を生成
        if request.filename:
            filename = request.filename
        else:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"screen-analysis-log_{timestamp}.txt"

        # ファイルに保存
        filepath = LOG_DIR / filename
        filepath.write_text(request.content, encoding="utf-8")

        logger.info(f"Screen analysis log saved: {filepath}")

        return SaveLogResponse(
            success=True,
            filepath=str(filepath),
            message=f"ログを保存しました: {filename}",
        )

    except Exception as e:
        logger.error(f"Failed to save screen analysis log: {e}")
        return SaveLogResponse(
            success=False,
            filepath="",
            message=f"ログの保存に失敗しました: {str(e)}",
        )


class SaveImageRequest(BaseModel):
    """デバッグ画像保存リクエスト"""

    imageType: str  # 'full', 'coinRoi', 'leftCrownRoi', 'rightCrownRoi'
    dataUrl: str  # base64 JPEG data URL
    frameCount: int
    timestamp: int
    metadata: dict[str, Any] | None = None


class SaveImageResponse(BaseModel):
    """デバッグ画像保存レスポンス"""

    success: bool
    filepath: str
    message: str


@router.post("/images/screen-analysis", response_model=SaveImageResponse)
async def save_screen_analysis_image(
    request: SaveImageRequest = Body(...),
) -> SaveImageResponse:
    """
    画面解析デバッグ画像をファイルに保存

    保存先: {project_root}/logs/debug-images/{session_date}/
    ファイル名: {timestamp}_{frameCount}_{imageType}_{label}.jpg
    """
    try:
        # セッションごとのディレクトリ（日付＋時間ベース）
        session_date = datetime.fromtimestamp(request.timestamp / 1000).strftime(
            "%Y%m%d_%H"
        )
        session_dir = IMAGE_DIR / session_date
        session_dir.mkdir(parents=True, exist_ok=True)

        # メタデータからラベルを取得
        label = ""
        if request.metadata:
            if "label" in request.metadata:
                label = f"_{request.metadata['label']}"
            if "leftGold" in request.metadata and "rightGold" in request.metadata:
                label += f"_L{request.metadata['leftGold']}_R{request.metadata['rightGold']}"

        # ファイル名を生成
        timestamp_str = datetime.fromtimestamp(request.timestamp / 1000).strftime(
            "%H%M%S_%f"
        )[:13]  # HHMMSSmmm
        filename = f"{timestamp_str}_f{request.frameCount:06d}_{request.imageType}{label}.jpg"

        # data URL からバイナリデータを抽出
        # フォーマット: "data:image/jpeg;base64,..."
        if "," in request.dataUrl:
            base64_data = request.dataUrl.split(",", 1)[1]
        else:
            base64_data = request.dataUrl

        image_data = base64.b64decode(base64_data)

        # ファイルに保存
        filepath = session_dir / filename
        filepath.write_bytes(image_data)

        logger.debug(f"Debug image saved: {filepath}")

        return SaveImageResponse(
            success=True,
            filepath=str(filepath),
            message=f"画像を保存しました: {filename}",
        )

    except Exception as e:
        logger.error(f"Failed to save debug image: {e}")
        return SaveImageResponse(
            success=False,
            filepath="",
            message=f"画像の保存に失敗しました: {str(e)}",
        )
