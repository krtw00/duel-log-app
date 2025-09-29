from sqlalchemy.orm import Session
from fastapi import HTTPException
from app import models, schemas
from app.schemas import duel
from typing import List, Optional

def get_duels(db: Session, user_id: int) -> List[models.Duel]:
    """ユーザーIDに関連するすべてのデュエルを取得"""
    return db.query(models.Duel).filter(models.Duel.user_id == user_id).all()

def create_duel(db: Session, user_id: int, duel: duel.DuelCreate) -> models.Duel:
    """新しいデュエルを作成"""
    db_duel = models.Duel(**duel.model_dump(), user_id=user_id)
    db.add(db_duel)
    db.commit()
    db.refresh(db_duel)
    return db_duel

def get_duel_by_id(db: Session, duel_id: int, user_id: int) -> Optional[models.Duel]:
    """IDで単一のデュエルを取得"""
    return db.query(models.Duel).filter(models.Duel.id == duel_id, models.Duel.user_id == user_id).first()

def update_duel(db: Session, duel_id: int, user_id: int, duel_update: duel.DuelUpdate) -> Optional[models.Duel]:
    """デュエルを更新"""
    db_duel = get_duel_by_id(db, duel_id, user_id)
    if not db_duel:
        return None

    update_data = duel_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_duel, key, value)

    db.commit()
    db.refresh(db_duel)
    return db_duel

def delete_duel(db: Session, duel_id: int, user_id: int) -> bool:
    """デュエルを削除"""
    db_duel = get_duel_by_id(db, duel_id, user_id)
    if not db_duel:
        return False
    
    db.delete(db_duel)
    db.commit()
    return True
