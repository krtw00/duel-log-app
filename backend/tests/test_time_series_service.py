from datetime import datetime

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.duel import DuelCreate
from app.services.deck_service import deck_service
from app.services.duel_service import duel_service
from app.services.time_series_service import time_series_service


def create_time_series_test_data(db: Session, user: User):
    """時系列データテスト用の基本的なデータを作成します。"""
    deck1 = deck_service.get_or_create(
        db, user_id=user.id, name="MyDeck1", is_opponent=False
    )
    opp_deck1 = deck_service.get_or_create(
        db, user_id=user.id, name="OppDeck1", is_opponent=True
    )

    duels_data = [
        # RATEモードのデータ
        {
            "deck_id": deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "result": True,
            "coin": True,
            "first_or_second": True,
            "game_mode": "RATE",
            "rate_value": 1500,
            "played_date": datetime(2024, 7, 1, 10, 0, 0),
        },
        {
            "deck_id": deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "result": False,
            "coin": True,
            "first_or_second": True,
            "game_mode": "RATE",
            "rate_value": 1480,
            "played_date": datetime(2024, 7, 1, 11, 0, 0),
        },
        {
            "deck_id": deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "result": True,
            "coin": False,
            "first_or_second": False,
            "game_mode": "RATE",
            "rate_value": 1520,
            "played_date": datetime(2024, 7, 3, 9, 0, 0),
        },
        # DCモードのデータ
        {
            "deck_id": deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "result": True,
            "coin": True,
            "first_or_second": True,
            "game_mode": "DC",
            "dc_value": 1000,
            "played_date": datetime(2024, 7, 5, 14, 0, 0),
        },
        {
            "deck_id": deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "result": True,
            "coin": False,
            "first_or_second": False,
            "game_mode": "DC",
            "dc_value": 2000,
            "played_date": datetime(2024, 7, 5, 15, 0, 0),
        },
    ]

    for duel_data in duels_data:
        duel_in = DuelCreate(**duel_data)
        duel_service.create_user_duel(db, user_id=user.id, duel_in=duel_in)


class TestTimeSeriesService:
    """TimeSeriesServiceのテストクラス"""

    def test_get_time_series_data_rate(self, db_session: Session, test_user: User):
        """RATEモードの時系列データが正しく生成されるかテスト"""
        create_time_series_test_data(db_session, test_user)

        time_series = time_series_service.get_time_series_data(
            db=db_session, user_id=test_user.id, game_mode="RATE", year=2024, month=7
        )

        # 日付ごとに最後の値が採用されることを確認
        assert len(time_series) == 2
        assert time_series[0]["date"] == "2024-07-01"
        assert time_series[0]["value"] == 1480  # 7/1の最後のレート
        assert time_series[1]["date"] == "2024-07-03"
        assert time_series[1]["value"] == 1520  # 7/3の最後のレート

    def test_get_time_series_data_dc(self, db_session: Session, test_user: User):
        """DCモードの時系列データが正しく生成されるかテスト"""
        create_time_series_test_data(db_session, test_user)

        time_series = time_series_service.get_time_series_data(
            db=db_session, user_id=test_user.id, game_mode="DC", year=2024, month=7
        )

        # 1日の中に複数のデータ
        assert len(time_series) == 1
        assert time_series[0]["date"] == "2024-07-05"
        assert time_series[0]["value"] == 2000  # 7/5の最後のDCポイント
