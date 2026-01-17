"""
統計エンドポイント
統計関連のデータを提供
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_obs_overlay_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.duel import DuelWithDeckNames
from app.schemas.statistics import AvailableDecksFilters, StatisticsFilters
from app.services.deck_distribution_service import deck_distribution_service
from app.services.duel_service import duel_service
from app.services.general_stats_service import general_stats_service
from app.services.matchup_service import matchup_service
from app.services.statistics_service import statistics_service
from app.services.value_sequence_service import value_sequence_service
from app.services.win_rate_service import win_rate_service

router = APIRouter(prefix="/statistics", tags=["statistics"])


def get_statistics_filters(
    year: Optional[int] = Query(None, description="年（from_timestamp未指定時のデフォルト:今年）"),
    month: Optional[int] = Query(None, description="月（from_timestamp未指定時のデフォルト:今月）"),
    range_start: Optional[int] = Query(None, description="範囲指定：開始試合数"),
    range_end: Optional[int] = Query(None, description="範囲指定：終了試合数"),
    my_deck_id: Optional[int] = Query(None, description="使用デッキでフィルター"),
    opponent_deck_id: Optional[int] = Query(None, description="相手デッキでフィルター"),
    from_timestamp: Optional[str] = Query(
        None, description="この時刻以降のデータのみ取得（ISO8601形式）。指定時はyear/monthを無視"
    ),
) -> StatisticsFilters:
    # from_timestampがない場合はデフォルトで今月を使用
    if from_timestamp is None:
        if year is None:
            year = datetime.now(timezone.utc).year
        if month is None:
            month = datetime.now(timezone.utc).month
    return StatisticsFilters(
        year=year,
        month=month,
        range_start=range_start,
        range_end=range_end,
        my_deck_id=my_deck_id,
        opponent_deck_id=opponent_deck_id,
        from_timestamp=from_timestamp,
    )


def get_available_decks_filters(
    year: int = Query(datetime.now(timezone.utc).year, description="年"),
    month: int = Query(datetime.now(timezone.utc).month, description="月"),
    range_start: Optional[int] = Query(None, description="範囲指定:開始試合数"),
    range_end: Optional[int] = Query(None, description="範囲指定:終了試合数"),
    game_mode: Optional[str] = Query(None, description="ゲームモード"),
) -> AvailableDecksFilters:
    return AvailableDecksFilters(
        year=year,
        month=month,
        range_start=range_start,
        range_end=range_end,
        game_mode=game_mode,
    )


@router.get("", response_model=Dict[str, Any])
def get_all_statistics(
    filters: StatisticsFilters = Depends(get_statistics_filters),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """全ゲームモードの統計情報を一括取得

    パフォーマンス最適化 (部分的):
    - 全デュエルデータを一度に取得し、メモリ内でゲームモード別に分割
    - 以前: 4回のDB往復（各ゲームモードごと）
    - 現在: 1回のクエリで全データを取得

    注: 各統計サービス（deck_distribution、matchup等）は依然として
    個別にクエリを実行しているため、完全な最適化には至っていません。
    """
    game_modes = ["RANK", "RATE", "EVENT", "DC"]
    result = {}

    # フィルターパラメータを取得（from_timestamp使用時はyear/monthがNoneになる）
    filter_kwargs = filters.to_service_kwargs()
    year = filter_kwargs.get("year")
    month = filter_kwargs.get("month")
    start_date = filter_kwargs.get("start_date")

    # パフォーマンス最適化: 全ゲームモードのデュエルを一度に取得
    all_duels = duel_service.get_user_duels(
        db=db,
        user_id=current_user.id,
        year=year,
        month=month,
        game_mode=None,  # 全ゲームモードを取得
        range_start=filters.range_start,
        range_end=filters.range_end,
        deck_id=filters.my_deck_id,
        opponent_deck_id=filters.opponent_deck_id,
        start_date=start_date,  # タイムスタンプフィルタ
    )

    # メモリ内でゲームモード別に分割
    duels_by_mode: Dict[str, List[Any]] = {mode: [] for mode in game_modes}
    for duel in all_duels:
        if duel.game_mode in duels_by_mode:
            duels_by_mode[duel.game_mode].append(duel)

    # from_timestampモード（year/monthがNone）かどうかを判定
    is_timestamp_mode = year is None or month is None

    for mode in game_modes:
        duels = duels_by_mode[mode]
        overall_stats = general_stats_service.calculate_general_stats(duels)

        # DuelWithDeckNamesスキーマに変換
        duels_with_names = [DuelWithDeckNames.model_validate(d) for d in duels]

        # from_timestampモードでは年月ベースの統計をスキップ
        if is_timestamp_mode:
            result[mode] = {
                "overall_stats": overall_stats,
                "duels": duels_with_names,
                "monthly_deck_distribution": [],
                "recent_deck_distribution": [],
                "matchup_data": [],
                "my_deck_win_rates": [],
                "value_sequence_data": [],
            }
        else:
            result[mode] = {
                "overall_stats": overall_stats,
                "duels": duels_with_names,
                "monthly_deck_distribution": deck_distribution_service.get_deck_distribution_monthly(
                    db=db,
                    user_id=current_user.id,
                    year=year,
                    month=month,
                    game_mode=mode,
                    range_start=filters.range_start,
                    range_end=filters.range_end,
                    my_deck_id=filters.my_deck_id,
                    opponent_deck_id=filters.opponent_deck_id,
                ),
                "recent_deck_distribution": deck_distribution_service.get_deck_distribution_recent(
                    db=db,
                    user_id=current_user.id,
                    game_mode=mode,
                    range_start=filters.range_start,
                    range_end=filters.range_end,
                    my_deck_id=filters.my_deck_id,
                    opponent_deck_id=filters.opponent_deck_id,
                ),
                "matchup_data": matchup_service.get_matchup_chart(
                    db=db,
                    user_id=current_user.id,
                    year=year,
                    month=month,
                    game_mode=mode,
                    range_start=filters.range_start,
                    range_end=filters.range_end,
                    my_deck_id=filters.my_deck_id,
                    opponent_deck_id=filters.opponent_deck_id,
                ),
                "my_deck_win_rates": win_rate_service.get_my_deck_win_rates(
                    db=db,
                    user_id=current_user.id,
                    year=year,
                    month=month,
                    game_mode=mode,
                    range_start=filters.range_start,
                    range_end=filters.range_end,
                    my_deck_id=filters.my_deck_id,
                    opponent_deck_id=filters.opponent_deck_id,
                ),
            }

            # レートとDCの場合は値シーケンスも取得
            if mode in ["RATE", "DC"]:
                result[mode]["value_sequence_data"] = (
                    value_sequence_service.get_value_sequence_data(
                        db=db,
                        user_id=current_user.id,
                        game_mode=mode,
                        year=year,
                        month=month,
                        range_start=filters.range_start,
                        range_end=filters.range_end,
                        my_deck_id=filters.my_deck_id,
                        opponent_deck_id=filters.opponent_deck_id,
                    )
                )
            else:
                result[mode]["value_sequence_data"] = []

    return result


@router.get("/deck-distribution/monthly", response_model=List[Dict[str, Any]])
def get_monthly_deck_distribution(
    year: int = Query(datetime.now(timezone.utc).year, description="年"),
    month: int = Query(datetime.now(timezone.utc).month, description="月"),
    game_mode: Optional[str] = Query(None, description="ゲームモード"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """月間の相手デッキ分布を取得"""
    return deck_distribution_service.get_deck_distribution_monthly(
        db=db, user_id=current_user.id, year=year, month=month, game_mode=game_mode
    )


@router.get("/deck-distribution/recent", response_model=List[Dict[str, Any]])
def get_recent_deck_distribution(
    limit: int = Query(30, ge=1, le=100, description="取得するデュエル数"),
    game_mode: Optional[str] = Query(None, description="ゲームモード"),
    range_start: Optional[int] = Query(None, description="範囲指定：開始試合数"),
    range_end: Optional[int] = Query(None, description="範囲指定：終了試合数"),
    my_deck_id: Optional[int] = Query(None, description="使用デッキでフィルター"),
    opponent_deck_id: Optional[int] = Query(None, description="相手デッキでフィルター"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """直近の相手デッキ分布を取得"""
    return deck_distribution_service.get_deck_distribution_recent(
        db=db,
        user_id=current_user.id,
        limit=limit,
        game_mode=game_mode,
        range_start=range_start,
        range_end=range_end,
        my_deck_id=my_deck_id,
        opponent_deck_id=opponent_deck_id,
    )


@router.get("/matchup-chart", response_model=List[Dict[str, Any]])
def get_matchup_chart(
    year: Optional[int] = Query(None, description="年"),
    month: Optional[int] = Query(None, description="月"),
    game_mode: Optional[str] = Query(None, description="ゲームモード"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """デッキ相性表のデータを取得"""
    return matchup_service.get_matchup_chart(
        db=db, user_id=current_user.id, year=year, month=month, game_mode=game_mode
    )


@router.get("/value-sequence/{game_mode}", response_model=List[Dict[str, Any]])
def get_value_sequence_data(
    game_mode: str,
    year: int = Query(datetime.now(timezone.utc).year, description="年"),
    month: int = Query(datetime.now(timezone.utc).month, description="月"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """指定されたゲームモードの月間値シーケンスを取得 (レート/DC)"""
    if game_mode not in ["RATE", "DC"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ゲームモードは 'RATE' または 'DC' である必要があります。",
        )
    return value_sequence_service.get_value_sequence_data(
        db=db, user_id=current_user.id, game_mode=game_mode, year=year, month=month
    )


@router.get("/available-decks", response_model=Dict[str, Any])
def get_available_decks(
    filters: AvailableDecksFilters = Depends(get_available_decks_filters),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """指定された期間・範囲に存在するデッキ一覧を取得"""
    return statistics_service.get_available_decks(
        db=db,
        user_id=current_user.id,
        year=filters.year,
        month=filters.month,
        range_start=filters.range_start,
        range_end=filters.range_end,
        game_mode=filters.game_mode,
    )


@router.get("/obs", response_model=Dict[str, Any])
def get_obs_statistics(
    period_type: str = Query(
        "recent", description="集計期間タイプ (all/monthly/recent/from_start)"
    ),
    year: Optional[int] = Query(None, description="年（monthly時のみ）"),
    month: Optional[int] = Query(None, description="月（monthly時のみ）"),
    limit: int = Query(30, ge=1, le=100, description="取得する対戦数（recent時のみ）"),
    game_mode: Optional[str] = Query(None, description="ゲームモード"),
    start_id: Optional[int] = Query(
        None, description="開始ID（このID以降のデータのみ）"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_obs_overlay_user),
):
    """
    OBSオーバーレイ用の統計情報を取得
    period_type:
      - all: 全期間
      - monthly: 指定された年月
      - recent: 直近N戦
      - from_start: 配信開始から（start_id必須）
    start_id: 指定された場合、このID以降のデータのみを集計
    """
    if period_type == "all":
        # 全期間の統計
        return general_stats_service.get_all_time_stats(
            db=db, user_id=current_user.id, game_mode=game_mode, start_id=start_id
        )
    elif period_type == "monthly":
        # 月間統計
        if not year or not month:
            year = datetime.now(timezone.utc).year
            month = datetime.now(timezone.utc).month
        return general_stats_service.get_overall_stats(
            db=db,
            user_id=current_user.id,
            year=year,
            month=month,
            game_mode=game_mode,
            start_id=start_id,
        )
    elif period_type == "from_start":
        # 配信開始からの統計（start_id必須）
        if start_id is None:
            raise HTTPException(
                status_code=400,
                detail="start_id is required for from_start period type",
            )
        return general_stats_service.get_all_time_stats(
            db=db, user_id=current_user.id, game_mode=game_mode, start_id=start_id
        )
    else:  # recent
        # 直近N戦
        return general_stats_service.get_recent_stats(
            db=db,
            user_id=current_user.id,
            limit=limit,
            game_mode=game_mode,
            start_id=start_id,
        )
