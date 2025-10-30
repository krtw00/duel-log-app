"""
統計エンドポイント
統計関連のデータを提供
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.general_stats_service import general_stats_service
from app.services.general_stats_service import general_stats_service
from app.services.duel_service import duel_service
from app.schemas.duel import DuelWithDeckNames
from app.services.statistics_service import statistics_service
from app.services.win_rate_service import win_rate_service
from app.services.deck_distribution_service import deck_distribution_service
from app.services.matchup_service import matchup_service
from app.services.time_series_service import time_series_service

router = APIRouter(prefix="/statistics", tags=["statistics"])


@router.get("", response_model=Dict[str, Any])
def get_all_statistics(
    year: int = Query(datetime.now().year, description="年"),
    month: int = Query(datetime.now().month, description="月"),
    range_start: Optional[int] = Query(None, description="範囲指定：開始試合数"),
    range_end: Optional[int] = Query(None, description="範囲指定：終了試合数"),
    my_deck_id: Optional[int] = Query(None, description="使用デッキでフィルター"),
    opponent_deck_id: Optional[int] = Query(None, description="相手デッキでフィルター"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """全ゲームモードの統計情報を一括取得"""
    game_modes = ["RANK", "RATE", "EVENT", "DC"]
    result = {}

    for mode in game_modes:
        duels = duel_service.get_user_duels(
            db=db,
            user_id=current_user.id,
            year=year,
            month=month,
            game_mode=mode,
            range_start=range_start,
            range_end=range_end,
            deck_id=my_deck_id,
            opponent_deck_id=opponent_deck_id,
        )
        overall_stats = general_stats_service._calculate_general_stats(duels)

        # DuelWithDeckNamesスキーマに変換
        duels_with_names = [DuelWithDeckNames.model_validate(d) for d in duels]

        result[mode] = {
            "overall_stats": overall_stats,
            "duels": duels_with_names,
            "monthly_deck_distribution": deck_distribution_service.get_deck_distribution_monthly(
                db=db,
                user_id=current_user.id,
                year=year,
                month=month,
                game_mode=mode,
                range_start=range_start,
                range_end=range_end,
                my_deck_id=my_deck_id,
                opponent_deck_id=opponent_deck_id,
            ),
            "recent_deck_distribution": deck_distribution_service.get_deck_distribution_recent(
                db=db,
                user_id=current_user.id,
                game_mode=mode,
                range_start=range_start,
                range_end=range_end,
                my_deck_id=my_deck_id,
                opponent_deck_id=opponent_deck_id,
            ),
            "matchup_data": matchup_service.get_matchup_chart(
                db=db,
                user_id=current_user.id,
                year=year,
                month=month,
                game_mode=mode,
                range_start=range_start,
                range_end=range_end,
                my_deck_id=my_deck_id,
                opponent_deck_id=opponent_deck_id,
            ),
            "my_deck_win_rates": win_rate_service.get_my_deck_win_rates(
                db=db,
                user_id=current_user.id,
                year=year,
                month=month,
                game_mode=mode,
                range_start=range_start,
                range_end=range_end,
                my_deck_id=my_deck_id,
                opponent_deck_id=opponent_deck_id,
            ),
        }

        # レートとDCの場合は時系列データも取得
        if mode in ["RATE", "DC"]:
            result[mode]["time_series_data"] = time_series_service.get_time_series_data(
                db=db,
                user_id=current_user.id,
                game_mode=mode,
                year=year,
                month=month,
                range_start=range_start,
                range_end=range_end,
                my_deck_id=my_deck_id,
                opponent_deck_id=opponent_deck_id,
            )
        else:
            result[mode]["time_series_data"] = []

    return result


@router.get("/deck-distribution/monthly", response_model=List[Dict[str, Any]])
def get_monthly_deck_distribution(
    year: int = Query(datetime.now().year, description="年"),
    month: int = Query(datetime.now().month, description="月"),
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


@router.get("/time-series/{game_mode}", response_model=List[Dict[str, Any]])
def get_time_series_data(
    game_mode: str,
    year: int = Query(datetime.now().year, description="年"),
    month: int = Query(datetime.now().month, description="月"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """指定されたゲームモードの月間時系列データを取得 (レート/DC)"""
    if game_mode not in ["RATE", "DC"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ゲームモードは 'RATE' または 'DC' である必要があります。",
        )
    return time_series_service.get_time_series_data(
        db=db, user_id=current_user.id, game_mode=game_mode, year=year, month=month
    )


@router.get("/available-decks", response_model=Dict[str, Any])
def get_available_decks(
    year: int = Query(datetime.now().year, description="年"),
    month: int = Query(datetime.now().month, description="月"),
    range_start: Optional[int] = Query(None, description="範囲指定:開始試合数"),
    range_end: Optional[int] = Query(None, description="範囲指定:終了試合数"),
    game_mode: Optional[str] = Query(None, description="ゲームモード"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """指定された期間・範囲に存在するデッキ一覧を取得"""
    return statistics_service.get_available_decks(
        db=db,
        user_id=current_user.id,
        year=year,
        month=month,
        range_start=range_start,
        range_end=range_end,
        game_mode=game_mode,
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
    start_id: Optional[int] = Query(None, description="開始ID（このID以降のデータのみ）"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
            year = datetime.now().year
            month = datetime.now().month
        return general_stats_service.get_overall_stats(
            db=db, user_id=current_user.id, year=year, month=month, game_mode=game_mode, start_id=start_id
        )
    elif period_type == "from_start":
        # 配信開始からの統計（start_id必須）
        if start_id is None:
            raise HTTPException(
                status_code=400,
                detail="start_id is required for from_start period type"
            )
        return general_stats_service.get_all_time_stats(
            db=db, user_id=current_user.id, game_mode=game_mode, start_id=start_id
        )
    else:  # recent
        # 直近N戦
        return general_stats_service.get_recent_stats(
            db=db, user_id=current_user.id, limit=limit, game_mode=game_mode, start_id=start_id
        )
