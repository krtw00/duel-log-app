"""レート/DCの値推移（順序データ）サービス。"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.duel import Duel
from app.utils.query_builders import apply_range_filter, build_base_duels_query


class ValueSequenceService:
    """レート/DCの生値を時系列順に並べたシーケンスを提供する。"""

    def get_value_sequence_data(
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
        """指定されたゲームモードの月間値シーケンスを取得 (レート/DC)。"""
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
        query = build_base_duels_query(db, user_id, game_mode).filter(
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
            duels = apply_range_filter(duels, range_start, range_end)

        # 表示用に昇順で並べ替え
        duels = sorted(duels, key=lambda d: (d.played_date, d.id))

        value_sequence = []

        for duel in duels:
            if game_mode == "RATE":
                value = duel.rate_value
            elif game_mode == "DC":
                value = duel.dc_value
            else:
                value = None

            if value is None:
                continue

            # 1試合ごとの生の値を保持する。日付での集約は行わない。
            value_sequence.append({"value": value})

        return value_sequence


# シングルトンインスタンス
value_sequence_service = ValueSequenceService()
