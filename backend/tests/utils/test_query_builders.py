"""Test cases for query builder utilities

Tests the common query builder functions for duels.
"""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.duel import Duel
from app.models.user import User
from app.schemas.duel import DuelCreate
from app.services.deck_service import deck_service
from app.services.duel_service import duel_service
from app.utils.query_builders import (
    apply_date_range_filter,
    apply_deck_filters,
    apply_range_filter,
    build_base_duels_query,
)


def test_build_base_duels_query(db_session: Session, test_user: User):
    """Test that build_base_duels_query filters by user ID correctly"""
    # Arrange
    my_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Test Deck", is_opponent=False
    )
    opponent_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Deck", is_opponent=True
    )
    db_session.commit()

    duel_in = DuelCreate(
        deck_id=my_deck.id,
        opponent_deck_id=opponent_deck.id,
        is_win=True,
        won_coin_toss=True,
        is_going_first=True,
        played_date=datetime.utcnow(),
        game_mode="RANK",
        rank=10,
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_in)
    db_session.commit()

    # Act
    query = build_base_duels_query(db_session, test_user.id)
    duels = query.all()

    # Assert
    assert len(duels) == 1
    assert duels[0].user_id == test_user.id


def test_build_base_duels_query_with_game_mode(db_session: Session, test_user: User):
    """Test that build_base_duels_query can filter by game mode"""
    # Arrange
    my_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Test Deck", is_opponent=False
    )
    opponent_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Deck", is_opponent=True
    )
    db_session.commit()

    # RANK duel
    duel_rank = DuelCreate(
        deck_id=my_deck.id,
        opponent_deck_id=opponent_deck.id,
        result=True,
        coin=True,
        first_or_second=True,
        played_date=datetime.utcnow(),
        game_mode="RANK",
        rank=10,
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_rank)

    # RATE duel
    duel_rate = DuelCreate(
        deck_id=my_deck.id,
        opponent_deck_id=opponent_deck.id,
        result=False,
        game_mode="RATE",
        rate_value=1500,
        coin=False,
        first_or_second=False,
        played_date=datetime.utcnow(),
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_rate)
    db_session.commit()

    # Act
    query = build_base_duels_query(db_session, test_user.id, game_mode="RANK")
    duels = query.all()

    # Assert
    assert len(duels) == 1
    assert duels[0].game_mode == "RANK"


def test_apply_date_range_filter_year_only(db_session: Session, test_user: User):
    """Test that apply_date_range_filter can filter by year"""
    # Arrange
    my_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Test Deck", is_opponent=False
    )
    opponent_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Deck", is_opponent=True
    )
    db_session.commit()

    # 2024 duel
    duel_2024 = DuelCreate(
        deck_id=my_deck.id,
        opponent_deck_id=opponent_deck.id,
        result=True,
        game_mode="RANK",
        rank=10,
        coin=True,
        first_or_second=True,
        played_date=datetime(2024, 6, 15),
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_2024)

    # 2025 duel
    duel_2025 = DuelCreate(
        deck_id=my_deck.id,
        opponent_deck_id=opponent_deck.id,
        result=False,
        game_mode="RANK",
        rank=9,
        coin=False,
        first_or_second=False,
        played_date=datetime(2025, 6, 15),
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_2025)
    db_session.commit()

    # Act
    query = build_base_duels_query(db_session, test_user.id)
    query = apply_date_range_filter(query, year=2025)
    duels = query.all()

    # Assert
    assert len(duels) == 1
    assert duels[0].played_date.year == 2025


def test_apply_deck_filters(db_session: Session, test_user: User):
    """Test that apply_deck_filters can filter by player and opponent decks"""
    # Arrange
    my_deck_1 = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="My Deck 1", is_opponent=False
    )
    my_deck_2 = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="My Deck 2", is_opponent=False
    )
    opponent_deck_1 = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Deck 1", is_opponent=True
    )
    opponent_deck_2 = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Deck 2", is_opponent=True
    )
    db_session.commit()

    # My Deck 1 vs Opponent Deck 1
    duel_1 = DuelCreate(
        deck_id=my_deck_1.id,
        opponent_deck_id=opponent_deck_1.id,
        result=True,
        game_mode="RANK",
        rank=10,
        coin=True,
        first_or_second=True,
        played_date=datetime.utcnow(),
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_1)

    # My Deck 1 vs Opponent Deck 2
    duel_2 = DuelCreate(
        deck_id=my_deck_1.id,
        opponent_deck_id=opponent_deck_2.id,
        result=False,
        game_mode="RANK",
        rank=9,
        coin=False,
        first_or_second=False,
        played_date=datetime.utcnow(),
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_2)

    # My Deck 2 vs Opponent Deck 1
    duel_3 = DuelCreate(
        deck_id=my_deck_2.id,
        opponent_deck_id=opponent_deck_1.id,
        result=True,
        game_mode="RANK",
        rank=10,
<<<<<<< HEAD
        won_coin_toss=True,
        is_going_first=True,
=======
        coin=True,
        first_or_second=True,
>>>>>>> 61c8c3148858a1b2a09d764383384e9ff4a1190f
        played_date=datetime.utcnow(),
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_3)
    db_session.commit()

    # Act: Filter by My Deck 1
    query = build_base_duels_query(db_session, test_user.id)
    query = apply_deck_filters(query, my_deck_id=my_deck_1.id)
    duels = query.all()

    # Assert
    assert len(duels) == 2
    assert all(d.deck_id == my_deck_1.id for d in duels)


def test_apply_range_filter(db_session: Session, test_user: User):
    """Test that apply_range_filter works correctly with range parameters"""
    # Arrange
    my_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Test Deck", is_opponent=False
    )
    opponent_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Deck", is_opponent=True
    )
    db_session.commit()

    # Create 5 duels
    base_date = datetime.utcnow()
    for i in range(5):
        duel_in = DuelCreate(
            deck_id=my_deck.id,
            opponent_deck_id=opponent_deck.id,
            result=i % 2 == 0,
            game_mode="RANK",
            rank=10 - i,
            coin=True,
            first_or_second=True,
            played_date=base_date - timedelta(days=i),
        )
        duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_in)
    db_session.commit()

    # Act
    query = build_base_duels_query(db_session, test_user.id)
    all_duels = query.order_by(Duel.played_date.desc()).all()
    filtered_duels = apply_range_filter(all_duels, range_start=1, range_end=3)

    # Assert
    assert len(filtered_duels) == 3
    assert filtered_duels == all_duels[:3]
