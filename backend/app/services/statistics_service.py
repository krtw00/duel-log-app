"""
統計サービス
統計に関するビジネスロジックを提供
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import case, desc, extract, func
from sqlalchemy.orm import Session

from app.models.deck import Deck
from app.models.duel import Duel
from app.utils.query_builders import build_base_duels_query


class StatisticsService:
    """統計サービスクラス"""

    def _build_base_duels_query(
        self, db: Session, user_id: int, game_mode: Optional[str] = None
    ):
        return build_base_duels_query(db, user_id, game_mode)

    def _apply_range_filter(
        self,
        duels: List[Duel],
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
    ) -> List[Duel]:
        """
        デュエルリストに範囲指定を適用
        duelsは新しい順にソートされている必要がある
        """
        filtered = duels

        # 範囲フィルター
        if range_start is not None or range_end is not None:
            start = max(0, (range_start or 1) - 1)  # 1始まりを0始まりに変換
            end = range_end if range_end is not None else len(filtered)
            filtered = filtered[start:end]

        return filtered

    def get_available_decks(
        self,
        db: Session,
        user_id: int,
        year: int,
        month: int,
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
        game_mode: Optional[str] = None,
    ) -> Dict[str, List[Dict[str, Any]]]:
        """指定された期間・範囲に存在するデッキ一覧を取得"""
        query = self._build_base_duels_query(db, user_id, game_mode)
        query = query.filter(
            extract("year", Duel.played_date) == year,
            extract("month", Duel.played_date) == month,
        )

        # 範囲指定がある場合
        duels = query.order_by(Duel.played_date.desc()).all()
        if range_start is not None or range_end is not None:
            duels = self._apply_range_filter(duels, range_start, range_end)

        # 使用デッキと相手デッキを集計
        my_deck_ids = set()
        opponent_deck_ids = set()

        for duel in duels:
            if duel.deck_id:
                my_deck_ids.add(duel.deck_id)
            if duel.opponentDeck_id:
                opponent_deck_ids.add(duel.opponentDeck_id)

        # デッキ情報を取得
        my_decks = []
        if my_deck_ids:
            my_decks_query = (
                db.query(Deck)
                .filter(Deck.id.in_(my_deck_ids), Deck.is_opponent.is_(False))
                .all()
            )
            my_decks = [{"id": deck.id, "name": deck.name} for deck in my_decks_query]

        opponent_decks = []
        if opponent_deck_ids:
            opponent_decks_query = (
                db.query(Deck)
                .filter(Deck.id.in_(opponent_deck_ids), Deck.is_opponent.is_(True))
                .all()
            )
            opponent_decks = [
                {"id": deck.id, "name": deck.name} for deck in opponent_decks_query
            ]

        return {"my_decks": my_decks, "opponent_decks": opponent_decks}





    def get_duels_by_month(
        self, db: Session, user_id: int, year: int, month: int
    ) -> List[Duel]:
        """指定された年月におけるユーザーのデュエルリストを取得"""
        duels = (
            db.query(Duel)
            .filter(
                Duel.user_id == user_id,
                extract("year", Duel.played_date) == year,
                extract("month", Duel.played_date) == month,
            )
            .order_by(Duel.played_date.desc())
            .all()
        )

        # デッキ情報を結合
        deck_ids = list(
            set(
                [d.deck_id for d in duels if d.deck_id]
                + [d.opponentDeck_id for d in duels if d.opponentDeck_id]
            )
        )
        if deck_ids:  # deck_ids が空でない場合のみクエリを実行
            decks = db.query(Deck).filter(Deck.id.in_(deck_ids)).all()
            deck_map = {deck.id: deck for deck in decks}
        else:
            deck_map = {}

        for duel in duels:
            # deck と opponent_deck オブジェクトを設定
            duel.deck = deck_map.get(duel.deck_id) if duel.deck_id else None
            duel.opponent_deck = (
                deck_map.get(duel.opponentDeck_id) if duel.opponentDeck_id else None
            )

            # deck_name と opponent_deck_name 属性を必ず追加
            duel.deck_name = duel.deck.name if duel.deck else "不明"
            duel.opponent_deck_name = (
                duel.opponent_deck.name if duel.opponent_deck else "不明"
            )

        return duels


# シングルトンインスタンス
statistics_service = StatisticsService()
