"""Datetime utility helpers for timezone-aware range calculations."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Tuple
from zoneinfo import ZoneInfo


# TODO: In the future this should be configurable per user. For now we assume JST.
DEFAULT_TIMEZONE = ZoneInfo("Asia/Tokyo")


def month_range_utc(year: int, month: int, tz: ZoneInfo = DEFAULT_TIMEZONE) -> Tuple[datetime, datetime]:
    """Return the UTC start (inclusive) and end (exclusive) timestamps for the given month.

    Args:
        year: Target year in the local timezone.
        month: Target month in the local timezone (1-12).
        tz: Local timezone to interpret the year/month in (defaults to JST).

    Returns:
        A tuple of (start_utc, end_utc) datetimes.

    Note:
        Month boundaries are set at 7:59:00 to match the game's month reset timing at 7:59.
    """

    if month < 1 or month > 12:
        raise ValueError("month must be between 1 and 12")

    start_local = datetime(year, month, 1, 7, 59, 0, 0, tzinfo=tz)
    if month == 12:
        end_local = datetime(year + 1, 1, 1, 7, 59, 0, 0, tzinfo=tz)
    else:
        end_local = datetime(year, month + 1, 1, 7, 59, 0, 0, tzinfo=tz)

    return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)


def year_range_utc(year: int, tz: ZoneInfo = DEFAULT_TIMEZONE) -> Tuple[datetime, datetime]:
    """Return the UTC start (inclusive) and end (exclusive) timestamps for the given year.

    Note:
        Year boundaries are set at 7:59:00 to match the game's month reset timing at 7:59.
    """

    start_local = datetime(year, 1, 1, 7, 59, 0, 0, tzinfo=tz)
    end_local = datetime(year + 1, 1, 1, 7, 59, 0, 0, tzinfo=tz)
    return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)


def current_month_range_utc(tz: ZoneInfo = DEFAULT_TIMEZONE) -> Tuple[datetime, datetime]:
    """Convenience helper that returns the current month range in UTC for the given timezone."""

    now_local = datetime.now(tz)
    return month_range_utc(now_local.year, now_local.month, tz)

