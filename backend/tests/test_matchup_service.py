from datetime import datetime

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.duel import DuelCreate
from app.services.deck_service import deck_service
from app.services.duel_service import duel_service
from app.services.matchup_service import matchup_service


def create_matchup_test_data(db: Session, user: User):
    """相性テスト用の基本的なデータを作成します。"""
    my_deck1 = deck_service.get_or_create(
        db, user_id=user.id, name="MyDeck1", is_opponent=False
    )
    my_deck2 = deck_service.get_or_create(
        db, user_id=user.id, name="MyDeck2", is_opponent=False
    )
    opp_deck1 = deck_service.get_or_create(
        db, user_id=user.id, name="OppDeck1", is_opponent=True
    )
    opp_deck2 = deck_service.get_or_create(
        db, user_id=user.id, name="OppDeck2", is_opponent=True
    )

    duels_data = [
        # MyDeck1 vs OppDeck1: 1勝1敗 (先行1勝, 後攻1敗)
        {
            "deck_id": my_deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "is_win": True,
            "is_going_first": True,
            "won_coin_toss": True,
            "played_date": datetime(2024, 7, 1),
            "game_mode": "RANK",
            "rank": 10,
        },
        {
            "deck_id": my_deck1.id,
            "opponent_deck_id": opp_deck1.id,
            "is_win": False,
            "is_going_first": False,
            "won_coin_toss": True,
            "played_date": datetime(2024, 7, 2),
            "game_mode": "RANK",
            "rank": 10,
        },
        # MyDeck1 vs OppDeck2: 1勝0敗 (先行1勝)
        {
            "deck_id": my_deck1.id,
            "opponent_deck_id": opp_deck2.id,
            "is_win": True,
            "is_going_first": True,
            "won_coin_toss": True,
            "played_date": datetime(2024, 7, 3),
            "game_mode": "RANK",
            "rank": 10,
        },
        # MyDeck2 vs OppDeck1: 0勝1敗 (後攻1敗)
        {
            "deck_id": my_deck2.id,
            "opponent_deck_id": opp_deck1.id,
            "is_win": False,
            "is_going_first": False,
            "won_coin_toss": True,
            "played_date": datetime(2024, 7, 4),
            "game_mode": "RANK",
            "rank": 10,
        },
    ]

    for duel_data in duels_data:
        duel_in = DuelCreate(**duel_data)
        duel_service.create_user_duel(db, user_id=user.id, duel_in=duel_in)


class TestMatchupService:
    """MatchupServiceのテストクラス"""

    def test_get_matchup_chart(self, db_session: Session, test_user: User):
        """デッキ相性表の計算ロジックをテスト"""
        create_matchup_test_data(db_session, test_user)

        chart_data = matchup_service.get_matchup_chart(
            db=db_session, user_id=test_user.id, year=2024, month=7
        )

        assert len(chart_data) == 3  # 3つの対戦組み合わせ

        # MyDeck1 vs OppDeck1 のデータを探す
        mydeck1_vs_oppdeck1 = next(
            (
                d
                for d in chart_data
                if d["deck_name"] == "MyDeck1" and d["opponent_deck_name"] == "OppDeck1"
            ),
            None,
        )
        assert mydeck1_vs_oppdeck1 is not None
        assert mydeck1_vs_oppdeck1["total_duels"] == 2
        assert mydeck1_vs_oppdeck1["wins"] == 1
        assert mydeck1_vs_oppdeck1["losses"] == 1
        assert mydeck1_vs_oppdeck1["win_rate"] == 50.0
        assert mydeck1_vs_oppdeck1["win_rate_first"] == 100.0
        assert mydeck1_vs_oppdeck1["win_rate_second"] == 0.0

        # MyDeck1 vs OppDeck2 のデータを探す
        mydeck1_vs_oppdeck2 = next(
            (
                d
                for d in chart_data
                if d["deck_name"] == "MyDeck1" and d["opponent_deck_name"] == "OppDeck2"
            ),
            None,
        )
        assert mydeck1_vs_oppdeck2 is not None
        assert mydeck1_vs_oppdeck2["total_duels"] == 1
        assert mydeck1_vs_oppdeck2["wins"] == 1
        assert mydeck1_vs_oppdeck2["win_rate"] == 100.0
        assert mydeck1_vs_oppdeck2["win_rate_first"] == 100.0
        assert mydeck1_vs_oppdeck2["win_rate_second"] == 0.0

        # MyDeck2 vs OppDeck1 のデータを探す
        mydeck2_vs_oppdeck1 = next(
            (
                d
                for d in chart_data
                if d["deck_name"] == "MyDeck2" and d["opponent_deck_name"] == "OppDeck1"
            ),
            None,
        )
        assert mydeck2_vs_oppdeck1 is not None
        assert mydeck2_vs_oppdeck1["total_duels"] == 1
        assert mydeck2_vs_oppdeck1["wins"] == 0
        assert mydeck2_vs_oppdeck1["win_rate"] == 0.0
        assert mydeck2_vs_oppdeck1["win_rate_first"] == 0.0
        assert mydeck2_vs_oppdeck1["win_rate_second"] == 0.0
