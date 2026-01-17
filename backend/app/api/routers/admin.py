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
    DeckTrendsResponse,
    DuelsTimelineResponse,
    ExpiredSharedStatisticsCleanupResponse,
    ExpiredSharedStatisticsScanResponse,
    GameModeStatsDetailResponse,
    OrphanedDataCleanupResponse,
    OrphanedDataScanResponse,
    OrphanedSharedStatisticsCleanupResponse,
    OrphanedSharedStatisticsScanResponse,
    PasswordResetResponse,
    PopularDecksResponse,
    StatisticsOverviewResponse,
    UpdateAdminStatusRequest,
    UpdateAdminStatusResponse,
    UpdateUserStatusRequest,
    UpdateUserStatusResponse,
    UserAdminResponse,
    UserDetailResponse,
    UserRegistrationsResponse,
    UsersListResponse,
)
from app.scripts.merge_archived_decks import run_merge
from app.services.admin_meta_service import AdminMetaService
from app.services.admin_statistics_service import AdminStatisticsService
from app.services.admin_user_service import AdminUserService

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
        "id", pattern="^(id|username|createdat)$", description="ソート項目"
    ),
    order: Optional[str] = Query("asc", pattern="^(asc|desc)$", description="ソート順"),
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


@router.get("/users/{user_id}", response_model=UserDetailResponse)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    ユーザーの詳細情報を取得

    Args:
        user_id: 対象ユーザーのID

    Returns:
        ユーザーの詳細情報（統計情報、機能利用状況を含む）

    Raises:
        HTTPException: ユーザーが存在しない場合
    """
    logger.info(f"Admin user {admin_user.username} requested user detail for {user_id}")

    service = AdminUserService(db)
    user_detail = service.get_user_detail(user_id)

    if not user_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user_detail


@router.put("/users/{user_id}/status", response_model=UpdateUserStatusResponse)
def update_user_status(
    user_id: int,
    request: UpdateUserStatusRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    ユーザーのアカウント状態を更新

    Args:
        user_id: 対象ユーザーのID
        request: 新しい状態（active/suspended/deleted）と理由

    Returns:
        更新されたユーザー情報

    Raises:
        HTTPException: ユーザーが存在しない、自分自身の状態変更、無効な状態
    """
    logger.info(
        f"Admin user {admin_user.username} attempting to update status for user {user_id}"
    )

    # 自分自身の状態を変更しようとしている場合
    if user_id == admin_user.id and request.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot change your own account status to inactive",
        )

    # 有効な状態かチェック
    valid_statuses = {"active", "suspended", "deleted"}
    if request.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
        )

    service = AdminUserService(db)
    result = service.update_user_status(user_id, request.status, request.reason)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    logger.info(f"User {user_id} status updated to {request.status}")
    return result


@router.post("/users/{user_id}/reset-password", response_model=PasswordResetResponse)
async def reset_user_password(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    ユーザーのパスワードリセットメールを送信

    Args:
        user_id: 対象ユーザーのID

    Returns:
        送信結果

    Raises:
        HTTPException: ユーザーが存在しない、メールアドレスが設定されていない
    """
    logger.info(
        f"Admin user {admin_user.username} requesting password reset for user {user_id}"
    )

    service = AdminUserService(db)
    result = await service.reset_user_password(user_id)

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message,
        )

    return result


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


# ========================================
# システム統計
# ========================================


@router.get("/statistics/overview", response_model=StatisticsOverviewResponse)
def get_statistics_overview(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    システム統計の概要を取得

    Returns:
        ユーザー数、デッキ数、対戦数の統計
    """
    logger.info(f"Admin user {admin_user.username} requested statistics overview")
    service = AdminStatisticsService(db)
    return service.get_overview()


@router.get("/statistics/duels-timeline", response_model=DuelsTimelineResponse)
def get_duels_timeline(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
    period: str = Query("daily", pattern="^(daily|monthly)$", description="期間タイプ"),
    days: int = Query(30, ge=1, le=365, description="取得する日数"),
):
    """
    対戦数の推移を取得

    Args:
        period: daily（日別）または monthly（月別）
        days: 取得する日数（最大365）

    Returns:
        日別または月別の対戦数推移
    """
    logger.info(f"Admin user {admin_user.username} requested duels timeline")
    service = AdminStatisticsService(db)
    return service.get_duels_timeline(period=period, days=days)


@router.get("/statistics/user-registrations", response_model=UserRegistrationsResponse)
def get_user_registrations(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
    months: int = Query(12, ge=1, le=24, description="取得する月数"),
):
    """
    ユーザー登録数の推移を取得

    Args:
        months: 取得する月数（最大24）

    Returns:
        月別のユーザー登録数推移
    """
    logger.info(f"Admin user {admin_user.username} requested user registrations")
    service = AdminStatisticsService(db)
    return service.get_user_registrations(months=months)


# ========================================
# メンテナンス
# ========================================


@router.post("/maintenance/scan-orphaned-data", response_model=OrphanedDataScanResponse)
def scan_orphaned_data(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    孤立データをスキャン

    対戦履歴が存在しない相手デッキを検出

    Returns:
        孤立した相手デッキの数
    """
    logger.info(f"Admin user {admin_user.username} scanning orphaned data")
    service = AdminStatisticsService(db)
    orphaned_count = service.scan_orphaned_opponent_decks()
    return OrphanedDataScanResponse(orphaned_opponent_decks=orphaned_count)


@router.post(
    "/maintenance/cleanup-orphaned-data", response_model=OrphanedDataCleanupResponse
)
def cleanup_orphaned_data(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    孤立データをクリーンアップ

    対戦履歴が存在しない相手デッキを削除

    Returns:
        削除したデッキの数
    """
    logger.info(f"Admin user {admin_user.username} cleaning up orphaned data")
    service = AdminStatisticsService(db)
    deleted_count = service.cleanup_orphaned_opponent_decks()
    logger.info(f"Cleaned up {deleted_count} orphaned opponent decks")
    return OrphanedDataCleanupResponse(
        success=True,
        deleted_decks=deleted_count,
        message=f"{deleted_count}個の孤立データを削除しました",
    )


@router.post(
    "/maintenance/scan-orphaned-shared-statistics",
    response_model=OrphanedSharedStatisticsScanResponse,
)
def scan_orphaned_shared_statistics(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    孤立した共有統計をスキャン

    ユーザー削除後に残存した共有統計を検出
    （通常はCASCADE DELETEで削除されるため、過去データや異常系の対応用）

    Returns:
        孤立した共有統計の数
    """
    logger.info(f"Admin user {admin_user.username} scanning orphaned shared statistics")
    service = AdminStatisticsService(db)
    orphaned_count = service.scan_orphaned_shared_statistics()
    return OrphanedSharedStatisticsScanResponse(orphaned_count=orphaned_count)


@router.post(
    "/maintenance/cleanup-orphaned-shared-statistics",
    response_model=OrphanedSharedStatisticsCleanupResponse,
)
def cleanup_orphaned_shared_statistics(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    孤立した共有統計をクリーンアップ

    ユーザー削除後に残存した共有統計を削除

    Returns:
        削除した共有統計の数
    """
    logger.info(
        f"Admin user {admin_user.username} cleaning up orphaned shared statistics"
    )
    service = AdminStatisticsService(db)
    deleted_count = service.cleanup_orphaned_shared_statistics()
    logger.info(f"Cleaned up {deleted_count} orphaned shared statistics")
    return OrphanedSharedStatisticsCleanupResponse(
        success=True,
        deleted_count=deleted_count,
        message=f"{deleted_count}件の孤立した共有統計を削除しました",
    )


@router.post(
    "/maintenance/scan-expired-shared-statistics",
    response_model=ExpiredSharedStatisticsScanResponse,
)
def scan_expired_shared_statistics(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    期限切れの共有統計をスキャン

    Returns:
        期限切れの共有統計の数と最古の期限切れ日時
    """
    logger.info(f"Admin user {admin_user.username} scanning expired shared statistics")
    service = AdminStatisticsService(db)
    expired_count, oldest_expired = service.scan_expired_shared_statistics()
    return ExpiredSharedStatisticsScanResponse(
        expired_count=expired_count, oldest_expired=oldest_expired
    )


@router.post(
    "/maintenance/cleanup-expired-shared-statistics",
    response_model=ExpiredSharedStatisticsCleanupResponse,
)
def cleanup_expired_shared_statistics(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    期限切れの共有統計を一括削除

    Returns:
        削除した共有統計の数
    """
    logger.info(
        f"Admin user {admin_user.username} cleaning up expired shared statistics"
    )
    service = AdminStatisticsService(db)
    deleted_count = service.cleanup_expired_shared_statistics()
    logger.info(f"Cleaned up {deleted_count} expired shared statistics")
    return ExpiredSharedStatisticsCleanupResponse(
        success=True,
        deleted_count=deleted_count,
        message=f"{deleted_count}件の期限切れ共有統計を削除しました",
    )


# ========================================
# メタ分析
# ========================================


@router.get("/meta/popular-decks", response_model=PopularDecksResponse)
def get_popular_decks(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
    days: int = Query(30, ge=0, le=365, description="対象期間（日数、0=全期間）"),
    game_mode: Optional[str] = Query(
        None, pattern="^(RANK|RATE|EVENT|DC)$", description="ゲームモード"
    ),
    min_usage: int = Query(5, ge=1, description="最小使用回数"),
    limit: int = Query(20, ge=1, le=50, description="取得件数上限"),
):
    """
    人気デッキランキングを取得

    相手デッキとしての使用率でランキング表示

    Args:
        days: 対象期間（日数）、0の場合は全期間
        game_mode: ゲームモードでフィルタ（RANK, RATE, EVENT, DC）
        min_usage: 最小使用回数（デフォルト5）
        limit: 取得件数上限（デフォルト20、最大50）

    Returns:
        人気デッキランキング
    """
    logger.info(f"Admin user {admin_user.username} requested popular decks ranking")
    service = AdminMetaService(db)
    return service.get_popular_decks(
        days=days, game_mode=game_mode, min_usage=min_usage, limit=limit
    )


@router.get("/meta/deck-trends", response_model=DeckTrendsResponse)
def get_deck_trends(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
    days: int = Query(30, ge=7, le=90, description="対象期間（日数）"),
    interval: str = Query("daily", pattern="^(daily|weekly)$", description="集計間隔"),
    game_mode: Optional[str] = Query(
        None, pattern="^(RANK|RATE|EVENT|DC)$", description="ゲームモード"
    ),
    top_n: int = Query(5, ge=1, le=10, description="上位N件のデッキを表示"),
):
    """
    デッキ使用率推移を取得

    上位デッキの時系列グラフデータを生成

    Args:
        days: 対象期間（日数）
        interval: 集計間隔（daily, weekly）
        game_mode: ゲームモードでフィルタ
        top_n: 上位N件のデッキを表示

    Returns:
        デッキ使用率推移
    """
    logger.info(f"Admin user {admin_user.username} requested deck trends")
    service = AdminMetaService(db)
    return service.get_deck_trends(
        days=days, interval=interval, game_mode=game_mode, top_n=top_n
    )


@router.get("/meta/game-mode-stats", response_model=GameModeStatsDetailResponse)
def get_game_mode_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
    days: int = Query(30, ge=0, le=365, description="対象期間（日数、0=全期間）"),
):
    """
    ゲームモード別統計を取得

    各ゲームモードの対戦数・ユーザー数を集計

    Args:
        days: 対象期間（日数）、0の場合は全期間

    Returns:
        ゲームモード別統計
    """
    logger.info(f"Admin user {admin_user.username} requested game mode stats")
    service = AdminMetaService(db)
    return service.get_game_mode_stats(days=days)


# ========================================
# 後方互換エイリアス（非推奨）
# ========================================
# 注: 以下のエンドポイントは非推奨です。
# フロントエンド移行後に削除予定。
# 新しいエンドポイント名: shared-statistics


@router.post(
    "/maintenance/scan-orphaned-shared-urls",
    response_model=OrphanedSharedStatisticsScanResponse,
    deprecated=True,
)
def scan_orphaned_shared_urls_deprecated(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    [非推奨] 孤立した共有URLをスキャン

    このエンドポイントは非推奨です。
    代わりに /maintenance/scan-orphaned-shared-statistics を使用してください。
    """
    logger.warning(
        f"Admin user {admin_user.username} used deprecated endpoint: scan-orphaned-shared-urls"
    )
    return scan_orphaned_shared_statistics(db, admin_user)


@router.post(
    "/maintenance/cleanup-orphaned-shared-urls",
    response_model=OrphanedSharedStatisticsCleanupResponse,
    deprecated=True,
)
def cleanup_orphaned_shared_urls_deprecated(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    [非推奨] 孤立した共有URLをクリーンアップ

    このエンドポイントは非推奨です。
    代わりに /maintenance/cleanup-orphaned-shared-statistics を使用してください。
    """
    logger.warning(
        f"Admin user {admin_user.username} used deprecated endpoint: cleanup-orphaned-shared-urls"
    )
    return cleanup_orphaned_shared_statistics(db, admin_user)


@router.post(
    "/maintenance/scan-expired-shared-urls",
    response_model=ExpiredSharedStatisticsScanResponse,
    deprecated=True,
)
def scan_expired_shared_urls_deprecated(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    [非推奨] 期限切れの共有URLをスキャン

    このエンドポイントは非推奨です。
    代わりに /maintenance/scan-expired-shared-statistics を使用してください。
    """
    logger.warning(
        f"Admin user {admin_user.username} used deprecated endpoint: scan-expired-shared-urls"
    )
    return scan_expired_shared_statistics(db, admin_user)


@router.post(
    "/maintenance/cleanup-expired-shared-urls",
    response_model=ExpiredSharedStatisticsCleanupResponse,
    deprecated=True,
)
def cleanup_expired_shared_urls_deprecated(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    [非推奨] 期限切れの共有URLを一括削除

    このエンドポイントは非推奨です。
    代わりに /maintenance/cleanup-expired-shared-statistics を使用してください。
    """
    logger.warning(
        f"Admin user {admin_user.username} used deprecated endpoint: cleanup-expired-shared-urls"
    )
    return cleanup_expired_shared_statistics(db, admin_user)
