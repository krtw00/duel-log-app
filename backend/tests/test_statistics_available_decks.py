from datetime import datetime, timezone

from app.models.deck import Deck
from app.models.duel import Duel


def test_available_decks_are_sorted_by_name(authenticated_client, db_session, test_user):
    my_deck = Deck(user_id=test_user.id, name="Zoo", is_opponent=False, active=True)
    opp_a = Deck(user_id=test_user.id, name="Beta", is_opponent=True, active=True)
    opp_b = Deck(user_id=test_user.id, name="Alpha", is_opponent=True, active=True)
    db_session.add_all([my_deck, opp_a, opp_b])
    db_session.commit()

    duel = Duel(
        user_id=test_user.id,
        deck_id=my_deck.id,
        opponent_deck_id=opp_a.id,
        is_win=True,
        game_mode="RANK",
        rank=1,
        won_coin_toss=True,
        is_going_first=True,
        played_date=datetime(2026, 1, 15, tzinfo=timezone.utc),
        notes=None,
    )
    duel2 = Duel(
        user_id=test_user.id,
        deck_id=my_deck.id,
        opponent_deck_id=opp_b.id,
        is_win=True,
        game_mode="RANK",
        rank=1,
        won_coin_toss=True,
        is_going_first=True,
        played_date=datetime(2026, 1, 16, tzinfo=timezone.utc),
        notes=None,
    )
    db_session.add_all([duel, duel2])
    db_session.commit()

    res = authenticated_client.get(
        "/statistics/available-decks",
        params={"year": 2026, "month": 1, "game_mode": "RANK"},
    )
    assert res.status_code == 200
    payload = res.json()

    assert payload["my_decks"] == [{"id": my_deck.id, "name": "Zoo"}]
    assert [d["name"] for d in payload["opponent_decks"]] == ["Alpha", "Beta"]

