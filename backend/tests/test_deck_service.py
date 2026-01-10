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

    def test_delete_deck_merges_with_existing_archive(
        self, db_session, test_user, sample_duel_data
    ):
        """同名のアーカイブ済みデッキと統合されることを確認"""
        from app.models.deck import Deck
        from app.models.duel import Duel

        # 1. 既にアーカイブ済みのデッキを作成
        deck_in = DeckCreate(name="Blue Eyes", is_opponent=False, active=True)
        archived_deck = deck_service.create_user_deck(
            db=db_session, user_id=test_user.id, deck_in=deck_in
        )
        archived_deck.active = False
        db_session.commit()

        archived_deck_id = archived_deck.id

        # 2. 同名のアクティブなデッキを作成
        active_deck = deck_service.create_user_deck(
            db=db_session, user_id=test_user.id, deck_in=deck_in, commit=False
        )
        # 名前の重複エラーを回避するため、一時的に別名で作成してから変更
        active_deck.name = "Blue Eyes Temp"
        db_session.commit()
        active_deck.name = "Blue Eyes"
        db_session.commit()

        active_deck_id = active_deck.id

        # 3. アクティブなデッキに対戦履歴を紐付け
        duel = Duel(
            user_id=test_user.id,
            deck_id=active_deck_id,
            opponent_deck_id=archived_deck_id,
            is_win=True,
            won_coin_toss=True,
            is_going_first=True,
            game_mode="RANK",
            rank=10,
            played_date=sample_duel_data["played_date"],
        )
        db_session.add(duel)
        db_session.commit()

        duel_id = duel.id

        # 4. アクティブなデッキをアーカイブ（削除）
        result = deck_service.delete(
            db=db_session, id=active_deck_id, user_id=test_user.id
        )

        # 5. 検証
        assert result is True

        # アクティブなデッキは物理削除されている
        deleted_deck = db_session.query(Deck).filter(Deck.id == active_deck_id).first()
        assert deleted_deck is None

        # アーカイブ済みデッキは残っている
        remaining_deck = (
            db_session.query(Deck).filter(Deck.id == archived_deck_id).first()
        )
        assert remaining_deck is not None
        assert remaining_deck.active is False
        assert remaining_deck.name == "Blue Eyes"

        # 対戦履歴がアーカイブ済みデッキに移行されている
        migrated_duel = db_session.query(Duel).filter(Duel.id == duel_id).first()
        assert migrated_duel is not None
        assert migrated_duel.deck_id == archived_deck_id

    def test_delete_deck_without_existing_archive(self, db_session, test_user):
        """アーカイブ済みデッキが存在しない場合、通常の論理削除が行われることを確認"""
        from app.models.deck import Deck

        # アクティブなデッキを作成
        deck_in = DeckCreate(name="Dark Magician", is_opponent=False)
        active_deck = deck_service.create_user_deck(
            db=db_session, user_id=test_user.id, deck_in=deck_in
        )

        active_deck_id = active_deck.id

        # デッキをアーカイブ（削除）
        result = deck_service.delete(
            db=db_session, id=active_deck_id, user_id=test_user.id
        )

        # 検証
        assert result is True

        # デッキは論理削除され、データベース上に残っている
        archived_deck = db_session.query(Deck).filter(Deck.id == active_deck_id).first()
        assert archived_deck is not None
        assert archived_deck.active is False
        assert archived_deck.name == "Dark Magician"

    def test_delete_deck_merges_opponent_deck_references(
        self, db_session, test_user, sample_duel_data
    ):
        """相手デッキとしての参照も正しく移行されることを確認"""
        from app.models.deck import Deck
        from app.models.duel import Duel

        # 1. アーカイブ済みの相手デッキを作成
        opponent_deck_in = DeckCreate(name="Opponent Blue Eyes", is_opponent=True)
        archived_opponent = deck_service.create_user_deck(
            db=db_session, user_id=test_user.id, deck_in=opponent_deck_in
        )
        archived_opponent.active = False
        db_session.commit()

        archived_opponent_id = archived_opponent.id

        # 2. アクティブな相手デッキを作成
        active_opponent = deck_service.create_user_deck(
            db=db_session, user_id=test_user.id, deck_in=opponent_deck_in, commit=False
        )
        active_opponent.name = "Opponent Blue Eyes Temp"
        db_session.commit()
        active_opponent.name = "Opponent Blue Eyes"
        db_session.commit()

        active_opponent_id = active_opponent.id

        # 3. プレイヤーデッキを作成
        player_deck_in = DeckCreate(name="My Deck", is_opponent=False)
        player_deck = deck_service.create_user_deck(
            db=db_session, user_id=test_user.id, deck_in=player_deck_in
        )

        # 4. アクティブな相手デッキを対戦相手として使用する対戦履歴を作成
        duel = Duel(
            user_id=test_user.id,
            deck_id=player_deck.id,
            opponent_deck_id=active_opponent_id,
            is_win=True,
            won_coin_toss=True,
            is_going_first=True,
            game_mode="RANK",
            rank=10,
            played_date=sample_duel_data["played_date"],
        )
        db_session.add(duel)
        db_session.commit()

        duel_id = duel.id

        # 5. アクティブな相手デッキをアーカイブ
        result = deck_service.delete(
            db=db_session, id=active_opponent_id, user_id=test_user.id
        )

        # 6. 検証
        assert result is True

        # アクティブな相手デッキは物理削除されている
        deleted_opponent = (
            db_session.query(Deck).filter(Deck.id == active_opponent_id).first()
        )
        assert deleted_opponent is None

        # 対戦履歴の相手デッキIDが移行されている
        migrated_duel = db_session.query(Duel).filter(Duel.id == duel_id).first()
        assert migrated_duel is not None
        assert migrated_duel.opponent_deck_id == archived_opponent_id
