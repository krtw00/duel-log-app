"""
デュエルサービス
デュエルに関するビジネスロジックを提供
"""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.duel import Duel
from app.schemas.duel import DuelCreate, DuelUpdate
from app.services.base import BaseService


class DuelService(BaseService[Duel, DuelCreate, DuelUpdate]):
    """デュエルサービスクラス"""
    
    def __init__(self):
        super().__init__(Duel)
    
    def get_user_duels(
        self, 
        db: Session, 
        user_id: int,
        deck_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Duel]:
        """
        ユーザーのデュエルを取得（フィルタリング可能）
        
        Args:
            db: データベースセッション
            user_id: ユーザーID
            deck_id: デッキID（指定した場合、そのデッキのデュエルのみ）
            start_date: 開始日（指定した場合、この日以降のデュエル）
            end_date: 終了日（指定した場合、この日以前のデュエル）
        
        Returns:
            デュエルのリスト
        """
        query = db.query(Duel).filter(Duel.user_id == user_id)
        
        if deck_id is not None:
            query = query.filter(Duel.deck_id == deck_id)
        
        if start_date is not None:
            query = query.filter(Duel.played_date >= start_date)
        
        if end_date is not None:
            query = query.filter(Duel.played_date <= end_date)
        
        return query.order_by(Duel.played_date.desc()).all()
    
    def create_user_duel(
        self,
        db: Session,
        user_id: int,
        duel_in: DuelCreate
    ) -> Duel:
        """
        ユーザーのデュエルを作成
        
        Args:
            db: データベースセッション
            user_id: ユーザーID
            duel_in: デュエル作成スキーマ
        
        Returns:
            作成されたデュエル
        """
        return self.create(db, duel_in, user_id=user_id)
    
    def get_win_rate(
        self,
        db: Session,
        user_id: int,
        deck_id: Optional[int] = None
    ) -> float:
        """
        勝率を計算
        
        Args:
            db: データベースセッション
            user_id: ユーザーID
            deck_id: デッキID（指定した場合、そのデッキの勝率）
        
        Returns:
            勝率（0.0〜1.0）、デュエルがない場合は0.0
        """
        query = db.query(Duel).filter(Duel.user_id == user_id)
        
        if deck_id is not None:
            query = query.filter(Duel.deck_id == deck_id)
        
        total_duels = query.count()
        
        if total_duels == 0:
            return 0.0
        
        wins = query.filter(Duel.result == True).count()
        
        return wins / total_duels


# シングルトンインスタンス
duel_service = DuelService()
