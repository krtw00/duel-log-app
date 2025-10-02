"""
統計サービス
統計に関するビジネスロジックを提供
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc
from datetime import datetime
from typing import List, Dict, Any

from app.models.duel import Duel
from app.models.deck import Deck


class StatisticsService:
    """統計サービスクラス"""

    def get_deck_distribution(
        self, db: Session, user_id: int, duels_query
    ) -> List[Dict[str, Any]]:
        """デュエルクエリからデッキ分布を計算する共通関数"""
        total_duels = duels_query.count()
        if total_duels == 0:
            return []

        deck_counts = (
            duels_query.join(Deck, Duel.opponentDeck_id == Deck.id)
            .group_by(Deck.name)
            .with_entities(Deck.name, func.count(Duel.id).label('count'))
            .order_by(desc('count'))
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

    def get_deck_distribution_monthly(
        self, db: Session, user_id: int, year: int, month: int
    ) -> List[Dict[str, Any]]:
        """月間の相手デッキ分布を取得"""
        duels_query = db.query(Duel).filter(
            Duel.user_id == user_id,
            extract('year', Duel.played_date) == year,
            extract('month', Duel.played_date) == month,
        )
        return self.get_deck_distribution(db, user_id, duels_query)

    def get_deck_distribution_recent(
        self, db: Session, user_id: int, limit: int = 30
    ) -> List[Dict[str, Any]]:
        """直近の相手デッキ分布を取得"""
        recent_duels_subquery = (
            db.query(Duel.id)
            .filter(Duel.user_id == user_id)
            .order_by(Duel.played_date.desc())
            .limit(limit)
            .subquery()
        )
        duels_query = db.query(Duel).filter(Duel.id.in_(recent_duels_subquery))
        return self.get_deck_distribution(db, user_id, duels_query)

    def get_matchup_chart(self, db: Session, user_id: int) -> List[Dict[str, Any]]:
        """デッキ相性表のデータを取得"""
        duels = db.query(Duel).filter(Duel.user_id == user_id).all()
        my_decks = db.query(Deck).filter(Deck.user_id == user_id, Deck.is_opponent == False).all()
        opponent_decks = db.query(Deck).filter(Deck.user_id == user_id, Deck.is_opponent == True).all()

        my_deck_map = {deck.id: deck.name for deck in my_decks}
        opponent_deck_map = {deck.id: deck.name for deck in opponent_decks}

        matchups: Dict[str, Dict[str, Dict[str, int]]] = {
            my_deck_name: {
                opp_deck_name: {"wins": 0, "losses": 0}
                for opp_deck_name in opponent_deck_map.values()
            }
            for my_deck_name in my_deck_map.values()
        }

        for duel in duels:
            my_deck_name = my_deck_map.get(duel.deck_id)
            opp_deck_name = opponent_deck_map.get(duel.opponentDeck_id)

            if my_deck_name and opp_deck_name:
                if duel.result:
                    matchups[my_deck_name][opp_deck_name]["wins"] += 1
                else:
                    matchups[my_deck_name][opp_deck_name]["losses"] += 1
        
        # フロントエンドが扱いやすい形式に変換
        chart_data = []
        for my_deck_name, opponents in matchups.items():
            for opp_deck_name, results in opponents.items():
                total = results["wins"] + results["losses"]
                if total > 0:
                    chart_data.append({
                        "my_deck_name": my_deck_name,
                        "opponent_deck_name": opp_deck_name,
                        "wins": results["wins"],
                        "losses": results["losses"],
                        "win_rate": (results["wins"] / total) * 100 if total > 0 else 0
                    })

        return chart_data


# シングルトンインスタンス
statistics_service = StatisticsService()
