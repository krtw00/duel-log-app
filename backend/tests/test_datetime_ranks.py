"""
日付ユーティリティとランクユーティリティのテスト
"""

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import pytest

from app.utils.datetime_utils import (
    DEFAULT_TIMEZONE,
    current_month_range_utc,
    month_range_utc,
    recent_two_months_range_utc,
    year_range_utc,
)
from app.utils.ranks import RANK_MAPPING, get_rank_name, get_rank_value


class TestMonthRangeUtc:
    """month_range_utc関数のテスト"""

    def test_basic_month(self):
        """基本的な月の範囲取得"""
        start, end = month_range_utc(2023, 6)

        # JSTで2023年6月1日7:59からUTCに変換
        assert start.tzinfo == timezone.utc
        assert end.tzinfo == timezone.utc
        assert start < end

    def test_january(self):
        """1月の範囲"""
        start, end = month_range_utc(2023, 1)

        # 終了は翌月
        assert start < end
        assert start.month == 12 or start.month == 1  # UTCなので前日の可能性
        assert end.month == 1 or end.month == 2

    def test_december(self):
        """12月の範囲（年をまたぐケース）"""
        start, end = month_range_utc(2023, 12)

        # 12月の終了は翌年1月
        assert start < end

    def test_invalid_month_too_low(self):
        """不正な月（0以下）"""
        with pytest.raises(ValueError, match="month must be between 1 and 12"):
            month_range_utc(2023, 0)

    def test_invalid_month_too_high(self):
        """不正な月（13以上）"""
        with pytest.raises(ValueError, match="month must be between 1 and 12"):
            month_range_utc(2023, 13)

    def test_custom_timezone(self):
        """カスタムタイムゾーン"""
        tz_utc = ZoneInfo("UTC")
        start_utc, end_utc = month_range_utc(2023, 6, tz=tz_utc)
        start_jst, end_jst = month_range_utc(2023, 6, tz=DEFAULT_TIMEZONE)

        # UTC解釈とJST解釈では異なるUTC時刻になる
        assert start_utc != start_jst

    def test_game_reset_time(self):
        """ゲームリセット時刻（7:59）が使われている"""
        start, end = month_range_utc(2023, 6)

        # JSTで7:59をUTCに変換すると22:59になる（前日）
        # JST = UTC + 9時間なので、7:59 JST = 22:59 UTC (前日)
        jst = ZoneInfo("Asia/Tokyo")
        start_jst = start.astimezone(jst)
        assert start_jst.hour == 7
        assert start_jst.minute == 59


class TestYearRangeUtc:
    """year_range_utc関数のテスト"""

    def test_basic_year(self):
        """基本的な年の範囲取得"""
        start, end = year_range_utc(2023)

        assert start.tzinfo == timezone.utc
        assert end.tzinfo == timezone.utc
        assert start < end

    def test_year_spans_12_months(self):
        """年の範囲が12ヶ月分ある"""
        start, end = year_range_utc(2023)

        # 約1年の差がある
        diff = end - start
        assert 364 <= diff.days <= 366  # うるう年を考慮

    def test_leap_year(self):
        """うるう年"""
        start, end = year_range_utc(2024)

        diff = end - start
        assert diff.days >= 365  # 366日


class TestCurrentMonthRangeUtc:
    """current_month_range_utc関数のテスト"""

    def test_returns_current_month(self):
        """現在の月の範囲を返す"""
        start, end = current_month_range_utc()

        now = datetime.now(DEFAULT_TIMEZONE)
        expected_start, expected_end = month_range_utc(now.year, now.month)

        assert start == expected_start
        assert end == expected_end


class TestRecentTwoMonthsRangeUtc:
    """recent_two_months_range_utc関数のテスト"""

    def test_basic(self):
        """2ヶ月分の範囲を返す"""
        start, end = recent_two_months_range_utc()

        # 範囲が存在する
        assert start < end

        # 約2ヶ月分の差がある
        diff = end - start
        assert 28 <= diff.days <= 63  # 2ヶ月分の範囲

    def test_january_spans_to_previous_year(self):
        """1月の場合は前年12月にまたがる"""
        # 直接テストするのは難しいので、関数がエラーなく動作することを確認
        start, end = recent_two_months_range_utc()
        assert start.tzinfo == timezone.utc
        assert end.tzinfo == timezone.utc


class TestRankName:
    """get_rank_name関数のテスト"""

    def test_all_ranks(self):
        """全ランクが変換できる"""
        for value, name in RANK_MAPPING.items():
            result = get_rank_name(value)
            assert result == name

    def test_beginner_ranks(self):
        """ビギナーランク"""
        assert get_rank_name(1) == "ビギナー2"
        assert get_rank_name(2) == "ビギナー1"

    def test_bronze_ranks(self):
        """ブロンズランク"""
        assert get_rank_name(3) == "ブロンズ5"
        assert get_rank_name(7) == "ブロンズ1"

    def test_master_ranks(self):
        """マスターランク"""
        assert get_rank_name(28) == "マスター5"
        assert get_rank_name(32) == "マスター1"

    def test_none_value(self):
        """Noneの場合は空文字列"""
        assert get_rank_name(None) == ""

    def test_unknown_value(self):
        """不明な値の場合は"不明"を返す"""
        assert get_rank_name(0) == "不明"
        assert get_rank_name(100) == "不明"
        assert get_rank_name(-1) == "不明"


class TestRankValue:
    """get_rank_value関数のテスト"""

    def test_all_ranks_reverse(self):
        """全ランク名が値に変換できる"""
        for value, name in RANK_MAPPING.items():
            result = get_rank_value(name)
            assert result == value

    def test_beginner_names(self):
        """ビギナーランク名"""
        assert get_rank_value("ビギナー2") == 1
        assert get_rank_value("ビギナー1") == 2

    def test_master_names(self):
        """マスターランク名"""
        assert get_rank_value("マスター5") == 28
        assert get_rank_value("マスター1") == 32

    def test_none_value(self):
        """Noneの場合はNone"""
        assert get_rank_value(None) is None

    def test_empty_string(self):
        """空文字列の場合はNone"""
        assert get_rank_value("") is None

    def test_unknown_name(self):
        """不明なランク名の場合はNone"""
        assert get_rank_value("不明なランク") is None
        assert get_rank_value("Unknown") is None


class TestRankConsistency:
    """ランク変換の一貫性テスト"""

    def test_roundtrip_value_to_name_to_value(self):
        """値→名前→値の往復変換"""
        for original_value in range(1, 33):
            name = get_rank_name(original_value)
            recovered_value = get_rank_value(name)
            assert recovered_value == original_value

    def test_ranking_order(self):
        """ランク順序が正しい（値が大きいほど高ランク）"""
        ranks = [
            "ビギナー2", "ビギナー1",
            "ブロンズ5", "ブロンズ4", "ブロンズ3", "ブロンズ2", "ブロンズ1",
            "シルバー5", "シルバー4", "シルバー3", "シルバー2", "シルバー1",
            "ゴールド5", "ゴールド4", "ゴールド3", "ゴールド2", "ゴールド1",
            "プラチナ5", "プラチナ4", "プラチナ3", "プラチナ2", "プラチナ1",
            "ダイヤ5", "ダイヤ4", "ダイヤ3", "ダイヤ2", "ダイヤ1",
            "マスター5", "マスター4", "マスター3", "マスター2", "マスター1",
        ]

        values = [get_rank_value(name) for name in ranks]

        # 昇順になっている
        for i in range(len(values) - 1):
            assert values[i] < values[i + 1], f"{ranks[i]} should be lower than {ranks[i+1]}"
