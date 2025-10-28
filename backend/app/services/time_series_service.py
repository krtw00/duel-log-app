"""
時系列データサービス
レートやDCポイントの時系列データ生成に特化したビジネスロジックを提供
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.duel import Duel


class TimeSeriesService:
    """時系列データサービスクラス"""

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
            query = query.filter(Duel.opponent_deck_id == opponent_deck_id)

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
        processed_data = {}
        for item in time_series_data:
            processed_data[item["date"]] = item["value"]

        # 辞書をリストに変換して返す
        return [{"date": date, "value": value} for date, value in processed_data.items()]


# シングルトンインスタンス
time_series_service = TimeSeriesService()
