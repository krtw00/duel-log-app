from datetime import datetime

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.duel import DuelCreate
from app.services.deck_service import deck_service
from app.services.duel_service import duel_service
from app.services.value_sequence_service import value_sequence_service


def create_value_sequence_test_data(db: Session, user: User):
    """値シーケンステスト用の基本的なデータを作成します。"""
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
            "is_win": True,
            "won_coin_toss": True,
            "is_going_first": True,
            "game_mode": "RATE",
            "rate_value": 1500,
            "played_date": datetime(2024, 7, 1, 10, 0, 0),
        },
        {
            "deck_id": deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "is_win": False,
            "won_coin_toss": True,
            "is_going_first": True,
            "game_mode": "RATE",
            "rate_value": 1480,
            "played_date": datetime(2024, 7, 1, 11, 0, 0),
        },
        {
            "deck_id": deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "is_win": True,
            "won_coin_toss": False,
            "is_going_first": False,
            "game_mode": "RATE",
            "rate_value": 1520,
            "played_date": datetime(2024, 7, 3, 9, 0, 0),
        },
        # DCモードのデータ
        {
            "deck_id": deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "is_win": True,
            "won_coin_toss": True,
            "is_going_first": True,
            "game_mode": "DC",
            "dc_value": 1000,
            "played_date": datetime(2024, 7, 5, 14, 0, 0),
        },
        {
            "deck_id": deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "is_win": True,
            "won_coin_toss": False,
            "is_going_first": False,
            "game_mode": "DC",
            "dc_value": 2000,
            "played_date": datetime(2024, 7, 5, 15, 0, 0),
        },
    ]

    for duel_data in duels_data:
        duel_in = DuelCreate(**duel_data)
        duel_service.create_user_duel(db, user_id=user.id, duel_in=duel_in)


class TestValueSequenceService:
    """ValueSequenceServiceのテストクラス"""

    def test_get_value_sequence_data_rate(self, db_session: Session, test_user: User):
        """RATEモードの値シーケンスが正しく生成されるかテスト"""
        create_value_sequence_test_data(db_session, test_user)

        value_sequence = value_sequence_service.get_value_sequence_data(
            db=db_session, user_id=test_user.id, game_mode="RATE", year=2024, month=7
        )

        # 試合ごとの生値が順番に取得できることを確認
        assert len(value_sequence) == 3
        assert [item["value"] for item in value_sequence] == [1500, 1480, 1520]

    def test_get_value_sequence_data_dc(self, db_session: Session, test_user: User):
        """DCモードの値シーケンスが正しく生成されるかテスト"""
        create_value_sequence_test_data(db_session, test_user)

        value_sequence = value_sequence_service.get_value_sequence_data(
            db=db_session, user_id=test_user.id, game_mode="DC", year=2024, month=7
        )

        # 1日の複数試合がそのまま返ることを確認
        assert len(value_sequence) == 2
        assert [item["value"] for item in value_sequence] == [1000, 2000]
