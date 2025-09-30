"""
デッキサービスのテスト
"""
import pytest
from app.services.deck_service import deck_service
from app.schemas.deck import DeckCreate, DeckUpdate
from app.models.deck import Deck


class TestDeckService:
    """デッキサービスのテストクラス"""
    
    def test_create_deck(self, db_session, test_user):
        """デッキ作成のテスト"""
        deck_in = DeckCreate(name="Blue Eyes Deck", is_opponent=False)
        deck = deck_service.create(db_session, deck_in, user_id=test_user.id)
        
        assert deck.name == "Blue Eyes Deck"
        assert deck.user_id == test_user.id
        assert deck.is_opponent == False
        assert deck.id is not None
    
    def test_get_deck_by_id(self, db_session, test_user):
        """ID指定でデッキ取得のテスト"""
        # デッキを作成
        deck_in = DeckCreate(name="Red Eyes Deck", is_opponent=False)
        created_deck = deck_service.create(db_session, deck_in, user_id=test_user.id)
        
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
        
        deck_service.create(db_session, deck1, user_id=test_user.id)
        deck_service.create(db_session, deck2, user_id=test_user.id)
        
        # 取得
        decks = deck_service.get_all(db_session, user_id=test_user.id)
        
        assert len(decks) == 2
        assert all(deck.user_id == test_user.id for deck in decks)
    
    def test_update_deck(self, db_session, test_user):
        """デッキ更新のテスト"""
        # デッキを作成
        deck_in = DeckCreate(name="Original Name", is_opponent=False)
        deck = deck_service.create(db_session, deck_in, user_id=test_user.id)
        
        # 更新
        deck_update = DeckUpdate(name="Updated Name")
        updated_deck = deck_service.update(
            db_session, 
            deck.id, 
            deck_update, 
            user_id=test_user.id
        )
        
        assert updated_deck is not None
        assert updated_deck.name == "Updated Name"
        assert updated_deck.id == deck.id
    
    def test_delete_deck(self, db_session, test_user):
        """デッキ削除のテスト"""
        # デッキを作成
        deck_in = DeckCreate(name="To Be Deleted", is_opponent=False)
        deck = deck_service.create(db_session, deck_in, user_id=test_user.id)
        
        # 削除
        success = deck_service.delete(db_session, deck.id, user_id=test_user.id)
        
        assert success == True
        
        # 削除されたことを確認
        deleted_deck = deck_service.get_by_id(db_session, deck.id, user_id=test_user.id)
        assert deleted_deck is None
    
    def test_get_user_decks_filtered_by_opponent(self, db_session, test_user):
        """対戦相手フラグでフィルタリングのテスト"""
        # 自分のデッキと対戦相手のデッキを作成
        my_deck = DeckCreate(name="My Deck", is_opponent=False)
        opponent_deck = DeckCreate(name="Opponent Deck", is_opponent=True)
        
        deck_service.create(db_session, my_deck, user_id=test_user.id)
        deck_service.create(db_session, opponent_deck, user_id=test_user.id)
        
        # 対戦相手のデッキのみ取得
        opponent_decks = deck_service.get_user_decks(
            db_session, 
            user_id=test_user.id, 
            is_opponent=True
        )
        
        assert len(opponent_decks) == 1
        assert opponent_decks[0].is_opponent == True
        assert opponent_decks[0].name == "Opponent Deck"
