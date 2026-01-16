from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import pytest
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.duel import DuelCreate
from app.services.deck_service import deck_service
from app.services.duel_service import duel_service


def test_create_user_duel(db_session: Session, test_user: User):
    # Arrange
    my_deck = deck_service.get_or_create(
        db_session,
        user_id=test_user.id,
        name="My Test Deck",
        is_opponent=False,
    )
    opponent_deck = deck_service.get_or_create(
        db_session,
        user_id=test_user.id,
        name="Opponent Test Deck",
        is_opponent=True,
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
        played_date=datetime.now(timezone.utc),
    )

    # Act
    created_duel = duel_service.create_user_duel(
        db_session,
        user_id=test_user.id,
        duel_in=duel_in,
    )

    # Assert
    assert created_duel is not None
    assert created_duel.user_id == test_user.id
    assert created_duel.deck_id == my_deck.id
    assert created_duel.opponent_deck_id == opponent_deck.id
    assert created_duel.is_win is True
    assert created_duel.game_mode == "RANK"
    assert created_duel.rank == 10


def test_create_user_duel_rejects_other_users_decks(
    db_session: Session,
    test_user: User,
):
    other_user = User(
        username="otheruser",
        email="other@example.com",
        passwordhash="dummy",
    )
    db_session.add(other_user)
    db_session.commit()
    db_session.refresh(other_user)

    my_deck = deck_service.get_or_create(
        db_session,
        user_id=test_user.id,
        name="My Test Deck",
        is_opponent=False,
    )
    other_users_opponent_deck = deck_service.get_or_create(
        db_session,
        user_id=other_user.id,
        name="Other Opponent Deck",
        is_opponent=True,
    )
    db_session.commit()

    duel_in = DuelCreate(
        deck_id=my_deck.id,
        opponent_deck_id=other_users_opponent_deck.id,
        is_win=True,
        game_mode="RANK",
        rank=10,
        won_coin_toss=True,
        is_going_first=True,
        played_date=datetime.now(timezone.utc),
    )

    with pytest.raises(ValueError, match="相手デッキ"):
        duel_service.create_user_duel(
            db_session,
            user_id=test_user.id,
            duel_in=duel_in,
        )


def test_get_user_duels(db_session: Session, test_user: User):
    # Arrange
    my_deck = deck_service.get_or_create(
        db_session,
        user_id=test_user.id,
        name="My Test Deck",
        is_opponent=False,
    )
    opponent_deck = deck_service.get_or_create(
        db_session,
        user_id=test_user.id,
        name="Opponent Test Deck",
        is_opponent=True,
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
        db_session,
        user_id=test_user.id,
        year=2023,
        month=1,
    )
    rank_duels = duel_service.get_user_duels(
        db_session,
        user_id=test_user.id,
        game_mode="RANK",
    )
    ranged_duels = duel_service.get_user_duels(
        db_session,
        user_id=test_user.id,
        range_start=2,
    )

    # Assert
    assert len(all_duels) == 2
    assert len(jan_duels) == 1
    assert jan_duels[0].game_mode == "RANK"
    assert len(rank_duels) == 1
    assert rank_duels[0].game_mode == "RANK"
    assert len(ranged_duels) == 1
    # SQLiteではタイムゾーン情報が保持されないため、日付のみを比較
    assert ranged_duels[0].played_date.replace(tzinfo=ZoneInfo("UTC")) == datetime(
        2023,
        1,
        15,
        tzinfo=ZoneInfo("UTC"),
    )


def test_export_duels_to_csv(db_session: Session, test_user: User):
    # Arrange
    my_deck = deck_service.get_or_create(
        db_session,
        user_id=test_user.id,
        name="My Test Deck",
        is_opponent=False,
    )
    opponent_deck = deck_service.get_or_create(
        db_session,
        user_id=test_user.id,
        name="Opponent Test Deck",
        is_opponent=True,
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
    duel_service.create_user_duel(
        db_session,
        user_id=test_user.id,
        duel_in=duel_in,
    )

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
        db_session,
        user_id=test_user.id,
        csv_content=csv_content,
    )

    # Assert
    assert result["created"] == 1
    assert result["skipped"] == 1
    assert len(result["errors"]) == 0

    # Verify that the duel was created
    duels = duel_service.get_user_duels(
        db_session,
        user_id=test_user.id,
        year=2023,
        month=3,
    )
    assert len(duels) == 1
    assert duels[0].notes == "Import test note"
    assert duels[0].rank == 12

    # Verify that the decks were created
    my_deck = deck_service.get_by_name(
        db_session,
        user_id=test_user.id,
        name="New Deck",
        is_opponent=False,
    )
    opponent_deck = deck_service.get_by_name(
        db_session,
        user_id=test_user.id,
        name="New Opponent Deck",
        is_opponent=True,
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
        db_session,
        user_id=test_user.id,
        csv_content=csv_content,
    )

    # Assert
    assert result["created"] == 1
    assert len(result["errors"]) == 0

    # Verify that the duel was created
    duels = duel_service.get_user_duels(
        db_session,
        user_id=test_user.id,
        year=2023,
        month=4,
    )
    assert len(duels) == 1
    assert duels[0].notes == "Import test note 2"
    assert duels[0].rank == 12

    # Verify that the decks were created
    my_deck = deck_service.get_by_name(
        db_session,
        user_id=test_user.id,
        name="New Deck 2",
        is_opponent=False,
    )
    opponent_deck = deck_service.get_by_name(
        db_session,
        user_id=test_user.id,
        name="New Opponent Deck 2",
        is_opponent=True,
    )
    assert my_deck is not None
    assert opponent_deck is not None


def test_get_latest_duel_values(db_session: Session, test_user: User):
    """各ゲームモード（RANK、RATE、DC、EVENT）の最新値取得をテスト"""
    # Arrange - デッキを作成
    my_deck1 = deck_service.get_or_create(
        db_session,
        user_id=test_user.id,
        name="My Deck 1",
        is_opponent=False,
    )
    my_deck2 = deck_service.get_or_create(
        db_session,
        user_id=test_user.id,
        name="My Deck 2",
        is_opponent=False,
    )
    opponent_deck1 = deck_service.get_or_create(
        db_session,
        user_id=test_user.id,
        name="Opponent Deck 1",
        is_opponent=True,
    )
    opponent_deck2 = deck_service.get_or_create(
        db_session,
        user_id=test_user.id,
        name="Opponent Deck 2",
        is_opponent=True,
    )
    db_session.commit()

    # RANKモードのDuelを作成（最新ランク: 15）
    duel_rank_old = DuelCreate(
        deck_id=my_deck1.id,
        opponent_deck_id=opponent_deck1.id,
        is_win=True,
        game_mode="RANK",
        rank=10,
        played_date=datetime(2023, 1, 1, tzinfo=ZoneInfo("UTC")),
        won_coin_toss=True,
        is_going_first=True,
    )
    duel_service.create_user_duel(
        db_session,
        user_id=test_user.id,
        duel_in=duel_rank_old,
    )

    duel_rank_latest = DuelCreate(
        deck_id=my_deck2.id,
        opponent_deck_id=opponent_deck2.id,
        is_win=True,
        game_mode="RANK",
        rank=15,
        played_date=datetime(2023, 2, 1, tzinfo=ZoneInfo("UTC")),
        won_coin_toss=True,
        is_going_first=True,
    )
    duel_service.create_user_duel(
        db_session,
        user_id=test_user.id,
        duel_in=duel_rank_latest,
    )

    # RATEモードのDuelを作成（最新レート: 1700）
    duel_rate = DuelCreate(
        deck_id=my_deck1.id,
        opponent_deck_id=opponent_deck1.id,
        is_win=False,
        game_mode="RATE",
        rate_value=1700.0,
        played_date=datetime(2023, 3, 1, tzinfo=ZoneInfo("UTC")),
        won_coin_toss=False,
        is_going_first=False,
    )
    duel_service.create_user_duel(
        db_session,
        user_id=test_user.id,
        duel_in=duel_rate,
    )

    # DCモードのDuelを作成（最新DC: 5000）
    duel_dc = DuelCreate(
        deck_id=my_deck2.id,
        opponent_deck_id=opponent_deck2.id,
        is_win=True,
        game_mode="DC",
        dc_value=5000.0,
        played_date=datetime(2023, 4, 1, tzinfo=ZoneInfo("UTC")),
        won_coin_toss=True,
        is_going_first=True,
    )
    duel_service.create_user_duel(
        db_session,
        user_id=test_user.id,
        duel_in=duel_dc,
    )

    # EVENTモードのDuelを作成（値なし、デッキ情報のみ）
    duel_event_old = DuelCreate(
        deck_id=my_deck1.id,
        opponent_deck_id=opponent_deck1.id,
        is_win=True,
        game_mode="EVENT",
        played_date=datetime(2023, 5, 1, tzinfo=ZoneInfo("UTC")),
        won_coin_toss=True,
        is_going_first=True,
    )
    duel_service.create_user_duel(
        db_session,
        user_id=test_user.id,
        duel_in=duel_event_old,
    )

    duel_event_latest = DuelCreate(
        deck_id=my_deck2.id,
        opponent_deck_id=opponent_deck2.id,
        is_win=False,
        game_mode="EVENT",
        played_date=datetime(2023, 6, 1, tzinfo=ZoneInfo("UTC")),
        won_coin_toss=False,
        is_going_first=False,
    )
    duel_service.create_user_duel(
        db_session,
        user_id=test_user.id,
        duel_in=duel_event_latest,
    )

    # Act
    latest_values = duel_service.get_latest_duel_values(
        db_session,
        user_id=test_user.id,
    )

    # Assert
    # RANKモードの最新値
    assert "RANK" in latest_values
    assert latest_values["RANK"]["value"] == 15
    assert latest_values["RANK"]["deck_id"] == my_deck2.id
    assert latest_values["RANK"]["opponent_deck_id"] == opponent_deck2.id

    # RATEモードの最新値
    assert "RATE" in latest_values
    assert latest_values["RATE"]["value"] == 1700.0
    assert latest_values["RATE"]["deck_id"] == my_deck1.id
    assert latest_values["RATE"]["opponent_deck_id"] == opponent_deck1.id

    # DCモードの最新値
    assert "DC" in latest_values
    assert latest_values["DC"]["value"] == 5000.0
    assert latest_values["DC"]["deck_id"] == my_deck2.id
    assert latest_values["DC"]["opponent_deck_id"] == opponent_deck2.id

    # EVENTモードの最新デッキ情報
    assert "EVENT" in latest_values
    assert latest_values["EVENT"]["value"] == 0  # ダミー値
    assert latest_values["EVENT"]["deck_id"] == my_deck2.id
    assert latest_values["EVENT"]["opponent_deck_id"] == opponent_deck2.id
