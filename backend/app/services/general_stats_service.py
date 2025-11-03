"""総合統計サービス
全体、月次、直近などの総合的な統計に関するビジネスロジックを提供
"""

from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.duel import Duel
from app.utils.datetime_utils import month_range_utc


class GeneralStatsService:
    """総合統計サービスクラス"""

    def _calculate_general_stats(self, duels: List[Duel]) -> Dict[str, Any]:
        """デュエルのリストから基本的な統計情報を計算する。"""
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

        win_count = sum(1 for d in duels if d.is_win is True)
        lose_count = total_duels - win_count
        win_rate = (win_count / total_duels) * 100 if total_duels > 0 else 0

        first_turn_duels = [d for d in duels if d.is_going_first is True]
        second_turn_duels = [d for d in duels if d.is_going_first is False]

        first_turn_total = len(first_turn_duels)
        first_turn_wins = sum(1 for d in first_turn_duels if d.is_win is True)
        first_turn_win_rate = (
            (first_turn_wins / first_turn_total) * 100 if first_turn_total > 0 else 0
        )

        second_turn_total = len(second_turn_duels)
        second_turn_wins = sum(1 for d in second_turn_duels if d.is_win is True)
        second_turn_win_rate = (
            (second_turn_wins / second_turn_total) * 100 if second_turn_total > 0 else 0
        )

        coin_total = total_duels
        coin_wins = sum(1 for d in duels if d.won_coin_toss is True)
        coin_win_rate = (coin_wins / coin_total) * 100 if coin_total > 0 else 0

        go_first_total = sum(1 for d in duels if d.is_going_first is True)
        go_first_rate = (go_first_total / total_duels) * 100 if total_duels > 0 else 0

        return {
            "total_duels": total_duels,
            "win_count": win_count,
            "lose_count": lose_count,
            "win_rate": win_rate,
            "first_turn_win_rate": first_turn_win_rate,
            "second_turn_win_rate": second_turn_win_rate,
            "coin_win_rate": coin_win_rate,
            "go_first_rate": go_first_rate,
        }

    def get_overall_stats(
        self,
        db: Session,
        user_id: int,
        year: int,
        month: int,
        game_mode: Optional[str] = None,
        start_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """指定された年月におけるユーザーの全体的なデュエル統計を取得。"""
        start_utc, end_utc = month_range_utc(year, month)
        query = (
            db.query(Duel)
            .filter(Duel.user_id == user_id)
            .filter(Duel.played_date >= start_utc, Duel.played_date < end_utc)
        )
        if game_mode:
            query = query.filter(Duel.game_mode == game_mode)
        if start_id is not None:
            query = query.filter(Duel.id > start_id)

        duels = query.all()
        stats = self._calculate_general_stats(duels)

        # 最新のデュエル情報から使用デッキとランク/レート/DCを取得
        latest_duel = query.order_by(Duel.played_date.desc()).first()

        current_deck = None
        current_rank = None
        current_rate = None
        current_dc = None
        if latest_duel:
            current_deck = latest_duel.deck.name if latest_duel.deck else None
            current_rank = latest_duel.rank
            current_rate = latest_duel.rate_value
            current_dc = latest_duel.dc_value

        return {
            **stats,
            "current_deck": current_deck,
            "current_rank": current_rank,
            "current_rate": current_rate,
            "current_dc": current_dc,
        }

    def get_all_time_stats(
        self,
        db: Session,
        user_id: int,
        game_mode: Optional[str] = None,
        start_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """全期間のユーザーの統計を取得。"""
        query = db.query(Duel).filter(Duel.user_id == user_id)

        if game_mode:
            query = query.filter(Duel.game_mode == game_mode)
        if start_id is not None:
            query = query.filter(Duel.id > start_id)

        duels = query.all()
        stats = self._calculate_general_stats(duels)

        # 最新のデュエル情報から使用デッキとランク/レート/DCを取得
        latest_duel = query.order_by(Duel.played_date.desc()).first()

        current_deck = None
        current_rank = None
        current_rate = None
        current_dc = None
        if latest_duel:
            current_deck = latest_duel.deck.name if latest_duel.deck else None
            current_rank = latest_duel.rank
            current_rate = latest_duel.rate_value
            current_dc = latest_duel.dc_value

        return {
            **stats,
            "current_deck": current_deck,
            "current_rank": current_rank,
            "current_rate": current_rate,
            "current_dc": current_dc,
        }

    def get_recent_stats(
        self,
        db: Session,
        user_id: int,
        limit: int = 30,
        game_mode: Optional[str] = None,
        start_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """直近N戦のユーザーの統計を取得。"""
        query = db.query(Duel).filter(Duel.user_id == user_id)

        if game_mode:
            query = query.filter(Duel.game_mode == game_mode)
        if start_id is not None:
            query = query.filter(Duel.id > start_id)

        # 日時順で並び替えて直近N戦を取得
        duels = query.order_by(Duel.played_date.desc()).limit(limit).all()
        stats = self._calculate_general_stats(duels)

        # 最新のデュエル情報から使用デッキとランク/レート/DCを取得（duelsは既に日付降順）
        current_deck = None
        current_rank = None
        current_rate = None
        current_dc = None
        if duels:
            latest_duel = duels[0]  # 既に日付降順なので最初の要素が最新
            current_deck = latest_duel.deck.name if latest_duel.deck else None
            current_rank = latest_duel.rank
            current_rate = latest_duel.rate_value
            current_dc = latest_duel.dc_value

        return {
            **stats,
            "current_deck": current_deck,
            "current_rank": current_rank,
            "current_rate": current_rate,
            "current_dc": current_dc,
        }


# シングルトンインスタンス
general_stats_service = GeneralStatsService()
