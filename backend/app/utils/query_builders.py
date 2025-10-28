"""
クエリビルダーユーティリティ
共通のクエリフィルタリングロジックを提供
"""

from typing import Optional

from sqlalchemy import extract
from sqlalchemy.orm import Query

from app.models.duel import Duel


def apply_duel_filters(
    query: Query,
    user_id: int,
    game_mode: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    deck_id: Optional[int] = None,
    opponent_deck_id: Optional[int] = None,
) -> Query:
    """
    デュエルクエリに共通フィルタを適用

    Args:
        query: ベースクエリ
        user_id: ユーザーID
        game_mode: ゲームモード（RANK, RATE, EVENT, DC）
        year: 年
        month: 月
        deck_id: デッキID
        opponent_deck_id: 相手デッキID

    Returns:
        フィルタが適用されたクエリ
    """
    # ユーザーIDでフィルタ（必須）
    query = query.filter(Duel.user_id == user_id)

    # ゲームモードでフィルタ
    if game_mode:
        query = query.filter(Duel.game_mode == game_mode)

    # 年でフィルタ
    if year is not None:
        query = query.filter(extract("year", Duel.played_date) == year)

    # 月でフィルタ
    if month is not None:
        query = query.filter(extract("month", Duel.played_date) == month)

    # デッキIDでフィルタ
    if deck_id is not None:
        query = query.filter(Duel.deck_id == deck_id)

    # 相手デッキIDでフィルタ
    if opponent_deck_id is not None:
        query = query.filter(Duel.opponentDeck_id == opponent_deck_id)

    return query


def build_base_duels_query(
    db, user_id: int, game_mode: Optional[str] = None
) -> Query:
    """
    デュエルの基本クエリを構築

    Args:
        db: データベースセッション
        user_id: ユーザーID
        game_mode: ゲームモード（オプション）

    Returns:
        基本クエリ
    """
    query = db.query(Duel).filter(Duel.user_id == user_id)
    if game_mode:
        query = query.filter(Duel.game_mode == game_mode)
    return query
