from typing import Dict, Optional

from pydantic import BaseModel


class StatisticsFilters(BaseModel):
    year: int
    month: int
    range_start: Optional[int] = None
    range_end: Optional[int] = None
    my_deck_id: Optional[int] = None
    opponent_deck_id: Optional[int] = None

    def to_service_kwargs(self) -> Dict[str, Optional[int]]:
        return {
            "year": self.year,
            "month": self.month,
            "range_start": self.range_start,
            "range_end": self.range_end,
            "my_deck_id": self.my_deck_id,
            "opponent_deck_id": self.opponent_deck_id,
        }


class AvailableDecksFilters(BaseModel):
    year: int
    month: int
    range_start: Optional[int] = None
    range_end: Optional[int] = None
    game_mode: Optional[str] = None
