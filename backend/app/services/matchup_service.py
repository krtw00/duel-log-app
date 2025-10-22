"""
デッキ相性計算サービス
デッキ間の相性計算に特化したビジネスロジックを提供
"""

from typing import Any, Dict, List, Optional

from sqlalchemy import extract
from sqlalchemy.orm import Session

from app.models.deck import Deck
from app.models.duel import Duel


class MatchupService:
    """デッキ相性計算サービスクラス"""

    def _build_base_duels_query(
        self, db: Session, user_id: int, game_mode: Optional[str] = None
    ):
        query = db.query(Duel).filter(Duel.user_id == user_id)
        if game_mode:
            query = query.filter(Duel.game_mode == game_mode)
        return query

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

    def get_matchup_chart(
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
        """デッキ相性表のデータを取得"""
        query = self._build_base_duels_query(db, user_id, game_mode)

        if year is not None:
            query = query.filter(extract("year", Duel.played_date) == year)
        if month is not None:
            query = query.filter(extract("month", Duel.played_date) == month)

        # デッキフィルター
        if my_deck_id is not None:
            query = query.filter(Duel.deck_id == my_deck_id)
        if opponent_deck_id is not None:
            query = query.filter(Duel.opponentDeck_id == opponent_deck_id)

        duels = query.order_by(Duel.played_date.desc()).all()

        # 範囲指定を適用
        if range_start is not None or range_end is not None:
            duels = self._apply_range_filter(duels, range_start, range_end)
        my_decks = (
            db.query(Deck)
            .filter(Deck.user_id == user_id, Deck.is_opponent.is_(False))
            .all()
        )
        opponent_decks = (
            db.query(Deck)
            .filter(Deck.user_id == user_id, Deck.is_opponent.is_(True))
            .all()
        )

        my_deck_map = {deck.id: deck.name for deck in my_decks}
        opponent_deck_map = {deck.id: deck.name for deck in opponent_decks}

        matchups: Dict[str, Dict[str, Dict[str, int]]] = {
            my_deck_name: {
                opp_deck_name: {
                    "wins_first": 0,
                    "losses_first": 0,
                    "wins_second": 0,
                    "losses_second": 0,
                }
                for opp_deck_name in opponent_deck_map.values()
            }
            for my_deck_name in my_deck_map.values()
        }

        for duel in duels:
            my_deck_name = my_deck_map.get(duel.deck_id)
            opp_deck_name = opponent_deck_map.get(duel.opponentDeck_id)

            if my_deck_name and opp_deck_name:
                if duel.first_or_second:  # Going first
                    if duel.result:
                        matchups[my_deck_name][opp_deck_name]["wins_first"] += 1
                    else:
                        matchups[my_deck_name][opp_deck_name]["losses_first"] += 1
                else:  # Going second
                    if duel.result:
                        matchups[my_deck_name][opp_deck_name]["wins_second"] += 1
                    else:
                        matchups[my_deck_name][opp_deck_name]["losses_second"] += 1

        # フロントエンドが扱いやすい形式に変換
        chart_data = []
        for my_deck_name, opponents in matchups.items():
            for opp_deck_name, results in opponents.items():
                total_first = results["wins_first"] + results["losses_first"]
                total_second = results["wins_second"] + results["losses_second"]
                total_duels = total_first + total_second

                if total_duels > 0:
                    chart_data.append(
                        {
                            "deck_name": my_deck_name,
                            "opponent_deck_name": opp_deck_name,
                            "total_duels": total_duels,
                            "wins": results["wins_first"] + results["wins_second"],
                            "losses": results["losses_first"]
                            + results["losses_second"],
                            "win_rate": (
                                (
                                    (results["wins_first"] + results["wins_second"])
                                    / total_duels
                                )
                                * 100
                                if total_duels > 0
                                else 0
                            ),
                            "win_rate_first": (
                                (results["wins_first"] / total_first) * 100
                                if total_first > 0
                                else 0
                            ),
                            "win_rate_second": (
                                (results["wins_second"] / total_second) * 100
                                if total_second > 0
                                else 0
                            ),
                        }
                    )

        # 使用率（対戦数）でソート
        chart_data.sort(key=lambda x: x["total_duels"], reverse=True)

        return chart_data


# シングルトンインスタンス
matchup_service = MatchupService()
