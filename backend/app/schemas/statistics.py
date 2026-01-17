from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel, field_validator


class StatisticsFilters(BaseModel):
    year: Optional[int] = None
    month: Optional[int] = None
    range_start: Optional[int] = None
    range_end: Optional[int] = None
    my_deck_id: Optional[int] = None
    opponent_deck_id: Optional[int] = None
    from_timestamp: Optional[str] = None  # 後方互換性のため残す（start_dateと同じ意味）
    start_date: Optional[str] = None  # ISO8601形式の開始日時
    end_date: Optional[str] = None  # ISO8601形式の終了日時

    @field_validator("start_date", "end_date", "from_timestamp", mode="before")
    @classmethod
    def validate_iso_date(cls, v: Optional[str]) -> Optional[str]:
        """ISO8601形式の日付文字列を検証"""
        if v is None:
            return None
        try:
            # 検証のためにパースを試行
            datetime.fromisoformat(v.replace("Z", "+00:00"))
            return v
        except ValueError as e:
            raise ValueError(f"Invalid ISO8601 format: {v}") from e

    def get_start_date(self) -> Optional[datetime]:
        """開始日時をdatetimeに変換

        優先順位: start_date > from_timestamp > デフォルト（90日前）
        """
        # start_dateが指定されている場合
        if self.start_date:
            try:
                return datetime.fromisoformat(self.start_date.replace("Z", "+00:00"))
            except ValueError:
                pass

        # from_timestamp（後方互換性）
        if self.from_timestamp:
            try:
                return datetime.fromisoformat(
                    self.from_timestamp.replace("Z", "+00:00")
                )
            except ValueError:
                pass

        # デフォルト: 90日前から
        # ただし、year/monthが指定されている場合はNoneを返す（年月ベースの集計）
        if self.year is not None or self.month is not None:
            return None

        # 90日前の0時0分0秒（UTC）
        return datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        ) - timedelta(days=90)

    def get_end_date(self) -> Optional[datetime]:
        """終了日時をdatetimeに変換

        end_dateが指定されていない場合はNone（制限なし）
        """
        if self.end_date:
            try:
                return datetime.fromisoformat(self.end_date.replace("Z", "+00:00"))
            except ValueError:
                return None
        return None

    def to_service_kwargs(self) -> Dict[str, Any]:
        """サービス呼び出し用のパラメータを返す

        start_date/end_dateまたはfrom_timestampが指定されている場合はyear/monthを含めない
        （タイムスタンプベースの集計を行うため）
        """
        start_dt = self.get_start_date()
        end_dt = self.get_end_date()

        kwargs: Dict[str, Any] = {
            "range_start": self.range_start,
            "range_end": self.range_end,
            "my_deck_id": self.my_deck_id,
            "opponent_deck_id": self.opponent_deck_id,
            "start_date": start_dt,
            "end_date": end_dt,
        }

        # タイムスタンプベースのフィルタが指定されている場合はyear/monthを無効化
        if self.start_date or self.end_date or self.from_timestamp:
            kwargs["year"] = None
            kwargs["month"] = None
        else:
            kwargs["year"] = self.year
            kwargs["month"] = self.month

        return kwargs


class AvailableDecksFilters(BaseModel):
    year: int
    month: int
    range_start: Optional[int] = None
    range_end: Optional[int] = None
    game_mode: Optional[str] = None
