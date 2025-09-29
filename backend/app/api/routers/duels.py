# app/api/routers/duels.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas, models
from app.schemas import duel
from app.services import duel_service
from app.auth import get_current_user
from app.db.session import get_db

router = APIRouter(prefix="/duels", tags=["duels"])

@router.post("/", response_model=duel.DuelRead)
def create_duel(
    duel: duel.DuelCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return duel_service.create_duel(db=db, user_id=current_user.id, duel=duel)

@router.get("/", response_model=List[duel.DuelRead])
def read_duels(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    duels = duel_service.get_duels(db=db, user_id=current_user.id)
    return duels

@router.get("/{duel_id}", response_model=duel.DuelRead)
def read_duel(
    duel_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_duel = duel_service.get_duel_by_id(db=db, duel_id=duel_id, user_id=current_user.id)
    if db_duel is None:
        raise HTTPException(status_code=404, detail="Duel not found")
    return db_duel

@router.put("/{duel_id}", response_model=duel.DuelRead)
def update_duel(
    duel_id: int,
    duel: duel.DuelUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_duel = duel_service.update_duel(db=db, duel_id=duel_id, user_id=current_user.id, duel_update=duel)
    if db_duel is None:
        raise HTTPException(status_code=404, detail="Duel not found")
    return db_duel

@router.delete("/{duel_id}", status_code=204)
def delete_duel(
    duel_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    success = duel_service.delete_duel(db=db, duel_id=duel_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Duel not found")
    return {"ok": True}
