"""
クエリビルダーユーティリティ

対戦記録（Duel）やデッキ（Deck）に対する共通的なクエリ構築ロジックを提供します。
複数のサービスで重複していたクエリロジックを一元管理することで、
コードの保守性と一貫性を向上させます。

使用例:
    >>> from app.utils.query_builders import build_base_duels_query, apply_date_range_filter
    >>> # 基本クエリを構築
    >>> query = build_base_duels_query(db, user_id=1, game_mode='RANK')
    >>> # 年月フィルタを適用
    >>> query = apply_date_range_filter(query, year=2025, month=10)
    >>> # デッキフィルタを適用
    >>> query = apply_deck_filters(query, my_deck_id=5)
    >>> # 結果を取得
    >>> duels = query.all()
"""

from typing import List, Optional

from sqlalchemy import extract
from sqlalchemy.orm import Query, Session

from app.models.duel import Duel


def build_base_duels_query(
    db: Session, user_id: int, game_mode: Optional[str] = None
) -> Query:
    """
    ユーザーの対戦記録を取得するためのベースクエリを構築

    全てのサービスで共通的に使用される基本的なフィルタリングを適用します。
    ユーザーIDでフィルタリングし、オプションでゲームモードでも絞り込みます。

    Args:
        db: データベースセッション
        user_id: ユーザーID
        game_mode: ゲームモード（'RANK', 'RATE', 'EVENT', 'DC'など）でフィルタリング（任意）

    Returns:
        フィルタリング済みのSQLAlchemyクエリオブジェクト

    Example:
        >>> query = build_base_duels_query(db, user_id=1, game_mode='RANK')
        >>> duels = query.all()  # ユーザー1のRANKモードの全対戦記録を取得
    """
    # ユーザーIDで基本フィルタリング
    query = db.query(Duel).filter(Duel.user_id == user_id)

    # ゲームモードが指定されている場合は追加フィルタリング
    if game_mode:
        query = query.filter(Duel.game_mode == game_mode)

    return query


def apply_date_range_filter(
    query: Query, year: Optional[int] = None, month: Optional[int] = None
) -> Query:
    """
    クエリに年月フィルタを適用

    対戦記録の played_date フィールドに対して年月でのフィルタリングを行います。
    年のみ、または年月両方を指定できます。

    Args:
        query: ベースとなるSQLAlchemyクエリ
        year: 年（例: 2025）でフィルタリング（任意）
        month: 月（1-12）でフィルタリング（任意、yearと併用）

    Returns:
        日付フィルタが適用されたクエリオブジェクト

    Example:
        >>> query = build_base_duels_query(db, user_id=1)
        >>> query = apply_date_range_filter(query, year=2025, month=10)
        >>> duels = query.all()  # 2025年10月の対戦記録を取得
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
    クエリにデッキフィルタを適用

    プレイヤーデッキ（自分が使用したデッキ）と相手デッキで絞り込みを行います。
    片方のみ、または両方を指定できます。

    Args:
        query: ベースとなるSQLAlchemyクエリ
        my_deck_id: プレイヤーデッキIDでフィルタリング（任意）
        opponent_deck_id: 相手デッキIDでフィルタリング（任意）

    Returns:
        デッキフィルタが適用されたクエリオブジェクト

    Example:
        >>> query = build_base_duels_query(db, user_id=1)
        >>> query = apply_deck_filters(query, my_deck_id=5, opponent_deck_id=10)
        >>> duels = query.all()  # デッキID5でデッキID10と対戦した記録を取得
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
    対戦記録リストに範囲指定フィルタを適用（メモリ内処理）

    「直近100戦のうち、1-50戦目のみ」といった範囲指定を行います。
    リストは新しい順（日付降順）にソート済みである必要があります。

    Args:
        duels: 対戦記録のリスト（日付降順にソート済み）
        range_start: 範囲の開始位置（1始まり、任意）
        range_end: 範囲の終了位置（1始まり、任意）

    Returns:
        範囲フィルタ適用後の対戦記録リスト

    Note:
        - range_startとrange_endは1始まりの番号（例: 1-50）
        - 内部では0始まりのインデックスに変換して処理
        - データベースレベルではなくPythonのリストスライスで処理

    Example:
        >>> duels = query.order_by(Duel.played_date.desc()).all()  # 新しい順にソート
        >>> filtered = apply_range_filter(duels, range_start=1, range_end=50)
        >>> # 直近50戦を取得
    """
    # 範囲指定がない場合はそのまま返す
    if range_start is None and range_end is None:
        return duels

    # 1始まりを0始まりに変換（range_startが未指定の場合は1とみなす）
    start = max(0, (range_start or 1) - 1)
    # range_endが未指定の場合は全件を対象
    end = range_end if range_end is not None else len(duels)

    # Pythonのリストスライスで範囲を抽出
    return duels[start:end]


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
    デュエルクエリに共通フィルタを一括適用（統合版）

    build_base_duels_query、apply_date_range_filter、apply_deck_filtersを
    統合した便利関数です。一度に全てのフィルタを適用できます。

    Args:
        query: ベースクエリ
        user_id: ユーザーID（必須）
        game_mode: ゲームモード（'RANK', 'RATE', 'EVENT', 'DC'など）（任意）
        year: 年（例: 2025）（任意）
        month: 月（1-12）（任意）
        deck_id: プレイヤーデッキID（任意）
        opponent_deck_id: 相手デッキID（任意）

    Returns:
        全てのフィルタが適用されたクエリオブジェクト

    Example:
        >>> query = db.query(Duel)
        >>> query = apply_duel_filters(
        ...     query,
        ...     user_id=1,
        ...     game_mode='RANK',
        ...     year=2025,
        ...     month=10,
        ...     deck_id=5
        ... )
        >>> duels = query.all()
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
