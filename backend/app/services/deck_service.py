from sqlalchemy.orm import Session
from fastapi import HTTPException
from app import models, schemas
from app.models import User
import logging

logger = logging.getLogger(__name__)

def get_decks(db: Session, user_id: int):
    return db.query(models.Deck).filter(models.Deck.user_id == user_id).all()

def create_deck(db: Session, user_id: int, deck: schemas.DeckCreate):
    logger.info(f"DEBUG: create_deck called with user_id={user_id}")
    
    # 🔍 DeckCreateの中身を確認
    logger.info(f"DEBUG: deck.model_dump() = {deck.model_dump()}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db_deck = models.Deck(user_id=user_id, **deck.model_dump(exclude={"user_id"}))
    db.add(db_deck)
    db.commit()
    db.refresh(db_deck)

    # 🔍 登録されたDeckオブジェクトの中身も確認
    logger.info(f"DEBUG: db_deck contents = {db_deck.__dict__}")

    return db_deck

def update_deck(db: Session, user_id: int, deck_id: int, deck: schemas.DeckUpdate):
    db_deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.user_id == user_id
    ).first()
    if not db_deck:
        return None
    if deck.name is not None:
        db_deck.name = deck.name
    db.commit()
    db.refresh(db_deck)
    return db_deck

def delete_deck(db: Session, user_id: int, deck_id: int):
    db_deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.user_id == user_id
    ).first()
    if not db_deck:
        return False
    db.delete(db_deck)
    db.commit()
    return True