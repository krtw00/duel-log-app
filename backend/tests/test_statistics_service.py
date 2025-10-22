
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

    def test_get_my_deck_win_rates_no_range(self, db_session: Session, test_user: User):
        """範囲指定なしの場合のデッキ別勝率が正しく計算されることをテスト"""
        create_test_data(db_session, test_user)

        win_rates = statistics_service.get_my_deck_win_rates(
            db=db_session,
            user_id=test_user.id,
            year=2024,
            month=7
        )

        assert len(win_rates) == 2
        
        # 結果は対戦数でソートされる
        my_deck1_stats = next((item for item in win_rates if item["deck_name"] == "MyDeck1"), None)
        my_deck2_stats = next((item for item in win_rates if item["deck_name"] == "MyDeck2"), None)

        assert my_deck1_stats is not None
        assert my_deck1_stats["total_duels"] == 4
        assert my_deck1_stats["wins"] == 3
        assert my_deck1_stats["win_rate"] == 75.0

        assert my_deck2_stats is not None
        assert my_deck2_stats["total_duels"] == 3
        assert my_deck2_stats["wins"] == 1
        assert my_deck2_stats["win_rate"] == pytest.approx(33.33, abs=0.01), "MyDeck2の勝率が正しくない"

    def test_get_my_deck_win_rates_with_range(self, db_session: Session, test_user: User):
        """Python側で集計する範囲指定ありの場合のデッキ別勝率をテスト"""
        create_test_data(db_session, test_user)

        # played_dateが新しい順にソートして、2戦目から5戦目までを取得するケース
        # 対象デュエル: 7/6, 7/5, 7/4, 7/3 (MyDeck2: 1勝2敗, MyDeck1: 1勝1敗)
        win_rates = statistics_service.get_my_deck_win_rates(
            db=db_session,
            user_id=test_user.id,
            year=2024,
            month=7,
            range_start=2,
            range_end=5
        )

        assert len(win_rates) == 2

        my_deck1_stats = next((item for item in win_rates if item["deck_name"] == "MyDeck1"), None)
        my_deck2_stats = next((item for item in win_rates if item["deck_name"] == "MyDeck2"), None)

        assert my_deck1_stats is not None
        assert my_deck1_stats["total_duels"] == 2
        assert my_deck1_stats["wins"] == 1
        assert my_deck1_stats["win_rate"] == 50.0

        assert my_deck2_stats is not None
        assert my_deck2_stats["total_duels"] == 2
        assert my_deck2_stats["wins"] == 1
        assert my_deck2_stats["win_rate"] == 50.0
