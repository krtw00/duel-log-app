from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.duel import DuelCreate
from app.services.deck_service import deck_service
from app.services.duel_service import duel_service


def test_create_user_duel(db_session: Session, test_user: User):
    # Arrange
    my_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="My Test Deck", is_opponent=False
    )
    opponent_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Test Deck", is_opponent=True
    )
    db_session.commit()

    duel_in = DuelCreate(
        deck_id=my_deck.id,
        opponent_deck_id=opponent_deck.id,
        is_win=True,
        game_mode="RANK",
        rank=10,
        won_coin_toss=True,
        is_going_first=True,
        played_date=datetime.utcnow(),
    )

    # Act
    created_duel = duel_service.create_user_duel(
        db_session, user_id=test_user.id, duel_in=duel_in
    )

    # Assert
    assert created_duel is not None
    assert created_duel.user_id == test_user.id
    assert created_duel.deck_id == my_deck.id
    assert created_duel.opponent_deck_id == opponent_deck.id
    assert created_duel.is_win is True
    assert created_duel.game_mode == "RANK"
    assert created_duel.rank == 10


def test_get_user_duels(db_session: Session, test_user: User):
    # Arrange
    my_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="My Test Deck", is_opponent=False
    )
    opponent_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Test Deck", is_opponent=True
    )
    db_session.commit()

    duel_in_1 = DuelCreate(
        deck_id=my_deck.id,
        opponent_deck_id=opponent_deck.id,
        is_win=True,
        game_mode="RANK",
        rank=10,
        played_date=datetime(2023, 1, 15, tzinfo=ZoneInfo("UTC")),
        won_coin_toss=True,
        is_going_first=True,
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_in_1)

    duel_in_2 = DuelCreate(
        deck_id=my_deck.id,
        opponent_deck_id=opponent_deck.id,
        is_win=False,
        game_mode="RATE",
        rate_value=1500.0,
        played_date=datetime(2023, 2, 15, tzinfo=ZoneInfo("UTC")),
        won_coin_toss=False,
        is_going_first=False,
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_in_2)

    # Act
    all_duels = duel_service.get_user_duels(db_session, user_id=test_user.id)
    jan_duels = duel_service.get_user_duels(
        db_session, user_id=test_user.id, year=2023, month=1
    )
    rank_duels = duel_service.get_user_duels(
        db_session, user_id=test_user.id, game_mode="RANK"
    )
    ranged_duels = duel_service.get_user_duels(
        db_session, user_id=test_user.id, range_start=2
    )

    # Assert
    assert len(all_duels) == 2
    assert len(jan_duels) == 1
    assert jan_duels[0].game_mode == "RANK"
    assert len(rank_duels) == 1
    assert rank_duels[0].game_mode == "RANK"
    assert len(ranged_duels) == 1
    assert ranged_duels[0].played_date == datetime(2023, 1, 15, tzinfo=ZoneInfo("UTC"))


def test_export_duels_to_csv(db_session: Session, test_user: User):
    # Arrange
    my_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="My Test Deck", is_opponent=False
    )
    opponent_deck = deck_service.get_or_create(
        db_session, user_id=test_user.id, name="Opponent Test Deck", is_opponent=True
    )
    db_session.commit()

    duel_in = DuelCreate(
        deck_id=my_deck.id,
        opponent_deck_id=opponent_deck.id,
        is_win=True,
        game_mode="RANK",
        rank=10,
        won_coin_toss=True,
        is_going_first=True,
        played_date=datetime(2023, 1, 15, 12, 30, tzinfo=ZoneInfo("UTC")),
        notes="Test note",
    )
    duel_service.create_user_duel(db_session, user_id=test_user.id, duel_in=duel_in)

    # Act
    csv_output = duel_service.export_duels_to_csv(db_session, user_id=test_user.id)

    # Assert
    assert "使用デッキ" in csv_output
    assert "相手デッキ" in csv_output
    assert "My Test Deck" in csv_output
    assert "Opponent Test Deck" in csv_output
    assert "勝利" in csv_output
    assert "RANK" in csv_output
    assert "シルバー3" in csv_output
    assert "表" in csv_output
    assert "先攻" in csv_output
    assert "2023-01-15 12:30:00" in csv_output
    assert "Test note" in csv_output


def test_import_duels_from_csv_numeric_rank(db_session: Session, test_user: User):
    # Arrange
    csv_content = (
        "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
        "New Deck,New Opponent Deck,勝利,RANK,12,,,表,先攻,2023-03-15 10:00:00,Import test note\n"
        "New Deck,New Opponent Deck,勝利,RANK,12,,,表,先攻,2023-03-15 10:00:00,Import test note\n"
    )

    # Act
    result = duel_service.import_duels_from_csv(
        db_session, user_id=test_user.id, csv_content=csv_content
    )

    # Assert
    assert result["created"] == 1
    assert result["skipped"] == 1
    assert len(result["errors"]) == 0

    # Verify that the duel was created
    duels = duel_service.get_user_duels(
        db_session, user_id=test_user.id, year=2023, month=3
    )
    assert len(duels) == 1
    assert duels[0].notes == "Import test note"
    assert duels[0].rank == 12

    # Verify that the decks were created
    my_deck = deck_service.get_by_name(
        db_session, user_id=test_user.id, name="New Deck", is_opponent=False
    )
    opponent_deck = deck_service.get_by_name(
        db_session, user_id=test_user.id, name="New Opponent Deck", is_opponent=True
    )
    assert my_deck is not None
    assert opponent_deck is not None


def test_import_duels_from_csv_string_rank(db_session: Session, test_user: User):
    # Arrange
    csv_content = (
        "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
        "New Deck 2,New Opponent Deck 2,勝利,RANK,シルバー1,,,表,先攻,2023-04-15 10:00:00,Import test note 2\n"
    )

    # Act
    result = duel_service.import_duels_from_csv(
        db_session, user_id=test_user.id, csv_content=csv_content
    )

    # Assert
    assert result["created"] == 1
    assert len(result["errors"]) == 0

    # Verify that the duel was created
    duels = duel_service.get_user_duels(
        db_session, user_id=test_user.id, year=2023, month=4
    )
    assert len(duels) == 1
    assert duels[0].notes == "Import test note 2"
    assert duels[0].rank == 12

    # Verify that the decks were created
    my_deck = deck_service.get_by_name(
        db_session, user_id=test_user.id, name="New Deck 2", is_opponent=False
    )
    opponent_deck = deck_service.get_by_name(
        db_session, user_id=test_user.id, name="New Opponent Deck 2", is_opponent=True
    )
    assert my_deck is not None
    assert opponent_deck is not None
