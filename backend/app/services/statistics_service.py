"""
統計サービス
統計に関するビジネスロジックを提供
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc, select
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional

from app.models.duel import Duel
from app.models.deck import Deck


class StatisticsService:
    """統計サービスクラス"""

    def _build_base_duels_query(
        self, db: Session, user_id: int, game_mode: Optional[str] = None
    ):
        query = db.query(Duel).filter(Duel.user_id == user_id)
        if game_mode:
            query = query.filter(Duel.game_mode == game_mode)
        return query

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
        self, db: Session, user_id: int, year: int, month: int, game_mode: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """月間の相手デッキ分布を取得"""
        base_query = self._build_base_duels_query(db, user_id, game_mode).filter(
            extract('year', Duel.played_date) == year,
            extract('month', Duel.played_date) == month,
        )
        
        # total_duelsのクエリを構築
        total_query = db.query(func.count(Duel.id)).filter(
            Duel.user_id == user_id,
            extract('year', Duel.played_date) == year,
            extract('month', Duel.played_date) == month
        )
        if game_mode:
            total_query = total_query.filter(Duel.game_mode == game_mode)
        
        total_duels = total_query.scalar()

        if total_duels == 0:
            return []

        deck_counts = (
            base_query
            .join(Deck, Duel.opponentDeck_id == Deck.id)
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

    def get_deck_distribution_recent(
        self, db: Session, user_id: int, limit: int = 30, game_mode: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """直近の相手デッキ分布を取得"""
        # まずサブクエリで直近のデュエルIDを取得
        recent_duel_ids = (
            self._build_base_duels_query(db, user_id, game_mode)
            .order_by(Duel.played_date.desc())
            .limit(limit)
            .with_entities(Duel.id)
            .subquery()
        )
        
        # 直近のデュエル数をカウント
        total_duels = db.query(func.count()).select_from(recent_duel_ids).scalar()

        if total_duels == 0:
            return []

        # デッキ分布を計算（joinはlimitの前に適用）
        deck_counts = (
            db.query(Deck.name, func.count(Duel.id).label('count'))
            .join(Duel, Duel.opponentDeck_id == Deck.id)
            .filter(Duel.id.in_(db.query(recent_duel_ids.c.id)))
            .group_by(Deck.name)
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

    def get_matchup_chart(self, db: Session, user_id: int, year: Optional[int] = None, month: Optional[int] = None, game_mode: Optional[str] = None) -> List[Dict[str, Any]]:
        """デッキ相性表のデータを取得"""
        query = self._build_base_duels_query(db, user_id, game_mode)

        if year is not None:
            query = query.filter(extract('year', Duel.played_date) == year)
        if month is not None:
            query = query.filter(extract('month', Duel.played_date) == month)

        duels = query.all()
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
                        "deck_name": my_deck_name,
                        "opponent_deck_name": opp_deck_name,
                        "total_duels": total,
                        "wins": results["wins"],
                        "losses": results["losses"],
                        "win_rate": (results["wins"] / total) * 100 if total > 0 else 0
                    })

        return chart_data

    def get_time_series_data(
        self, db: Session, user_id: int, game_mode: str, year: int, month: int
    ) -> List[Dict[str, Any]]:
        """
        指定されたゲームモードの月間時系列データを取得 (レート/DC)
        """
        # 月の最初の日と最後の日を計算
        start_date = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
        if month == 12:
            end_date = datetime(year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc) - timedelta(microseconds=1)
        else:
            end_date = datetime(year, month + 1, 1, 0, 0, 0, tzinfo=timezone.utc) - timedelta(microseconds=1)

        # 該当月のデュエルを取得
        duels = (
            self._build_base_duels_query(db, user_id, game_mode)
            .filter(
                Duel.played_date >= start_date,
                Duel.played_date <= end_date,
            )
            .order_by(Duel.played_date, Duel.id) # played_dateが同じ場合はidでソート
            .all()
        )

        time_series_data = []
        current_value = None

        for duel in duels:
            date_str = duel.played_date.strftime("%Y-%m-%d")
            value = None
            if game_mode == "RATE" and duel.rate_value is not None:
                value = duel.rate_value
            elif game_mode == "DC" and duel.dc_value is not None:
                value = duel.dc_value
            
            if value is not None:
                current_value = value
            
            # その日の最後の値、または直前の値を使用
            time_series_data.append({
                "date": date_str,
                "value": current_value
            })
        
        # 同じ日付で複数のデュエルがある場合、最後の値のみを保持
        # また、欠損日を補完し、直前の値で埋める
        processed_data = {}
        for item in time_series_data:
            processed_data[item["date"]] = item["value"]
        
        return time_series_data


# シングルトンインスタンス
statistics_service = StatisticsService()
