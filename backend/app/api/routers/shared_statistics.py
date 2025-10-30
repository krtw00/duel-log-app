from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import extract
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db.session import get_db
from app.models.duel import Duel
from app.models.user import User
from app.schemas.duel import DuelWithDeckNames  # Import DuelWithDeckNames
from app.schemas.shared_statistics import SharedStatisticsCreate, SharedStatisticsRead
from app.services.deck_distribution_service import deck_distribution_service
from app.services.duel_service import duel_service
from app.services.general_stats_service import general_stats_service
from app.services.matchup_service import matchup_service
from app.services.shared_statistics_service import shared_statistics_service
from app.services.time_series_service import time_series_service
from app.services.win_rate_service import win_rate_service

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


@router.get("/{share_id}", response_model=Dict[str, Any])
def get_shared_statistics(
    share_id: str,
    year: Optional[int] = Query(None, description="統計データを取得する年"),
    month: Optional[int] = Query(None, description="統計データを取得する月"),
    period_type: Optional[str] = Query("all", description="期間タイプ: all, range"),
    range_start: Optional[int] = Query(None, description="範囲指定の開始位置"),
    range_end: Optional[int] = Query(None, description="範囲指定の終了位置"),
    my_deck_id: Optional[int] = Query(None, description="自分のデッキでフィルター"),
    db: Session = Depends(get_db),
):
    """
    共有IDを使用して統計情報を取得します。
    """
    shared_link = shared_statistics_service.get_by_share_id(db, share_id)

    if not shared_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="共有リンクが見つかりません。"
        )

    # 有効期限の確認
    if shared_link.expires_at and shared_link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,  # 410 Gone for expired resource
            detail="この共有リンクは期限切れです。",
        )

    # 共有リンク作成時に指定されたゲームモードではなく、すべてのゲームモードのデータを取得
    # フロントエンドから渡されたyearとmonthを使用
    target_year = year if year is not None else shared_link.year
    target_month = month if month is not None else shared_link.month

    user_id = shared_link.user_id

    response_data = {}

    # すべてのゲームモードのデータを取得（ダッシュボード + 統計）
    all_game_modes = ["RANK", "RATE", "EVENT", "DC"]
    for mode in all_game_modes:
        # 期間タイプに応じてyear/monthを調整
        # 'all' = 全体（年月でフィルター）、'range' = 範囲指定
        filter_year = target_year if period_type == "all" else None
        filter_month = target_month if period_type == "all" else None

        # ダッシュボード用の全体統計
        # Note: get_overall_stats doesn't support range_start/range_end or my_deck_id
        # We need to manually filter duels instead for these cases
        if period_type == "all" and not my_deck_id:
            overall_stats = general_stats_service.get_overall_stats(
                db=db,
                user_id=user_id,
                year=filter_year,
                month=filter_month,
                game_mode=mode,
            )
        else:
            # For range periods or my_deck_id filter, manually calculate stats from filtered duels
            overall_stats = {
                "total_duels": 0,
                "win_rate": 0.0,
                "first_turn_win_rate": 0.0,
                "second_turn_win_rate": 0.0,
                "coin_win_rate": 0.0,
                "go_first_rate": 0.0,
            }

        # ダッシュボード用のデュエルリスト取得
        duel_query = db.query(Duel).filter(
            Duel.user_id == user_id,
            Duel.game_mode == mode,
        )

        # 期間フィルター
        if period_type == "all":
            duel_query = duel_query.filter(
                extract("year", Duel.played_date) == target_year,
                extract("month", Duel.played_date) == target_month,
            )

        # デッキフィルター
        if my_deck_id:
            duel_query = duel_query.filter(Duel.deck_id == my_deck_id)

        duel_query = duel_query.order_by(Duel.played_date.desc())

        # 範囲指定の場合
        if period_type == "range" and range_start and range_end:
            all_duels = duel_query.all()
            dashboard_duels_query = all_duels[range_start - 1 : range_end]
        else:
            dashboard_duels_query = duel_query.all()

        # デッキ情報を結合
        from app.models.deck import Deck

        deck_ids = list(
            set(
                [d.deck_id for d in dashboard_duels_query if d.deck_id]
                + [
                    d.opponent_deck_id
                    for d in dashboard_duels_query
                    if d.opponent_deck_id
                ]
            )
        )
        if deck_ids:
            decks = db.query(Deck).filter(Deck.id.in_(deck_ids)).all()
            deck_map = {deck.id: deck for deck in decks}
        else:
            deck_map = {}

        for duel in dashboard_duels_query:
            duel.deck = deck_map.get(duel.deck_id) if duel.deck_id else None
            duel.opponent_deck = (
                deck_map.get(duel.opponent_deck_id) if duel.opponent_deck_id else None
            )
            duel.deck_name = duel.deck.name if duel.deck else "不明"
            duel.opponent_deck_name = (
                duel.opponent_deck.name if duel.opponent_deck else "不明"
            )

        # DuelモデルをPydanticスキーマに変換
        serialized_duels = []
        for d in dashboard_duels_query:
            duel_dict = {
                "id": d.id,
                "user_id": d.user_id,
                "deck_id": d.deck_id,
                "opponent_deck_id": d.opponent_deck_id,
                "won_coin_toss": d.won_coin_toss,
                "is_going_first": d.is_going_first,
                "is_win": d.is_win,
                "game_mode": d.game_mode,
                "rank": d.rank,
                "rate_value": d.rate_value,
                "dc_value": d.dc_value,
                "played_date": d.played_date,
                "notes": d.notes,
                "create_date": d.create_date,
                "update_date": d.update_date,
                "deck_name": getattr(d, "deck_name", "不明"),
                "opponent_deck_name": getattr(d, "opponent_deck_name", "不明"),
            }
            serialized_duels.append(DuelWithDeckNames.model_validate(duel_dict))

        # 範囲指定またはデッキフィルターの場合、フィルタリングされたデュエルから統計を計算
        if period_type == "range" or my_deck_id:
            total = len(dashboard_duels_query)
            if total > 0:
                wins = sum(1 for d in dashboard_duels_query if d.is_win)
                first_wins = sum(
                    1 for d in dashboard_duels_query if d.is_going_first and d.is_win
                )
                first_total = sum(1 for d in dashboard_duels_query if d.is_going_first)
                second_wins = sum(
                    1
                    for d in dashboard_duels_query
                    if not d.is_going_first and d.is_win
                )
                second_total = sum(
                    1 for d in dashboard_duels_query if not d.is_going_first
                )
                coin_wins = sum(1 for d in dashboard_duels_query if d.won_coin_toss)

                overall_stats = {
                    "total_duels": total,
                    "win_rate": (wins / total * 100) if total > 0 else 0.0,
                    "first_turn_win_rate": (
                        (first_wins / first_total * 100) if first_total > 0 else 0.0
                    ),
                    "second_turn_win_rate": (
                        (second_wins / second_total * 100) if second_total > 0 else 0.0
                    ),
                    "coin_win_rate": (coin_wins / total * 100) if total > 0 else 0.0,
                    "go_first_rate": (first_total / total * 100) if total > 0 else 0.0,
                }

        # 各ゲームモードのダッシュボード + 統計データ
        mode_data = {
            "year": target_year,
            "month": target_month,
            "overall_stats": overall_stats,
            "duels": serialized_duels,
            "monthly_deck_distribution": deck_distribution_service.get_deck_distribution_monthly(
                db=db,
                user_id=user_id,
                year=filter_year,
                month=filter_month,
                game_mode=mode,
                range_start=range_start if period_type == "range" else None,
                range_end=range_end if period_type == "range" else None,
                my_deck_id=my_deck_id,
            ),
            "recent_deck_distribution": deck_distribution_service.get_deck_distribution_recent(
                db=db,
                user_id=user_id,
                limit=30,
                game_mode=mode,
                my_deck_id=my_deck_id,
            ),
            "my_deck_win_rates": win_rate_service.get_my_deck_win_rates(
                db=db,
                user_id=user_id,
                year=filter_year,
                month=filter_month,
                game_mode=mode,
                range_start=range_start if period_type == "range" else None,
                range_end=range_end if period_type == "range" else None,
                my_deck_id=my_deck_id,
            ),
            "matchup_data": matchup_service.get_matchup_chart(
                db=db,
                user_id=user_id,
                year=filter_year,
                month=filter_month,
                game_mode=mode,
                range_start=range_start if period_type == "range" else None,
                range_end=range_end if period_type == "range" else None,
                my_deck_id=my_deck_id,
            ),
            "time_series_data": time_series_service.get_time_series_data(
                db=db,
                user_id=user_id,
                year=filter_year if filter_year else target_year,
                month=filter_month if filter_month else target_month,
                game_mode=mode,
                range_start=range_start if period_type == "range" else None,
                range_end=range_end if period_type == "range" else None,
                my_deck_id=my_deck_id,
            ),
        }
        response_data[mode] = mode_data

    return response_data


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
    if shared_link.expires_at and shared_link.expires_at < datetime.now(timezone.utc):
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
            user_id=user_id,
            year=target_year,
            month=target_month,
            game_mode=target_game_mode,
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
