"""レート/DCの値推移（順序データ）サービス。"""

from datetime import timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.duel import Duel
from app.utils.datetime_utils import month_range_utc
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
        # 月間範囲（ローカルタイムゾーンを考慮）を取得
        start_date, next_month_start = month_range_utc(year, month)
        end_date = next_month_start - timedelta(microseconds=1)

        # 該当月のデュエルを取得
        query = build_base_duels_query(db, user_id, game_mode).filter(
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
