
import pytest
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.services.statistics_service import statistics_service
from app.services.deck_service import deck_service
from app.services.duel_service import duel_service
from app.schemas.deck import DeckCreate
from app.schemas.duel import DuelCreate
from app.models.user import User

# テスト用の基本的なデータを作成するヘルパー関数
def create_test_data(db: Session, user: User):
    """勝率やデッキ分布のテストに必要な基本的なデータを作成します。"""
    deck1 = deck_service.get_or_create(db, user_id=user.id, name="MyDeck1", is_opponent=False)
    deck2 = deck_service.get_or_create(db, user_id=user.id, name="MyDeck2", is_opponent=False)
    opp_deck1 = deck_service.get_or_create(db, user_id=user.id, name="OppDeck1", is_opponent=True)
    opp_deck2 = deck_service.get_or_create(db, user_id=user.id, name="OppDeck2", is_opponent=True)

    duels_data = [
        # MyDeck1 vs OppDeck1 (3勝1敗)
        {"deck_id": deck1.id, "opponentDeck_id": opp_deck1.id, "result": True, "coin": True, "first_or_second": True, "played_date": datetime(2024, 7, 1)},
        {"deck_id": deck1.id, "opponentDeck_id": opp_deck1.id, "result": True, "coin": True, "first_or_second": True, "played_date": datetime(2024, 7, 2)},
        {"deck_id": deck1.id, "opponentDeck_id": opp_deck1.id, "result": True, "coin": True, "first_or_second": True, "played_date": datetime(2024, 7, 3)},
        {"deck_id": deck1.id, "opponentDeck_id": opp_deck1.id, "result": False, "coin": True, "first_or_second": True, "played_date": datetime(2024, 7, 4)},
        # MyDeck2 vs OppDeck2 (1勝2敗)
        {"deck_id": deck2.id, "opponentDeck_id": opp_deck2.id, "result": True, "coin": True, "first_or_second": True, "played_date": datetime(2024, 7, 5)},
        {"deck_id": deck2.id, "opponentDeck_id": opp_deck2.id, "result": False, "coin": True, "first_or_second": True, "played_date": datetime(2024, 7, 6)},
        {"deck_id": deck2.id, "opponentDeck_id": opp_deck2.id, "result": False, "coin": True, "first_or_second": True, "played_date": datetime(2024, 7, 7)},
    ]

    for duel_data in duels_data:
        duel_in = DuelCreate(**duel_data)
        duel_service.create_user_duel(db, user_id=user.id, duel_in=duel_in)

class TestStatisticsService:
    """
    StatisticsServiceのテストクラス
    """


    def test_get_deck_distribution_monthly_no_range(self, db_session: Session, test_user: User):
        """範囲指定なしの場合の相手デッキ分布が正しく計算されることをテスト"""
        create_test_data(db_session, test_user)

        distribution = statistics_service.get_deck_distribution_monthly(
            db=db_session,
            user_id=test_user.id,
            year=2024,
            month=7
        )

        assert len(distribution) == 2

        opp_deck1_stats = next((item for item in distribution if item["deck_name"] == "OppDeck1"), None)
        opp_deck2_stats = next((item for item in distribution if item["deck_name"] == "OppDeck2"), None)

        assert opp_deck1_stats is not None
        assert opp_deck1_stats["count"] == 4
        assert opp_deck1_stats["percentage"] == pytest.approx((4/7) * 100)

        assert opp_deck2_stats is not None
        assert opp_deck2_stats["count"] == 3
        assert opp_deck2_stats["percentage"] == pytest.approx((3/7) * 100)

    def test_get_deck_distribution_monthly_with_range(self, db_session: Session, test_user: User):
        """範囲指定ありの場合の相手デッキ分布が正しく計算されることをテスト"""
        create_test_data(db_session, test_user)

        # played_dateが新しい順にソートして、2戦目から5戦目までを取得するケース
        # 対象デュエル: 7/6, 7/5, 7/4, 7/3
        # この範囲での相手デッキ: OppDeck2, OppDeck2, OppDeck1, OppDeck1
        distribution = statistics_service.get_deck_distribution_monthly(
            db=db_session,
            user_id=test_user.id,
            year=2024,
            month=7,
            range_start=2,
            range_end=5
        )

        assert len(distribution) == 2

        opp_deck1_stats = next((item for item in distribution if item["deck_name"] == "OppDeck1"), None)
        opp_deck2_stats = next((item for item in distribution if item["deck_name"] == "OppDeck2"), None)

        assert opp_deck1_stats is not None
        assert opp_deck1_stats["count"] == 2
        assert opp_deck1_stats["percentage"] == 50.0

        assert opp_deck2_stats is not None
        assert opp_deck2_stats["count"] == 2
        assert opp_deck2_stats["percentage"] == 50.0

    def test_get_deck_distribution_recent_with_limit(self, db_session: Session, test_user: User):
        """limit指定ありの場合の直近の相手デッキ分布をテスト"""
        create_test_data(db_session, test_user)

        # 直近5戦: 7/7, 7/6, 7/5, 7/4, 7/3
        # 相手デッキ: OppDeck2, OppDeck2, OppDeck2, OppDeck1, OppDeck1
        distribution = statistics_service.get_deck_distribution_recent(
            db=db_session,
            user_id=test_user.id,
            limit=5
        )

        assert len(distribution) == 2

        opp_deck1_stats = next((item for item in distribution if item["deck_name"] == "OppDeck1"), None)
        opp_deck2_stats = next((item for item in distribution if item["deck_name"] == "OppDeck2"), None)

        assert opp_deck1_stats is not None
        assert opp_deck1_stats["count"] == 2
        assert opp_deck1_stats["percentage"] == 40.0 # 2/5

        assert opp_deck2_stats is not None
        assert opp_deck2_stats["count"] == 3
        assert opp_deck2_stats["percentage"] == 60.0 # 3/5

    def test_get_deck_distribution_recent_with_range(self, db_session: Session, test_user: User):
        """range指定ありの場合の直近の相手デッキ分布をテスト"""
        create_test_data(db_session, test_user)

        # 2戦目から5戦目: 7/6, 7/5, 7/4, 7/3
        # 相手デッキ: OppDeck2, OppDeck2, OppDeck1, OppDeck1
        distribution = statistics_service.get_deck_distribution_recent(
            db=db_session,
            user_id=test_user.id,
            range_start=2,
            range_end=5
        )

        assert len(distribution) == 2

        opp_deck1_stats = next((item for item in distribution if item["deck_name"] == "OppDeck1"), None)
        opp_deck2_stats = next((item for item in distribution if item["deck_name"] == "OppDeck2"), None)

        assert opp_deck1_stats is not None
        assert opp_deck1_stats["count"] == 2
        assert opp_deck1_stats["percentage"] == 50.0

        assert opp_deck2_stats is not None
        assert opp_deck2_stats["count"] == 2
        assert opp_deck2_stats["percentage"] == 50.0

