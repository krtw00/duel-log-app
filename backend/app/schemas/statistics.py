from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel


class StatisticsFilters(BaseModel):
    year: Optional[int] = None
    month: Optional[int] = None
    range_start: Optional[int] = None
    range_end: Optional[int] = None
    my_deck_id: Optional[int] = None
    opponent_deck_id: Optional[int] = None
    from_timestamp: Optional[str] = None  # ISO8601形式のタイムスタンプ

    def get_start_date(self) -> Optional[datetime]:
        """from_timestampをdatetimeに変換"""
        if self.from_timestamp:
            try:
                return datetime.fromisoformat(
                    self.from_timestamp.replace("Z", "+00:00")
                )
            except ValueError:
                return None
        return None

    def to_service_kwargs(self) -> Dict[str, Any]:
        """サービス呼び出し用のパラメータを返す

        from_timestampが指定されている場合はyear/monthを含めない
        （from_timestamp以降の全データを取得するため）
        """
        kwargs: Dict[str, Any] = {
            "range_start": self.range_start,
            "range_end": self.range_end,
            "my_deck_id": self.my_deck_id,
            "opponent_deck_id": self.opponent_deck_id,
            "start_date": self.get_start_date(),
        }
        # from_timestampがない場合のみyear/monthを適用
        if not self.from_timestamp:
            kwargs["year"] = self.year
            kwargs["month"] = self.month
        else:
            kwargs["year"] = None
            kwargs["month"] = None
        return kwargs


class AvailableDecksFilters(BaseModel):
    year: int
    month: int
    range_start: Optional[int] = None
    range_end: Optional[int] = None
    game_mode: Optional[str] = None
