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
    game_mode = shared_link.game_mode  # 共有リンク作成時に指定されたゲームモード

    # 指定されたゲームモードの全体統計 (ダッシュボード用)
    overall_stats = general_stats_service.get_overall_stats(
        db=db,
        user_id=user_id,
        year=target_year,
        month=target_month,
        game_mode=game_mode,
    )

    # 指定されたゲームモードのダッシュボード用のデュエルリストを取得
    dashboard_duels_query = (
        db.query(Duel)
        .filter(
            Duel.user_id == user_id,
            extract("year", Duel.played_date) == target_year,
            extract("month", Duel.played_date) == target_month,
            Duel.game_mode == game_mode,
        )
        .order_by(Duel.played_date.desc())
        .all()
    )

    # デッキ情報を結合
    from app.models.deck import Deck

    deck_ids = list(
        set(
            [d.deck_id for d in dashboard_duels_query if d.deck_id]
            + [d.opponent_deck_id for d in dashboard_duels_query if d.opponent_deck_id]
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
            duel.opponentDeck.name if duel.opponentDeck else "不明"
        )

    # DuelモデルをPydanticスキーマに変換
    serialized_duels = []
    for d in dashboard_duels_query:
        # statistics_service.get_duels_by_month で既に deck_name と opponent_deck_name が設定されている
        duel_dict = {
            "id": d.id,
            "user_id": d.user_id,
            "deck_id": d.deck_id,
            "opponent_deck_id": d.opponent_deck_id,
            "coin": d.coin,
            "first_or_second": d.first_or_second,
            "result": d.result,
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

    response_data = {
        "DASHBOARD": {"overall_stats": overall_stats, "duels": serialized_duels}
    }

    # STATISTICS タブ用：指定されたゲームモードの統計データを返す
    statistics_data = {
        "year": target_year,
        "month": target_month,
        "monthly_deck_distribution": deck_distribution_service.get_deck_distribution_monthly(
            db=db,
            user_id=user_id,
            year=target_year,
            month=target_month,
            game_mode=game_mode,
        ),
        "recent_deck_distribution": deck_distribution_service.get_deck_distribution_recent(
            db=db, user_id=user_id, limit=30, game_mode=game_mode
        ),
        "matchup_data": matchup_service.get_matchup_chart(
            db=db,
            user_id=user_id,
            year=target_year,
            month=target_month,
            game_mode=game_mode,
        ),
    }

    response_data["STATISTICS"] = statistics_data

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
