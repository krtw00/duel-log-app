"""
統計サービス
統計に関するビジネスロジックを提供
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import desc, extract, func, case
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

    def get_my_deck_win_rates(
        self,
        db: Session,
        user_id: int,
        year: Optional[int] = None,
        month: Optional[int] = None,
        game_mode: Optional[str] = None,
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        ユーザー自身の各デッキの勝率を計算
        """
        query = self._build_base_duels_query(db, user_id, game_mode)

        if year is not None:
            query = query.filter(extract("year", Duel.played_date) == year)
        if month is not None:
            query = query.filter(extract("month", Duel.played_date) == month)

        # 範囲指定がある場合は、一旦リストで取得してフィルタリング
        if range_start is not None or range_end is not None:
            duels = query.order_by(Duel.played_date.desc()).all()
            duels = self._apply_range_filter(duels, range_start, range_end)

            # Python側で集計
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
            for deck_name, stats in sorted(deck_stats_map.items(), key=lambda x: x[1]["total"], reverse=True):
                total_duels = stats["total"]
                wins = stats["wins"]
                losses = total_duels - wins
                win_rate = (wins / total_duels) * 100 if total_duels > 0 else 0
                win_rates_data.append({
                    "deck_name": deck_name,
                    "total_duels": total_duels,
                    "wins": wins,
                    "losses": losses,
                    "win_rate": win_rate,
                })
        else:
            # 通常のクエリベースの集計
            deck_stats = (
                query.join(Deck, Duel.deck_id == Deck.id)
                .group_by(Deck.id, Deck.name)
                .with_entities(
                    Deck.name,
                    func.count(Duel.id).label("total_duels"),
                    func.sum(case((Duel.result == True, 1), else_=0)).label("wins"),
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

    def get_deck_distribution_monthly(
        self,
        db: Session,
        user_id: int,
        year: int,
        month: int,
        game_mode: Optional[str] = None,
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """月間の相手デッキ分布を取得"""
        base_query = self._build_base_duels_query(db, user_id, game_mode).filter(
            extract("year", Duel.played_date) == year,
            extract("month", Duel.played_date) == month,
        )

        # 範囲指定がある場合
        if range_start is not None or range_end is not None:
            duels = base_query.order_by(Duel.played_date.desc()).all()
            duels = self._apply_range_filter(duels, range_start, range_end)

            total_duels = len(duels)
            if total_duels == 0:
                return []

            # Python側で集計
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
                for name, count in sorted(deck_counts_map.items(), key=lambda x: x[1], reverse=True)
            ]
            return distribution
        else:
            # 通常のクエリベースの集計
            total_query = db.query(func.count(Duel.id)).filter(
                Duel.user_id == user_id,
                extract("year", Duel.played_date) == year,
                extract("month", Duel.played_date) == month,
            )
            if game_mode:
                total_query = total_query.filter(Duel.game_mode == game_mode)

            total_duels = total_query.scalar()

            if total_duels == 0:
                return []

            deck_counts = (
                base_query.join(Deck, Duel.opponentDeck_id == Deck.id)
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
    ) -> List[Dict[str, Any]]:
        """直近の相手デッキ分布を取得"""
        # 範囲指定がある場合
        if range_start is not None or range_end is not None:
            query = self._build_base_duels_query(db, user_id, game_mode)
            duels = query.order_by(Duel.played_date.desc()).all()
            duels = self._apply_range_filter(duels, range_start, range_end)

            total_duels = len(duels)
            if total_duels == 0:
                return []

            # Python側で集計
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
                for name, count in sorted(deck_counts_map.items(), key=lambda x: x[1], reverse=True)
            ]
            return distribution
        else:
            # 通常の直近N戦の処理
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
                db.query(Deck.name, func.count(Duel.id).label("count"))
                .join(Duel, Duel.opponentDeck_id == Deck.id)
                .filter(Duel.id.in_(db.query(recent_duel_ids.c.id)))
                .group_by(Deck.name)
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

    def get_matchup_chart(
        self,
        db: Session,
        user_id: int,
        year: Optional[int] = None,
        month: Optional[int] = None,
        game_mode: Optional[str] = None,
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """デッキ相性表のデータを取得"""
        query = self._build_base_duels_query(db, user_id, game_mode)

        if year is not None:
            query = query.filter(extract("year", Duel.played_date) == year)
        if month is not None:
            query = query.filter(extract("month", Duel.played_date) == month)

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
                            "losses": results["losses_first"] + results["losses_second"],
                            "win_rate": (
                                ((results["wins_first"] + results["wins_second"]) / total_duels) * 100
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
        duels = (
            self._build_base_duels_query(db, user_id, game_mode)
            .filter(
                Duel.played_date >= start_date,
                Duel.played_date <= end_date,
            )
            .order_by(Duel.played_date.desc(), Duel.id.desc())
            .all()
        )

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

    def get_overall_stats(
        self,
        db: Session,
        user_id: int,
        year: int,
        month: int,
        game_mode: Optional[str] = None,
    ) -> Dict[str, Any]:
        """指定された年月におけるユーザーの全体的なデュエル統計を取得"""
        query = db.query(Duel).filter(
            Duel.user_id == user_id,
            extract("year", Duel.played_date) == year,
            extract("month", Duel.played_date) == month,
        )
        if game_mode:
            query = query.filter(Duel.game_mode == game_mode)

        duels = query.all()

        total_duels = len(duels)
        if total_duels == 0:
            return {
                "total_duels": 0,
                "win_count": 0,
                "lose_count": 0,
                "win_rate": 0,
                "first_turn_win_rate": 0,
                "second_turn_win_rate": 0,
                "coin_win_rate": 0,
                "go_first_rate": 0,
            }

        win_count = sum(1 for d in duels if d.result is True)
        lose_count = total_duels - win_count
        win_rate = win_count / total_duels if total_duels > 0 else 0

        first_turn_duels = [d for d in duels if d.first_or_second is True]
        second_turn_duels = [d for d in duels if d.first_or_second is False]

        first_turn_total = len(first_turn_duels)
        first_turn_wins = sum(1 for d in first_turn_duels if d.result is True)
        first_turn_win_rate = (
            first_turn_wins / first_turn_total if first_turn_total > 0 else 0
        )

        second_turn_total = len(second_turn_duels)
        second_turn_wins = sum(1 for d in second_turn_duels if d.result is True)
        second_turn_win_rate = (
            second_turn_wins / second_turn_total if second_turn_total > 0 else 0
        )

        coin_total = total_duels
        coin_wins = sum(1 for d in duels if d.coin is True)
        coin_win_rate = coin_wins / coin_total if coin_total > 0 else 0

        go_first_total = sum(1 for d in duels if d.first_or_second is True)
        go_first_rate = go_first_total / total_duels if total_duels > 0 else 0

        # 最新のデュエル情報から使用デッキとランクを取得
        latest_duel = (
            db.query(Duel)
            .filter(
                Duel.user_id == user_id,
                extract("year", Duel.played_date) == year,
                extract("month", Duel.played_date) == month,
            )
            .order_by(Duel.played_date.desc())
            .first()
        )

        current_deck = None
        current_rank = None
        if latest_duel:
            current_deck = latest_duel.deck.name if latest_duel.deck else None
            current_rank = latest_duel.rank

        return {
            "total_duels": total_duels,
            "win_count": win_count,
            "lose_count": lose_count,
            "win_rate": win_rate,
            "first_turn_win_rate": first_turn_win_rate,
            "second_turn_win_rate": second_turn_win_rate,
            "coin_win_rate": coin_win_rate,
            "go_first_rate": go_first_rate,
            "current_deck": current_deck,
            "current_rank": current_rank,
        }

    def get_all_time_stats(
        self,
        db: Session,
        user_id: int,
        game_mode: Optional[str] = None,
    ) -> Dict[str, Any]:
        """全期間のユーザーの統計を取得"""
        query = db.query(Duel).filter(Duel.user_id == user_id)

        if game_mode:
            query = query.filter(Duel.game_mode == game_mode)

        duels = query.all()

        total_duels = len(duels)
        if total_duels == 0:
            return {
                "total_duels": 0,
                "win_count": 0,
                "lose_count": 0,
                "win_rate": 0,
                "first_turn_win_rate": 0,
                "second_turn_win_rate": 0,
                "coin_win_rate": 0,
                "go_first_rate": 0,
            }

        win_count = sum(1 for d in duels if d.result is True)
        lose_count = total_duels - win_count
        win_rate = win_count / total_duels if total_duels > 0 else 0

        first_turn_duels = [d for d in duels if d.first_or_second is True]
        second_turn_duels = [d for d in duels if d.first_or_second is False]

        first_turn_total = len(first_turn_duels)
        first_turn_wins = sum(1 for d in first_turn_duels if d.result is True)
        first_turn_win_rate = (
            first_turn_wins / first_turn_total if first_turn_total > 0 else 0
        )

        second_turn_total = len(second_turn_duels)
        second_turn_wins = sum(1 for d in second_turn_duels if d.result is True)
        second_turn_win_rate = (
            second_turn_wins / second_turn_total if second_turn_total > 0 else 0
        )

        coin_total = total_duels
        coin_wins = sum(1 for d in duels if d.coin is True)
        coin_win_rate = coin_wins / coin_total if coin_total > 0 else 0

        go_first_total = sum(1 for d in duels if d.first_or_second is True)
        go_first_rate = go_first_total / total_duels if total_duels > 0 else 0

        # 最新のデュエル情報から使用デッキとランクを取得
        latest_duel = (
            db.query(Duel)
            .filter(Duel.user_id == user_id)
            .order_by(Duel.played_date.desc())
            .first()
        )

        current_deck = None
        current_rank = None
        if latest_duel:
            current_deck = latest_duel.deck.name if latest_duel.deck else None
            current_rank = latest_duel.rank

        return {
            "total_duels": total_duels,
            "win_count": win_count,
            "lose_count": lose_count,
            "win_rate": win_rate,
            "first_turn_win_rate": first_turn_win_rate,
            "second_turn_win_rate": second_turn_win_rate,
            "coin_win_rate": coin_win_rate,
            "go_first_rate": go_first_rate,
            "current_deck": current_deck,
            "current_rank": current_rank,
        }

    def get_recent_stats(
        self,
        db: Session,
        user_id: int,
        limit: int = 30,
        game_mode: Optional[str] = None,
    ) -> Dict[str, Any]:
        """直近N戦のユーザーの統計を取得"""
        query = db.query(Duel).filter(Duel.user_id == user_id)

        if game_mode:
            query = query.filter(Duel.game_mode == game_mode)

        # 日時順で並び替えて直近N戦を取得
        duels = query.order_by(Duel.played_date.desc()).limit(limit).all()

        total_duels = len(duels)
        if total_duels == 0:
            return {
                "total_duels": 0,
                "win_count": 0,
                "lose_count": 0,
                "win_rate": 0,
                "first_turn_win_rate": 0,
                "second_turn_win_rate": 0,
                "coin_win_rate": 0,
                "go_first_rate": 0,
            }

        win_count = sum(1 for d in duels if d.result is True)
        lose_count = total_duels - win_count
        win_rate = win_count / total_duels if total_duels > 0 else 0

        first_turn_duels = [d for d in duels if d.first_or_second is True]
        second_turn_duels = [d for d in duels if d.first_or_second is False]

        first_turn_total = len(first_turn_duels)
        first_turn_wins = sum(1 for d in first_turn_duels if d.result is True)
        first_turn_win_rate = (
            first_turn_wins / first_turn_total if first_turn_total > 0 else 0
        )

        second_turn_total = len(second_turn_duels)
        second_turn_wins = sum(1 for d in second_turn_duels if d.result is True)
        second_turn_win_rate = (
            second_turn_wins / second_turn_total if second_turn_total > 0 else 0
        )

        coin_total = total_duels
        coin_wins = sum(1 for d in duels if d.coin is True)
        coin_win_rate = coin_wins / coin_total if coin_total > 0 else 0

        go_first_total = sum(1 for d in duels if d.first_or_second is True)
        go_first_rate = go_first_total / total_duels if total_duels > 0 else 0

        # 最新のデュエル情報から使用デッキとランクを取得（duelsは既に日付降順）
        current_deck = None
        current_rank = None
        if duels:
            latest_duel = duels[0]  # 既に日付降順なので最初の要素が最新
            current_deck = latest_duel.deck.name if latest_duel.deck else None
            current_rank = latest_duel.rank

        return {
            "total_duels": total_duels,
            "win_count": win_count,
            "lose_count": lose_count,
            "win_rate": win_rate,
            "first_turn_win_rate": first_turn_win_rate,
            "second_turn_win_rate": second_turn_win_rate,
            "coin_win_rate": coin_win_rate,
            "go_first_rate": go_first_rate,
            "current_deck": current_deck,
            "current_rank": current_rank,
        }

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
