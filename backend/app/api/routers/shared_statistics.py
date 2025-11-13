from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.routers.statistics import get_all_statistics
from app.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.shared_statistics import (
    SharedStatisticsCreate,
    SharedStatisticsRead,
    SharedStatisticsResponse,
)
from app.services.deck_distribution_service import deck_distribution_service
from app.services.duel_service import duel_service
from app.services.shared_statistics_service import shared_statistics_service

router = APIRouter(prefix="/shared-statistics", tags=["shared-statistics"])


@router.post(
    "/", response_model=SharedStatisticsRead, status_code=status.HTTP_201_CREATED
)
def create_shared_statistics_link(
    shared_stats_in: SharedStatisticsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    ユーザーの統計情報への共有リンクを生成します。
    """
    # 既存の統計データが存在するか確認
    existing_stats = deck_distribution_service.get_deck_distribution_monthly(
        db=db,
        user_id=current_user.id,
        year=shared_stats_in.year,
        month=shared_stats_in.month,
        game_mode=shared_stats_in.game_mode,
    )
    if not existing_stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定された年月とゲームモードの統計データが見つかりません。",
        )

    # 共有リンクを生成
    shared_link = shared_statistics_service.create_shared_statistics(
        db=db, user_id=current_user.id, shared_stats_in=shared_stats_in
    )
    return shared_link


@router.get("/{share_id}", response_model=SharedStatisticsResponse)
def get_shared_statistics(
    share_id: str,
    my_deck_id: Optional[int] = Query(None, description="使用デッキでフィルター"),
    opponent_deck_id: Optional[int] = Query(None, description="相手デッキでフィルター"),
    range_start: Optional[int] = Query(None, description="範囲指定：開始試合数"),
    range_end: Optional[int] = Query(None, description="範囲指定：終了試合数"),
    db: Session = Depends(get_db),
):
    """共有IDを使用して統計データを取得"""
    shared_link = shared_statistics_service.get_by_share_id(db, share_id=share_id)

    if not shared_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="共有リンクが見つかりません"
        )

    if shared_link.expires_at:
        expires_at = shared_link.expires_at
        # Ensure expires_at is timezone-aware for comparison
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="共有リンクの有効期限が切れています",
            )

    statistics_data = get_all_statistics(
        db=db,
        current_user=shared_link.user,
        year=shared_link.year,  # type: ignore[arg-type]
        month=shared_link.month,  # type: ignore[arg-type]
        my_deck_id=my_deck_id,
        opponent_deck_id=opponent_deck_id,
        range_start=range_start,
        range_end=range_end,
    )

    return SharedStatisticsResponse(
        id=shared_link.id,  # type: ignore[arg-type]
        share_id=shared_link.share_id,  # type: ignore[arg-type]
        user_id=shared_link.user_id,  # type: ignore[arg-type]
        year=shared_link.year,  # type: ignore[arg-type]
        month=shared_link.month,  # type: ignore[arg-type]
        game_mode=shared_link.game_mode,  # type: ignore[arg-type]
        created_at=shared_link.created_at,  # type: ignore[arg-type]
        expires_at=shared_link.expires_at,  # type: ignore[arg-type]
        statistics_data=statistics_data,
    )


@router.delete("/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shared_statistics_link(
    share_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    共有リンクを削除します。
    """
    success = shared_statistics_service.delete_shared_statistics(
        db, share_id, current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="共有リンクが見つからないか、削除する権限がありません。",
        )


@router.get("/{share_id}/export/csv")
def export_shared_duels_csv(
    share_id: str,
    year: Optional[int] = Query(None, description="年でフィルタリング"),
    month: Optional[int] = Query(None, description="月でフィルタリング"),
    game_mode: Optional[str] = Query(None, description="ゲームモードでフィルタリング"),
    db: Session = Depends(get_db),
):
    """
    共有IDを使用してデュエルデータをCSV形式でエクスポート
    """
    shared_link = shared_statistics_service.get_by_share_id(db, share_id)

    if not shared_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="共有リンクが見つかりません。"
        )

    # 有効期限の確認
    if shared_link.expires_at:
        expires_at = shared_link.expires_at
        # Ensure expires_at is timezone-aware for comparison
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="この共有リンクは期限切れです。",
            )

    user_id = shared_link.user_id

    # If year, month, or game_mode are not provided in query, use the ones from the shared link
    target_year = year if year is not None else shared_link.year
    target_month = month if month is not None else shared_link.month
    target_game_mode = game_mode if game_mode is not None else shared_link.game_mode

    try:
        csv_data = duel_service.export_duels_to_csv(
            db=db,
            user_id=user_id,  # type: ignore[arg-type]
            year=target_year,  # type: ignore[arg-type]
            month=target_month,  # type: ignore[arg-type]
            game_mode=target_game_mode,  # type: ignore[arg-type]
        )

        filename = f"duels_{target_year}_{target_month}.csv"

        response = StreamingResponse(
            iter([csv_data]),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"CSV export failed: {str(e)}",
        ) from e
