"""
勝率計算サービス
デッキごとの勝率計算に特化したビジネスロジックを提供
"""

from typing import Any, Dict, List, Optional

from sqlalchemy import case, desc, extract, func
from sqlalchemy.orm import Session

from app.models.deck import Deck
from app.models.duel import Duel
from app.utils.query_builders import apply_range_filter, build_base_duels_query


class WinRateService:
    """勝率計算サービスクラス"""

    def _calculate_win_rates_from_duels(
        self, duels: List[Duel]
    ) -> List[Dict[str, Any]]:
        """デュエルのリストからデッキごとの勝率データを計算する"""
        deck_stats_map = {}
        for duel in duels:
            if duel.deck and duel.deck.name:
                deck_name = duel.deck.name
                if deck_name not in deck_stats_map:
                    deck_stats_map[deck_name] = {"total": 0, "wins": 0}
                deck_stats_map[deck_name]["total"] += 1
                if duel.result:
                    deck_stats_map[deck_name]["wins"] += 1

        win_rates_data = []
        for deck_name, stats in sorted(
            deck_stats_map.items(), key=lambda x: x[1]["total"], reverse=True
        ):
            total_duels = stats["total"]
            wins = stats["wins"]
            losses = total_duels - wins
            win_rate = (wins / total_duels) * 100 if total_duels > 0 else 0
            win_rates_data.append(
                {
                    "deck_name": deck_name,
                    "total_duels": total_duels,
                    "wins": wins,
                    "losses": losses,
                    "win_rate": win_rate,
                }
            )
        return win_rates_data

    def get_my_deck_win_rates(
        self,
        db: Session,
        user_id: int,
        year: Optional[int] = None,
        month: Optional[int] = None,
        game_mode: Optional[str] = None,
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
        my_deck_id: Optional[int] = None,
        opponent_deck_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        ユーザー自身の各デッキの勝率を計算
        """
        query = build_base_duels_query(db, user_id, game_mode)

        if year is not None:
            query = query.filter(extract("year", Duel.played_date) == year)
        if month is not None:
            query = query.filter(extract("month", Duel.played_date) == month)

        # デッキフィルター
        if my_deck_id is not None:
            query = query.filter(Duel.deck_id == my_deck_id)
        if opponent_deck_id is not None:
            query = query.filter(Duel.opponentDeck_id == opponent_deck_id)

        # 範囲指定がある場合は、一旦リストで取得してフィルタリング
        if range_start is not None or range_end is not None:
            duels = query.order_by(Duel.played_date.desc()).all()
            duels = apply_range_filter(duels, range_start, range_end)
            return self._calculate_win_rates_from_duels(duels)
        else:
            # 通常のクエリベースの集計
            deck_stats = (
                query.join(Deck, Duel.deck_id == Deck.id)
                .group_by(Deck.id, Deck.name)
                .with_entities(
                    Deck.name,
                    func.count(Duel.id).label("total_duels"),
                    func.sum(case((Duel.result, 1), else_=0)).label("wins"),
                )
                .order_by(desc("total_duels"))
                .all()
            )

            win_rates_data = []
            for name, total_duels, wins in deck_stats:
                losses = total_duels - wins
                win_rate = (wins / total_duels) * 100 if total_duels > 0 else 0
                win_rates_data.append(
                    {
                        "deck_name": name,
                        "total_duels": total_duels,
                        "wins": wins,
                        "losses": losses,
                        "win_rate": win_rate,
                    }
                )

        return win_rates_data


# シングルトンインスタンス
win_rate_service = WinRateService()
