"""
デッキサービスのテスト
"""

import pytest

from app.schemas.deck import DeckCreate, DeckUpdate
from app.services.deck_service import deck_service


class TestDeckService:
    """デッキサービスのテストクラス"""

    def test_create_deck(self, db_session, test_user):
        """デッキ作成のテスト"""
        deck_in = DeckCreate(name="Blue Eyes Deck", is_opponent=False)
        deck = deck_service.create_user_deck(
            db_session, user_id=test_user.id, deck_in=deck_in
        )

        assert deck.name == "Blue Eyes Deck"
        assert deck.user_id == test_user.id
        assert deck.is_opponent is False
        assert deck.id is not None

    def test_get_deck_by_id(self, db_session, test_user):
        """ID指定でデッキ取得のテスト"""
        # デッキを作成
        deck_in = DeckCreate(name="Red Eyes Deck", is_opponent=False)
        created_deck = deck_service.create_user_deck(
            db_session, user_id=test_user.id, deck_in=deck_in
        )

        # 取得
        deck = deck_service.get_by_id(db_session, created_deck.id, user_id=test_user.id)

        assert deck is not None
        assert deck.id == created_deck.id
        assert deck.name == "Red Eyes Deck"

    def test_get_all_user_decks(self, db_session, test_user):
        """ユーザーの全デッキ取得のテスト"""
        # 複数のデッキを作成
        deck1 = DeckCreate(name="Deck 1", is_opponent=False)
        deck2 = DeckCreate(name="Deck 2", is_opponent=False)

        deck_service.create_user_deck(db_session, user_id=test_user.id, deck_in=deck1)
        deck_service.create_user_deck(db_session, user_id=test_user.id, deck_in=deck2)

        # 取得
        decks = deck_service.get_user_decks(db_session, user_id=test_user.id)

        assert len(decks) == 2
        assert all(deck.user_id == test_user.id for deck in decks)

    def test_update_deck(self, db_session, test_user):
        """デッキ更新のテスト"""
        # デッキを作成
        deck_in = DeckCreate(name="Original Name", is_opponent=False)
        deck = deck_service.create_user_deck(
            db_session, user_id=test_user.id, deck_in=deck_in
        )

        # 更新
        deck_update = DeckUpdate(name="Updated Name")
        updated_deck = deck_service.update_user_deck(
            db_session, deck_id=deck.id, user_id=test_user.id, deck_in=deck_update
        )

        assert updated_deck is not None
        assert updated_deck.name == "Updated Name"
        assert updated_deck.id == deck.id

    def test_delete_deck(self, db_session, test_user):
        """デッキ削除のテスト"""
        # デッキを作成
        deck_in = DeckCreate(name="To Be Deleted", is_opponent=False)
        deck = deck_service.create_user_deck(
            db_session, user_id=test_user.id, deck_in=deck_in
        )

        # 削除
        success = deck_service.delete(db_session, deck.id, user_id=test_user.id)

        assert success is True

        # 削除されたことを確認（論理削除のため取得不可）
        deleted_deck = deck_service.get_by_id(db_session, deck.id, user_id=test_user.id)
        assert deleted_deck is None

        # DB上には非アクティブとして残っていることを確認
        stored_deck = deck_service.get_by_id(
            db_session, deck.id, user_id=test_user.id, include_inactive=True
        )
        assert stored_deck is not None
        assert stored_deck.active is False

    def test_get_user_decks_filtered_by_opponent(self, db_session, test_user):
        """対戦相手フラグでフィルタリングのテスト"""
        # 自分のデッキと対戦相手のデッキを作成
        my_deck = DeckCreate(name="My Deck", is_opponent=False)
        opponent_deck = DeckCreate(name="Opponent Deck", is_opponent=True)

        deck_service.create_user_deck(db_session, user_id=test_user.id, deck_in=my_deck)
        deck_service.create_user_deck(
            db_session, user_id=test_user.id, deck_in=opponent_deck
        )

        # 対戦相手のデッキのみ取得
        opponent_decks = deck_service.get_user_decks(
            db_session, user_id=test_user.id, is_opponent=True
        )

        assert len(opponent_decks) == 1
        assert opponent_decks[0].is_opponent is True
        assert opponent_decks[0].name == "Opponent Deck"

    def test_create_duplicate_deck(self, db_session, test_user):
        """重複したデッキ名の作成テスト"""
        # 1つ目のデッキを作成
        deck_in1 = DeckCreate(name="Duplicate Deck", is_opponent=False)
        deck_service.create_user_deck(
            db_session, user_id=test_user.id, deck_in=deck_in1
        )

        # 同じ名前のデッキを作成しようとする
        deck_in2 = DeckCreate(name="Duplicate Deck", is_opponent=False)

        with pytest.raises(ValueError, match="同じ名前の"):
            deck_service.create_user_deck(
                db_session, user_id=test_user.id, deck_in=deck_in2
            )

    def test_update_to_duplicate_name(self, db_session, test_user):
        """既存のデッキ名への更新テスト"""
        # 2つのデッキを作成
        deck1 = DeckCreate(name="Deck One", is_opponent=False)
        deck2 = DeckCreate(name="Deck Two", is_opponent=False)

        deck_service.create_user_deck(db_session, user_id=test_user.id, deck_in=deck1)
        created_deck2 = deck_service.create_user_deck(
            db_session, user_id=test_user.id, deck_in=deck2
        )

        # Deck2を Deck1 と同じ名前に更新しようとする
        deck_update = DeckUpdate(name="Deck One")

        with pytest.raises(ValueError, match="同じ名前の"):
            deck_service.update_user_deck(
                db_session,
                deck_id=created_deck2.id,
                user_id=test_user.id,
                deck_in=deck_update,
            )

    def test_create_deck_with_same_name_after_delete(self, db_session, test_user):
        """論理削除後に同名デッキを再作成できることを確認"""
        deck_in = DeckCreate(name="Reusable Deck", is_opponent=False)
        original_deck = deck_service.create_user_deck(
            db_session, user_id=test_user.id, deck_in=deck_in
        )

        # 論理削除
        delete_result = deck_service.delete(
            db_session, original_deck.id, user_id=test_user.id
        )
        assert delete_result

        # 同名デッキを再作成
        recreated_deck = deck_service.create_user_deck(
            db_session, user_id=test_user.id, deck_in=deck_in
        )

        assert recreated_deck.id != original_deck.id
        assert recreated_deck.active is True
