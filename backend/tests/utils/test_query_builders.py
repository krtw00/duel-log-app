"""
���������ƣ�ƣnƹ�

q��������pn�\�<W~Y
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
    apply_duel_filters,
    apply_range_filter,
    build_base_duels_query,
)


def test_build_base_duels_query(db_session: Session, test_user: User):
    """
    build_base_duels_query: ����IDgգ���U�_������cWO��Y�K
    """
    # Arrange: ƹ�(n�&2�\
    my_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Test Deck", is_opponent=False
    )
    opponent_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Deck", is_opponent=True
    )
    db_session.commit()

    duel_in = DuelCreate(
        deck_id=my_deck.id,
        opponentDeck_id=opponent_deck.id,
        result=True,
        game_mode="RANK",
        rank=10,
        coin=True,
        first_or_second=True,
        played_date=datetime.utcnow(),
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_in)
    db_session.commit()

    # Act: ��������
    query = build_base_duels_query(db_session, test_user.id)
    duels = query.all()

    # Assert: ����n�&2L֗gM�Sh
    assert len(duels) == 1
    assert duels[0].user_id == test_user.id


def test_build_base_duels_query_with_game_mode(db_session: Session, test_user: User):
    """
    build_base_duels_query: ������gգ���gM�K
    """
    # Arrange: RANKhRATEn�&2�\
    my_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Test Deck", is_opponent=False
    )
    opponent_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Deck", is_opponent=True
    )
    db_session.commit()

    # RANK n�&2
    duel_rank = DuelCreate(
        deck_id=my_deck.id,
        opponentDeck_id=opponent_deck.id,
        result=True,
        game_mode="RANK",
        rank=10,
        coin=True,
        first_or_second=True,
        played_date=datetime.utcnow(),
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_rank)

    # RATE n�&2
    duel_rate = DuelCreate(
        deck_id=my_deck.id,
        opponentDeck_id=opponent_deck.id,
        result=False,
        game_mode="RATE",
        rank=None,
        coin=False,
        first_or_second=False,
        played_date=datetime.utcnow(),
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_rate)
    db_session.commit()

    # Act: RANK���ngգ���
    query = build_base_duels_query(db_session, test_user.id, game_mode="RANK")
    duels = query.all()

    # Assert: RANK���n�&2n֗gM�Sh
    assert len(duels) == 1
    assert duels[0].game_mode == "RANK"


def test_apply_date_range_filter_year_only(db_session: Session, test_user: User):
    """
    apply_date_range_filter: tgգ���gM�K
    """
    # Arrange: pj�tn�&2�\
    my_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Test Deck", is_opponent=False
    )
    opponent_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Deck", is_opponent=True
    )
    db_session.commit()

    # 2024tn�&2
    duel_2024 = DuelCreate(
        deck_id=my_deck.id,
        opponentDeck_id=opponent_deck.id,
        result=True,
        game_mode="RANK",
        rank=10,
        coin=True,
        first_or_second=True,
        played_date=datetime(2024, 6, 15),
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_2024)

    # 2025tn�&2
    duel_2025 = DuelCreate(
        deck_id=my_deck.id,
        opponentDeck_id=opponent_deck.id,
        result=False,
        game_mode="RANK",
        rank=9,
        coin=False,
        first_or_second=False,
        played_date=datetime(2025, 6, 15),
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_2025)
    db_session.commit()

    # Act: 2025tgգ���
    query = build_base_duels_query(db_session, test_user.id)
    query = apply_date_range_filter(query, year=2025)
    duels = query.all()

    # Assert: 2025tn�&2n֗gM�Sh
    assert len(duels) == 1
    assert duels[0].played_date.year == 2025


def test_apply_date_range_filter_year_and_month(db_session: Session, test_user: User):
    """
    apply_date_range_filter: tgգ���gM�K
    """
    # Arrange: pj�n�&2�\
    my_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Test Deck", is_opponent=False
    )
    opponent_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Deck", is_opponent=True
    )
    db_session.commit()

    # 2025t6n�&2
    duel_june = DuelCreate(
        deck_id=my_deck.id,
        opponentDeck_id=opponent_deck.id,
        result=True,
        game_mode="RANK",
        rank=10,
        coin=True,
        first_or_second=True,
        played_date=datetime(2025, 6, 15),
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_june)

    # 2025t7n�&2
    duel_july = DuelCreate(
        deck_id=my_deck.id,
        opponentDeck_id=opponent_deck.id,
        result=False,
        game_mode="RANK",
        rank=9,
        coin=False,
        first_or_second=False,
        played_date=datetime(2025, 7, 15),
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_july)
    db_session.commit()

    # Act: 2025t6gգ���
    query = build_base_duels_query(db_session, test_user.id)
    query = apply_date_range_filter(query, year=2025, month=6)
    duels = query.all()

    # Assert: 2025t6n�&2n֗gM�Sh
    assert len(duels) == 1
    assert duels[0].played_date.year == 2025
    assert duels[0].played_date.month == 6


def test_apply_deck_filters(db_session: Session, test_user: User):
    """
    apply_deck_filters: �����íh�K�ígգ���gM�K
    """
    # Arrange: pj��ín�&2�\
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
        opponentDeck_id=opponent_deck_1.id,
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
        opponentDeck_id=opponent_deck_2.id,
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
        opponentDeck_id=opponent_deck_1.id,
        result=True,
        game_mode="RANK",
        rank=10,
        coin=True,
        first_or_second=True,
        played_date=datetime.utcnow(),
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_3)
    db_session.commit()

    # Act: My Deck 1 gգ���
    query = build_base_duels_query(db_session, test_user.id)
    query = apply_deck_filters(query, my_deck_id=my_deck_1.id)
    duels = query.all()

    # Assert: My Deck 1 n�&2n֗gM�Sh
    assert len(duels) == 2
    assert all(d.deck_id == my_deck_1.id for d in duels)

    # Act: My Deck 1 vs Opponent Deck 1 gգ���
    query = build_base_duels_query(db_session, test_user.id)
    query = apply_deck_filters(
        query, my_deck_id=my_deck_1.id, opponent_deck_id=opponent_deck_1.id
    )
    duels = query.all()

    # Assert: y�n������n֗gM�Sh
    assert len(duels) == 1
    assert duels[0].deck_id == my_deck_1.id
    assert duels[0].opponentDeck_id == opponent_deck_1.id


def test_apply_range_filter(db_session: Session, test_user: User):
    """
    apply_range_filter: ���gգ���gM�K����	
    """
    # Arrange: pn�&2�\
    my_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Test Deck", is_opponent=False
    )
    opponent_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Deck", is_opponent=True
    )
    db_session.commit()

    # 5dn�&2�\�ؒWZdZ�Y	
    base_date = datetime.utcnow()
    for i in range(5):
        duel_in = DuelCreate(
            deck_id=my_deck.id,
            opponentDeck_id=opponent_deck.id,
            result=i % 2 == 0,  # ��k�W
            game_mode="RANK",
            rank=10 - i,
            coin=True,
            first_or_second=True,
            played_date=base_date - timedelta(days=i),  # �WD
        )
        duel_service.create_user_duel(
            db_session, user_id=test_user.id, duel_in=duel_in
        )
    db_session.commit()

    # Act: h�&2�֗�WD	
    query = build_base_duels_query(db_session, test_user.id)
    all_duels = query.order_by(Duel.played_date.desc()).all()

    # 1-3&�֗1�~�	
    filtered_duels = apply_range_filter(all_duels, range_start=1, range_end=3)

    # Assert: 3�֗gM�Sh
    assert len(filtered_duels) == 3
    #  �n3�gB�Sh
    assert filtered_duels == all_duels[:3]

    # Act: 2-4&�֗
    filtered_duels_2 = apply_range_filter(all_duels, range_start=2, range_end=4)

    # Assert: 3�֗gM�Sh���ï�1-3	
    assert len(filtered_duels_2) == 3
    assert filtered_duels_2 == all_duels[1:4]


def test_apply_duel_filters_combined(db_session: Session, test_user: User):
    """
    apply_duel_filters: pnգ뿒 �i(gM�K
    """
    # Arrange: �ja�n�&2�\
    my_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Test Deck", is_opponent=False
    )
    opponent_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Deck", is_opponent=True
    )
    db_session.commit()

    # 2025t6nRANK���n�&2
    duel_target = DuelCreate(
        deck_id=my_deck.id,
        opponentDeck_id=opponent_deck.id,
        result=True,
        game_mode="RANK",
        rank=10,
        coin=True,
        first_or_second=True,
        played_date=datetime(2025, 6, 15),
    )
    duel_service.create_user_duel(
        db_session, user_id=test_user.id, duel_in=duel_target
    )

    # 2025t7nRANK���n�&2dU��yM	
    duel_other_month = DuelCreate(
        deck_id=my_deck.id,
        opponentDeck_id=opponent_deck.id,
        result=False,
        game_mode="RANK",
        rank=9,
        coin=False,
        first_or_second=False,
        played_date=datetime(2025, 7, 15),
    )
    duel_service.create_user_duel(
        db_session, user_id=test_user.id, duel_in=duel_other_month
    )

    # 2025t6nRATE���n�&2dU��yM	
    duel_other_mode = DuelCreate(
        deck_id=my_deck.id,
        opponentDeck_id=opponent_deck.id,
        result=True,
        game_mode="RATE",
        rank=None,
        coin=True,
        first_or_second=True,
        played_date=datetime(2025, 6, 20),
    )
    duel_service.create_user_duel(
        db_session, user_id=test_user.id, duel_in=duel_other_mode
    )
    db_session.commit()

    # Act: pnգ뿒 �i(
    query = db_session.query(Duel)
    query = apply_duel_filters(
        query, user_id=test_user.id, game_mode="RANK", year=2025, month=6
    )
    duels = query.all()

    # Assert: a�k�Y��&2n֗gM�Sh
    assert len(duels) == 1
    assert duels[0].game_mode == "RANK"
    assert duels[0].played_date.year == 2025
    assert duels[0].played_date.month == 6
