"""
統計エンドポイント
統計関連のデータを提供
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.statistics_service import statistics_service
from app.db.session import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/statistics", tags=["statistics"])


@router.get("/deck-distribution/monthly", response_model=List[Dict[str, Any]])
def get_monthly_deck_distribution(
    year: int = Query(datetime.now().year, description="年"),
    month: int = Query(datetime.now().month, description="月"),
    game_mode: Optional[str] = Query(None, description="ゲームモード"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """月間の相手デッキ分布を取得"""
    return statistics_service.get_deck_distribution_monthly(
        db=db, user_id=current_user.id, year=year, month=month, game_mode=game_mode
    )


@router.get("/deck-distribution/recent", response_model=List[Dict[str, Any]])
def get_recent_deck_distribution(
    limit: int = Query(30, ge=1, le=100, description="取得するデュエル数"),
    game_mode: Optional[str] = Query(None, description="ゲームモード"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """直近の相手デッキ分布を取得"""
    return statistics_service.get_deck_distribution_recent(
        db=db, user_id=current_user.id, limit=limit, game_mode=game_mode
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
    return statistics_service.get_matchup_chart(db=db, user_id=current_user.id, year=year, month=month, game_mode=game_mode)


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
    return statistics_service.get_time_series_data(
        db=db, user_id=current_user.id, game_mode=game_mode, year=year, month=month
    )
