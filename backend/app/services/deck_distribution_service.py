"""デッキ分布計算サービス。

相手デッキの分布計算に特化したビジネスロジックを提供。
"""

from typing import Any, Dict, List, Optional

from sqlalchemy import desc, extract, func
from sqlalchemy.orm import Session

from app.models.deck import Deck
from app.models.duel import Duel
from app.utils.query_builders import apply_range_filter, build_base_duels_query
from app.utils.datetime_utils import month_range_utc


class DeckDistributionService:
    """デッキ分布計算サービスクラス。"""

    def _calculate_deck_distribution_from_duels(
        self, duels: List[Duel]
    ) -> List[Dict[str, Any]]:
        """デュエルのリストから相手デッキの分布を計算する。"""
        total_duels = len(duels)
        if total_duels == 0:
            return []

        deck_counts_map = {}
        for duel in duels:
            if duel.opponent_deck and duel.opponent_deck.name:
                deck_name = duel.opponent_deck.name
                deck_counts_map[deck_name] = deck_counts_map.get(deck_name, 0) + 1

        distribution = [
            {
                "deck_name": name,
                "count": count,
                "percentage": (count / total_duels) * 100,
            }
            for name, count in sorted(
                deck_counts_map.items(), key=lambda x: x[1], reverse=True
            )
        ]
        return distribution

    def get_deck_distribution_monthly(
        self,
        db: Session,
        user_id: int,
        year: int,
        month: int,
        game_mode: Optional[str] = None,
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
        my_deck_id: Optional[int] = None,
        opponent_deck_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """月間の相手デッキ分布を取得。"""
        start_utc, end_utc = month_range_utc(year, month)
        base_query = build_base_duels_query(db, user_id, game_mode).filter(
            Duel.played_date >= start_utc,
            Duel.played_date < end_utc,
        )

        # デッキフィルター
        if my_deck_id is not None:
            base_query = base_query.filter(Duel.deck_id == my_deck_id)
        if opponent_deck_id is not None:
            base_query = base_query.filter(Duel.opponent_deck_id == opponent_deck_id)

        # 範囲指定がある場合
        if range_start is not None or range_end is not None:
            duels = base_query.order_by(Duel.played_date.desc()).all()
            duels = apply_range_filter(duels, range_start, range_end)
            return self._calculate_deck_distribution_from_duels(duels)
        else:
            # 通常のクエリベースの集計
            filtered_query = base_query
            total_duels = filtered_query.with_entities(func.count(Duel.id)).scalar()

            if total_duels == 0:
                return []

            deck_counts = (
                filtered_query.join(Deck, Duel.opponent_deck_id == Deck.id)
                .group_by(Deck.name)
                .with_entities(Deck.name, func.count(Duel.id).label("count"))
                .order_by(desc("count"))
                .all()
            )

            distribution = [
                {
                    "deck_name": name,
                    "count": count,
                    "percentage": (count / total_duels) * 100 if total_duels > 0 else 0,
                }
                for name, count in deck_counts
            ]
            return distribution

    def get_deck_distribution_recent(
        self,
        db: Session,
        user_id: int,
        limit: int = 30,
        game_mode: Optional[str] = None,
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
        my_deck_id: Optional[int] = None,
        opponent_deck_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """直近の相手デッキ分布を取得。"""
        query = build_base_duels_query(db, user_id, game_mode)

        if my_deck_id is not None:
            query = query.filter(Duel.deck_id == my_deck_id)
        if opponent_deck_id is not None:
            query = query.filter(Duel.opponent_deck_id == opponent_deck_id)

        # 範囲指定がある場合
        if range_start is not None or range_end is not None:
            duels = query.order_by(Duel.played_date.desc()).all()
            duels = apply_range_filter(duels, range_start, range_end)
            return self._calculate_deck_distribution_from_duels(duels)
        else:
            duels = query.order_by(Duel.played_date.desc()).limit(limit).all()
            return self._calculate_deck_distribution_from_duels(duels)


# シングルトンインスタンス
deck_distribution_service = DeckDistributionService()
