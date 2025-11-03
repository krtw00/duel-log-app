from datetime import datetime, timezone

from fastapi import status

from app.models.deck import Deck
from app.models.duel import Duel


def _insert_decks_and_duel(db_session, user_id: int) -> None:
    my_deck = Deck(user_id=user_id, name="My Deck", is_opponent=False)
    opp_deck = Deck(user_id=user_id, name="Opp Deck", is_opponent=True)
    db_session.add_all([my_deck, opp_deck])
    db_session.commit()

    duel = Duel(
        user_id=user_id,
        deck_id=my_deck.id,
        opponent_deck_id=opp_deck.id,
        won_coin_toss=True,
        is_going_first=True,
        is_win=True,
        game_mode="RATE",
        rate_value=1500.0,
        played_date=datetime(2024, 5, 31, 15, 0, tzinfo=timezone.utc),
        notes=None,
    )
    db_session.add(duel)
    db_session.commit()


def test_statistics_monthly_uses_local_timezone(
    authenticated_client, db_session, test_user
):
    """Statistics API should treat month boundaries in the configured local timezone."""

    _insert_decks_and_duel(db_session, test_user.id)

    response = authenticated_client.get("/statistics", params={"year": 2024, "month": 6})
    assert response.status_code == status.HTTP_200_OK

    stats = response.json()
    assert stats["RATE"]["overall_stats"]["total_duels"] == 1


def test_shared_statistics_respects_local_timezone(
    authenticated_client, db_session, test_user
):
    """Shared statistics endpoints should mirror the same timezone-aware month boundaries."""

    _insert_decks_and_duel(db_session, test_user.id)

    create_response = authenticated_client.post(
        "/shared-statistics/",
        json={"year": 2024, "month": 6, "game_mode": "RATE"},
    )
    assert create_response.status_code == status.HTTP_201_CREATED
    share_id = create_response.json()["share_id"]

    shared_response = authenticated_client.get(f"/shared-statistics/{share_id}")
    assert shared_response.status_code == status.HTTP_200_OK

    shared_stats = shared_response.json()["statistics_data"]
    assert shared_stats["RATE"]["overall_stats"]["total_duels"] == 1
