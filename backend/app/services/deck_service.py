from sqlalchemy.orm import Session
from app import models, schemas

def get_decks(db: Session, user_id: int):
    return db.query(models.Deck).filter(models.Deck.user_id == user_id).all()

def create_deck(db: Session, user_id: int, deck: schemas.DeckCreate):
    db_deck = models.Deck(user_id=user_id, **deck.dict())
    db.add(db_deck)
    db.commit()
    db.refresh(db_deck)
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