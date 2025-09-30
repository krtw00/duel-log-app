"""
デッキサービス
デッキに関するビジネスロジックを提供
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.deck import Deck
from app.schemas.deck import DeckCreate, DeckUpdate
from app.services.base import BaseService


class DeckService(BaseService[Deck, DeckCreate, DeckUpdate]):
    """デッキサービスクラス"""
    
    def __init__(self):
        super().__init__(Deck)
    
    def get_user_decks(
        self, 
        db: Session, 
        user_id: int,
        is_opponent: Optional[bool] = None
    ) -> List[Deck]:
        """
        ユーザーのデッキを取得
        
        Args:
            db: データベースセッション
            user_id: ユーザーID
            is_opponent: 対戦相手のデッキかどうか（Noneの場合は全て取得）
        
        Returns:
            デッキのリスト
        """
        query = db.query(Deck).filter(Deck.user_id == user_id)
        
        if is_opponent is not None:
            query = query.filter(Deck.is_opponent == is_opponent)
        
        return query.all()
    
    def create_user_deck(
        self,
        db: Session,
        user_id: int,
        deck_in: DeckCreate
    ) -> Deck:
        """
        ユーザーのデッキを作成
        
        Args:
            db: データベースセッション
            user_id: ユーザーID
            deck_in: デッキ作成スキーマ
        
        Returns:
            作成されたデッキ
        """
        # DeckCreateにuser_idが含まれている場合は除外
        deck_data = deck_in.model_dump(exclude={"user_id"})
        deck_obj = DeckCreate(**deck_data)
        
        return self.create(db, deck_obj, user_id=user_id)


# シングルトンインスタンス
deck_service = DeckService()
