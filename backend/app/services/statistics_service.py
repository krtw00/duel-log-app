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


class StatisticsService:
    """統計サービスクラス"""

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

    def get_time_series_data(
        self,
        db: Session,
        user_id: int,
        game_mode: str,
        year: int,
        month: int,
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
        my_deck_id: Optional[int] = None,
        opponent_deck_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        指定されたゲームモードの月間時系列データを取得 (レート/DC)
        """
        # 月の最初の日と最後の日を計算
        start_date = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
        if month == 12:
            end_date = datetime(
                year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc
            ) - timedelta(microseconds=1)
        else:
            end_date = datetime(
                year, month + 1, 1, 0, 0, 0, tzinfo=timezone.utc
            ) - timedelta(microseconds=1)

        # 該当月のデュエルを取得
        query = self._build_base_duels_query(db, user_id, game_mode).filter(
            Duel.played_date >= start_date,
            Duel.played_date <= end_date,
        )

        # デッキフィルター
        if my_deck_id is not None:
            query = query.filter(Duel.deck_id == my_deck_id)
        if opponent_deck_id is not None:
            query = query.filter(Duel.opponentDeck_id == opponent_deck_id)

        duels = query.order_by(Duel.played_date.desc(), Duel.id.desc()).all()

        # 範囲指定を適用
        if range_start is not None or range_end is not None:
            duels = self._apply_range_filter(duels, range_start, range_end)

        # 時系列データとして再度日付順にソート
        duels = sorted(duels, key=lambda d: (d.played_date, d.id))

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
            time_series_data.append({"date": date_str, "value": current_value})

        # 同じ日付で複数のデュエルがある場合、最後の値のみを保持
        # また、欠損日を補完し、直前の値で埋める
        processed_data = {}
        for item in time_series_data:
            processed_data[item["date"]] = item["value"]

        return time_series_data

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
