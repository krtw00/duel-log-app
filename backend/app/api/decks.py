# app/api/decks.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas
from app.services import deck_service
from app.db.session import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/decks", tags=["decks"])

@router.get("/", response_model=list[schemas.DeckRead])
def list_decks(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return deck_service.get_decks(db, user.id)

@router.post("/", response_model=schemas.DeckRead)
def create_deck(deck: schemas.DeckCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return deck_service.create_deck(db, user.id, deck)


@router.put("/{deck_id}", response_model=schemas.DeckRead)
def update_deck(deck_id: int, deck: schemas.DeckUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    updated = deck_service.update_deck(db, user.id, deck_id, deck)
    if not updated:
        raise HTTPException(status_code=404, detail="Deck not found")
    return updated

@router.delete("/{deck_id}")
def delete_deck(deck_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    success = deck_service.delete_deck(db, user.id, deck_id)
    if not success:
        raise HTTPException(status_code=404, detail="Deck not found")
    return {"message": "Deck deleted successfully"}