"""
管理者専用APIエンドポイント
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_db
from app.models.user import User
from app.schemas.admin import (
    UpdateAdminStatusRequest,
    UpdateAdminStatusResponse,
    UserAdminResponse,
    UsersListResponse,
)
from app.scripts.merge_archived_decks import run_merge

# ルーター定義
router = APIRouter(prefix="/admin", tags=["admin"])

# ロガー初期化
logger = logging.getLogger(__name__)


@router.get("/users", response_model=UsersListResponse)
def get_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
    page: int = Query(1, ge=1, description="ページ番号"),
    per_page: int = Query(20, ge=1, le=100, description="1ページあたりの件数"),
    sort: Optional[str] = Query(
        "id", regex="^(id|username|createdat)$", description="ソート項目"
    ),
    order: Optional[str] = Query("asc", regex="^(asc|desc)$", description="ソート順"),
    search: Optional[str] = Query(None, description="検索クエリ（ユーザー名、メール）"),
    admin_only: Optional[bool] = Query(None, description="管理者のみ表示"),
):
    """
    ユーザー一覧を取得

    Args:
        db: データベースセッション
        admin_user: 管理者ユーザー
        page: ページ番号（デフォルト: 1）
        per_page: 1ページあたりの件数（デフォルト: 20、最大: 100）
        sort: ソート項目（id, username, createdat）
        order: ソート順（asc, desc）
        search: 検索クエリ（ユーザー名、メールで検索）
        admin_only: 管理者のみ表示

    Returns:
        ユーザー一覧とページネーション情報
    """
    logger.info(f"Admin user {admin_user.username} requested user list")

    # ベースクエリ
    query = db.query(User)

    # 検索フィルタ
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                User.username.ilike(search_pattern),
                User.email.ilike(search_pattern),
            )
        )

    # 管理者フィルタ
    if admin_only is not None:
        query = query.filter(User.is_admin == admin_only)

    # 総件数を取得
    total = query.count()

    # ソート
    sort_column = getattr(User, sort)
    if order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # ページネーション
    offset = (page - 1) * per_page
    users = query.offset(offset).limit(per_page).all()

    return UsersListResponse(
        users=[UserAdminResponse.model_validate(user) for user in users],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.put("/users/{user_id}/admin-status", response_model=UpdateAdminStatusResponse)
def update_admin_status(
    user_id: int,
    request: UpdateAdminStatusRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    ユーザーの管理者権限を更新

    Args:
        user_id: 対象ユーザーのID
        request: 管理者権限の設定値
        db: データベースセッション
        admin_user: 実行する管理者ユーザー

    Returns:
        更新されたユーザー情報

    Raises:
        HTTPException: ユーザーが存在しない、自分自身の権限削除、最後の管理者の権限削除
    """
    logger.info(
        f"Admin user {admin_user.username} attempting to update admin status for user {user_id}"
    )

    # 対象ユーザーを取得
    target_user = db.query(User).filter(User.id == user_id).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # 自分自身の管理者権限を削除しようとしている場合
    if target_user.id == admin_user.id and not request.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot remove your own admin privileges",
        )

    # 最後の管理者の権限を削除しようとしている場合
    if target_user.is_admin and not request.is_admin:
        admin_count = db.query(func.count(User.id)).filter(User.is_admin).scalar()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove admin privileges from the last admin user",
            )

    # 管理者権限を更新
    target_user.is_admin = request.is_admin
    db.commit()
    db.refresh(target_user)

    logger.info(
        f"Admin status updated for user {target_user.username}: is_admin={request.is_admin}"
    )

    return UpdateAdminStatusResponse(
        success=True,
        user=UserAdminResponse.model_validate(target_user),
    )


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
        ) from e
