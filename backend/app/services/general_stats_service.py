"""総合統計サービス
全体、月次、直近などの総合的な統計に関するビジネスロジックを提供
"""

from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.duel import Duel
from app.utils.datetime_utils import month_range_utc


class GeneralStatsService:
    """総合統計サービスクラス"""

    def calculate_general_stats(self, duels: List[Duel]) -> Dict[str, Any]:
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

    def _calculate_general_stats(self, duels: List[Duel]) -> Dict[str, Any]:
        """Backwards compatible wrapper. Prefer calculate_general_stats."""
        return self.calculate_general_stats(duels)

    def _get_latest_metric_duel(
        self,
        db: Session,
        user_id: int,
        target_mode: str,
        value_column,
        start_id: Optional[int] = None,
        additional_filters: Optional[List[Any]] = None,
    ) -> Optional[Duel]:
        """指定したモードの最新デュエル（メトリック値付き）を取得。

        start_id が指定されている場合は start_id より後のデータを優先し、
        存在しない場合は start_id 以前の直近データをフォールバックとして利用する。
        """

        query = (
            db.query(Duel)
            .filter(Duel.user_id == user_id)
            .filter(Duel.game_mode == target_mode)
            .filter(value_column.isnot(None))
        )

        if additional_filters:
            for condition in additional_filters:
                query = query.filter(condition)

        if start_id is not None:
            latest_after_start = (
                query.filter(Duel.id > start_id)
                .order_by(Duel.played_date.desc(), Duel.id.desc())
                .first()
            )
            if latest_after_start:
                return latest_after_start

            return (
                query.filter(Duel.id <= start_id)
                .order_by(Duel.played_date.desc(), Duel.id.desc())
                .first()
            )

        return query.order_by(Duel.played_date.desc(), Duel.id.desc()).first()

    def _get_all_current_metrics(
        self,
        db: Session,
        user_id: int,
        start_id: Optional[int] = None,
        additional_filters: Optional[List[Any]] = None,
    ) -> Dict[str, Any]:
        """全ゲームモードの最新メトリック（rank/rate/dc）を一括取得する。

        Args:
            db: データベースセッション
            user_id: ユーザーID
            start_id: 開始ID（指定時はそれより後のデータを優先）
            additional_filters: 追加の日付フィルターなど

        Returns:
            {"current_rank": int|None, "current_rate": float|None, "current_dc": int|None}
        """
        # RANK モードの最新ランクを取得
        latest_rank_duel = self._get_latest_metric_duel(
            db=db,
            user_id=user_id,
            target_mode="RANK",
            value_column=Duel.rank,
            start_id=start_id,
            additional_filters=additional_filters,
        )

        # RATE モードの最新レートを取得
        latest_rate_duel = self._get_latest_metric_duel(
            db=db,
            user_id=user_id,
            target_mode="RATE",
            value_column=Duel.rate_value,
            start_id=start_id,
            additional_filters=additional_filters,
        )

        # DC モードの最新DC値を取得
        latest_dc_duel = self._get_latest_metric_duel(
            db=db,
            user_id=user_id,
            target_mode="DC",
            value_column=Duel.dc_value,
            start_id=start_id,
            additional_filters=additional_filters,
        )

        return {
            "current_rank": latest_rank_duel.rank if latest_rank_duel else None,
            "current_rate": latest_rate_duel.rate_value if latest_rate_duel else None,
            "current_dc": latest_dc_duel.dc_value if latest_dc_duel else None,
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
        stats = self.calculate_general_stats(duels)

        # 統計対象のゲームモードの最新デュエルから使用デッキを取得
        latest_duel = query.order_by(Duel.played_date.desc()).first()
        current_deck = (
            latest_duel.deck.name if latest_duel and latest_duel.deck else None
        )

        # 全ゲームモードの最新メトリックを一括取得
        date_filters = [
            Duel.played_date >= start_utc,
            Duel.played_date < end_utc,
        ]
        metrics = self._get_all_current_metrics(
            db=db,
            user_id=user_id,
            start_id=start_id,
            additional_filters=date_filters,
        )

        return {
            **stats,
            "current_deck": current_deck,
            **metrics,
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
        stats = self.calculate_general_stats(duels)

        # 統計対象のゲームモードの最新デュエルから使用デッキを取得
        latest_duel = query.order_by(Duel.played_date.desc()).first()
        current_deck = (
            latest_duel.deck.name if latest_duel and latest_duel.deck else None
        )

        # 全ゲームモードの最新メトリックを一括取得
        metrics = self._get_all_current_metrics(
            db=db,
            user_id=user_id,
            start_id=start_id,
        )

        return {
            **stats,
            "current_deck": current_deck,
            **metrics,
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
        stats = self.calculate_general_stats(duels)

        # 統計対象のゲームモードの最新デュエルから使用デッキを取得
        current_deck = None
        if duels:
            latest_duel = duels[0]  # 既に日付降順なので最初の要素が最新
            current_deck = latest_duel.deck.name if latest_duel.deck else None

        # 全ゲームモードの最新メトリックを一括取得
        metrics = self._get_all_current_metrics(
            db=db,
            user_id=user_id,
            start_id=start_id,
        )

        return {
            **stats,
            "current_deck": current_deck,
            **metrics,
        }


# シングルトンインスタンス
general_stats_service = GeneralStatsService()
