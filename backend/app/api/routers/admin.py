"""
管理者専用APIエンドポイント
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.scripts.merge_archived_decks import run_merge

# ルーター定義
router = APIRouter(prefix="/admin", tags=["admin"])

# ロガー初期化
logger = logging.getLogger(__name__)


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    管理者権限を持つユーザーかどうかを検証する依存関数

    Args:
        current_user: 現在のログインユーザー

    Returns:
        管理者ユーザー

    Raises:
        HTTPException: 管理者権限がない場合
    """
    if not current_user.is_admin:
        logger.warning(
            f"Non-admin user {current_user.username} attempted to access admin endpoint"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )

    return current_user


@router.post("/merge-archived-decks")
def merge_archived_decks(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    重複するアーカイブ済みデッキをマージする

    認証: ログインユーザーが管理者権限を持っている必要があります

    実行手順:
    1. 全ユーザーのアーカイブ済みデッキ（active=False）を取得
    2. 同名のデッキをグループ化
    3. 最も古いデッキに対戦履歴をマージ
    4. 重複デッキを削除

    Returns:
        処理結果のメッセージ
    """
    logger.info(
        f"Starting merge archived decks operation via API by admin user: {admin_user.username}"
    )

    try:
        run_merge(db)
        logger.info("Merge archived decks operation completed successfully")
        return {
            "success": True,
            "message": "Archived decks merged successfully",
        }
    except Exception as e:
        logger.error(f"Error during merge operation: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during merge operation: {str(e)}",
        )
