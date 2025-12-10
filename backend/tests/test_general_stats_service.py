from datetime import datetime

import pytest
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.duel import DuelCreate
from app.services.deck_service import deck_service
from app.services.duel_service import duel_service
from app.services.general_stats_service import general_stats_service


# テスト用の基本的なデータを作成するヘルパー関数
def create_test_data(db: Session, user: User):
    """勝率やデッキ分布のテストに必要な基本的なデータを作成します。"""
    deck1 = deck_service.get_or_create(
        db, user_id=user.id, name="MyDeck1", is_opponent=False
    )
    deck2 = deck_service.get_or_create(
        db, user_id=user.id, name="MyDeck2", is_opponent=False
    )
    opp_deck1 = deck_service.get_or_create(
        db, user_id=user.id, name="OppDeck1", is_opponent=True
    )
    opp_deck2 = deck_service.get_or_create(
        db, user_id=user.id, name="OppDeck2", is_opponent=True
    )

    duels_data = [
        # MyDeck1 vs OppDeck1 (3勝1敗)
        {
            "deck_id": deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "is_win": True,
            "won_coin_toss": True,
            "is_going_first": True,
            "played_date": datetime(2024, 7, 1),
            "game_mode": "RANK",
            "rank": 10,
        },
        {
            "deck_id": deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "is_win": True,
            "won_coin_toss": True,
            "is_going_first": True,
            "played_date": datetime(2024, 7, 2),
            "game_mode": "RANK",
            "rank": 10,
        },
        {
            "deck_id": deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "is_win": True,
            "won_coin_toss": True,
            "is_going_first": True,
            "played_date": datetime(2024, 7, 3),
            "game_mode": "RANK",
            "rank": 10,
        },
        {
            "deck_id": deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "is_win": False,
            "won_coin_toss": True,
            "is_going_first": True,
            "played_date": datetime(2024, 7, 4),
            "game_mode": "RANK",
            "rank": 10,
        },
        # MyDeck2 vs OppDeck2 (1勝2敗)
        {
            "deck_id": deck2.id,
            "opponent_deck_id": opp_deck2.id,
            "is_win": True,
            "won_coin_toss": True,
            "is_going_first": True,
            "played_date": datetime(2024, 7, 5),
            "game_mode": "RANK",
            "rank": 10,
        },
        {
            "deck_id": deck2.id,
            "opponent_deck_id": opp_deck2.id,
            "is_win": False,
            "won_coin_toss": True,
            "is_going_first": True,
            "played_date": datetime(2024, 7, 6),
            "game_mode": "RANK",
            "rank": 10,
        },
        {
            "deck_id": deck2.id,
            "opponent_deck_id": opp_deck2.id,
            "is_win": False,
            "won_coin_toss": True,
            "is_going_first": True,
            "played_date": datetime(2024, 7, 7),
            "game_mode": "RANK",
            "rank": 10,
        },
    ]

    for duel_data in duels_data:
        duel_in = DuelCreate(**duel_data)
        duel_service.create_user_duel(db, user_id=user.id, duel_in=duel_in)


class TestGeneralStatsService:
    """GeneralStatsServiceのテストクラス"""

    def test_calculate_general_stats(self, db_session: Session, test_user: User):
        """_calculate_general_statsヘルパーメソッドのテスト"""
        create_test_data(db_session, test_user)
        duels = duel_service.get_user_duels(db_session, test_user.id)

        # _calculate_general_stats はプライベートメソッドなので、general_stats_serviceインスタンス経由で呼び出す
        stats = general_stats_service._calculate_general_stats(duels)

        assert stats["total_duels"] == 7
        assert stats["win_count"] == 4
        assert stats["lose_count"] == 3
        assert stats["win_rate"] == pytest.approx((4 / 7) * 100)
        # 全て先行
        assert stats["first_turn_win_rate"] == pytest.approx((4 / 7) * 100)
        assert stats["second_turn_win_rate"] == 0
        # 全てジャンケン勝ち
        assert stats["coin_win_rate"] == pytest.approx(1.0 * 100)
        assert stats["go_first_rate"] == pytest.approx(1.0 * 100)

    def test_calculate_general_stats_mixed_turn_order(
        self, db_session: Session, test_user: User
    ):
        """先攻/後攻、コイン勝敗が混在する場合の統計計算テスト"""
        deck1 = deck_service.get_or_create(
            db_session, user_id=test_user.id, name="TestDeck", is_opponent=False
        )
        opp_deck = deck_service.get_or_create(
            db_session, user_id=test_user.id, name="OppDeck", is_opponent=True
        )

        duels_data = [
            # コイン勝利・先攻・勝利
            {
                "deck_id": deck1.id,
                "opponent_deck_id": opp_deck.id,
                "is_win": True,
                "won_coin_toss": True,
                "is_going_first": True,
                "played_date": datetime(2024, 8, 1),
                "game_mode": "RANK",
                "rank": 10,
            },
            # コイン勝利・先攻・敗北
            {
                "deck_id": deck1.id,
                "opponent_deck_id": opp_deck.id,
                "is_win": False,
                "won_coin_toss": True,
                "is_going_first": True,
                "played_date": datetime(2024, 8, 2),
                "game_mode": "RANK",
                "rank": 10,
            },
            # コイン敗北・後攻・勝利
            {
                "deck_id": deck1.id,
                "opponent_deck_id": opp_deck.id,
                "is_win": True,
                "won_coin_toss": False,
                "is_going_first": False,
                "played_date": datetime(2024, 8, 3),
                "game_mode": "RANK",
                "rank": 10,
            },
            # コイン敗北・後攻・敗北
            {
                "deck_id": deck1.id,
                "opponent_deck_id": opp_deck.id,
                "is_win": False,
                "won_coin_toss": False,
                "is_going_first": False,
                "played_date": datetime(2024, 8, 4),
                "game_mode": "RANK",
                "rank": 10,
            },
            # コイン勝利・後攻・勝利（コインに勝ったが後攻を選択）
            {
                "deck_id": deck1.id,
                "opponent_deck_id": opp_deck.id,
                "is_win": True,
                "won_coin_toss": True,
                "is_going_first": False,
                "played_date": datetime(2024, 8, 5),
                "game_mode": "RANK",
                "rank": 10,
            },
            # コイン敗北・先攻・敗北（コインに負けたが先攻を選択された）
            {
                "deck_id": deck1.id,
                "opponent_deck_id": opp_deck.id,
                "is_win": False,
                "won_coin_toss": False,
                "is_going_first": True,
                "played_date": datetime(2024, 8, 6),
                "game_mode": "RANK",
                "rank": 10,
            },
        ]

        for duel_data in duels_data:
            duel_in = DuelCreate(**duel_data)
            duel_service.create_user_duel(
                db_session, user_id=test_user.id, duel_in=duel_in
            )

        duels = duel_service.get_user_duels(db_session, test_user.id)
        stats = general_stats_service._calculate_general_stats(duels)

        # 総試合数
        assert stats["total_duels"] == 6

        # 勝敗数（3勝3敗）
        assert stats["win_count"] == 3
        assert stats["lose_count"] == 3
        assert stats["win_rate"] == pytest.approx(50.0)

        # 先攻勝率（先攻3試合中1勝2敗 = 33.33%）
        assert stats["first_turn_win_rate"] == pytest.approx((1 / 3) * 100)

        # 後攻勝率（後攻3試合中2勝1敗 = 66.67%）
        assert stats["second_turn_win_rate"] == pytest.approx((2 / 3) * 100)

        # コイン勝率（6試合中3勝 = 50%）
        assert stats["coin_win_rate"] == pytest.approx(50.0)

        # 先攻率（6試合中3試合先攻 = 50%）
        assert stats["go_first_rate"] == pytest.approx(50.0)
