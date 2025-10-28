"""
クエリビルダーユーティリティ
共通のクエリフィルタリングロジックを提供
"""

from typing import List, Optional

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


def apply_date_range_filter(
    query: Query,
    year: Optional[int] = None,
    month: Optional[int] = None,
) -> Query:
    """
    日付範囲でフィルタリング

    Args:
        query: ベースクエリ
        year: 年
        month: 月

    Returns:
        フィルタが適用されたクエリ
    """
    if year is not None:
        query = query.filter(extract("year", Duel.played_date) == year)
    if month is not None:
        query = query.filter(extract("month", Duel.played_date) == month)
    return query


def apply_deck_filters(
    query: Query,
    my_deck_id: Optional[int] = None,
    opponent_deck_id: Optional[int] = None,
) -> Query:
    """
    デッキでフィルタリング

    Args:
        query: ベースクエリ
        my_deck_id: プレイヤーのデッキID
        opponent_deck_id: 相手のデッキID

    Returns:
        フィルタが適用されたクエリ
    """
    if my_deck_id is not None:
        query = query.filter(Duel.deck_id == my_deck_id)
    if opponent_deck_id is not None:
        query = query.filter(Duel.opponent_deck_id == opponent_deck_id)
    return query


def apply_range_filter(
    duels: List[Duel],
    range_start: Optional[int] = None,
    range_end: Optional[int] = None,
) -> List[Duel]:
    """
    結果のリストをスライス

    Args:
        duels: デュエルのリスト
        range_start: 開始位置（1始まり、デフォルト1）
        range_end: 終了位置（この位置を含む、1始まり）

    Returns:
        スライスされたリスト
    """
    if range_start is None and range_end is None:
        return duels

    # 1-indexed から 0-indexed に変換
    start = (range_start - 1) if range_start is not None else 0
    end = range_end if range_end is not None else len(duels)

    return duels[start:end]
