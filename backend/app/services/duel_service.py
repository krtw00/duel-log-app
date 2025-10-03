"""
デュエルサービス
デュエルに関するビジネスロジックを提供
"""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import extract as sa_extract # sa.extract を使用するためにインポート

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
        end_date: Optional[datetime] = None,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> List[Duel]:
        """
        ユーザーのデュエルを取得（フィルタリング可能）
        
        Args:
            db: データベースセッション
            user_id: ユーザーID
            deck_id: デッキID（指定した場合、そのデッキのデュエルのみ）
            start_date: 開始日（指定した場合、この日以降のデュエル）
            end_date: 終了日（指定した場合、この日以前のデュエル）
            year: 年（指定した場合、その年のデュエル）
            month: 月（指定した場合、その月のデュエル）
        
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
        
        if year is not None:
            query = query.filter(sa_extract('year', Duel.played_date) == year)
        if month is not None:
            query = query.filter(sa_extract('month', Duel.played_date) == month)
        
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

    def get_latest_duel_values(self, db: Session, user_id: int) -> dict:
        """
        ユーザーの各ゲームモードにおける最新のランク、レート、DC値を取得
        """
        latest_values = {}

        # 最新のランク値を取得
        latest_rank_duel = (
            db.query(Duel)
            .filter(Duel.user_id == user_id, Duel.game_mode == 'RANK', Duel.rank.isnot(None))
            .order_by(Duel.played_date.desc())
            .first()
        )
        if latest_rank_duel:
            latest_values['RANK'] = latest_rank_duel.rank

        # 最新のレート値を取得
        latest_rate_duel = (
            db.query(Duel)
            .filter(Duel.user_id == user_id, Duel.game_mode == 'RATE', Duel.rate_value.isnot(None))
            .order_by(Duel.played_date.desc())
            .first()
        )
        if latest_rate_duel:
            latest_values['RATE'] = latest_rate_duel.rate_value

        # 最新のDC値を取得
        latest_dc_duel = (
            db.query(Duel)
            .filter(Duel.user_id == user_id, Duel.game_mode == 'DC', Duel.dc_value.isnot(None))
            .order_by(Duel.played_date.desc())
            .first()
        )
        if latest_dc_duel:
            latest_values['DC'] = latest_dc_duel.dc_value
            
        return latest_values


# シングルトンインスタンス
duel_service = DuelService()
