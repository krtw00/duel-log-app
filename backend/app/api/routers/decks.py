"""
デッキエンドポイント
デッキのCRUD操作を提供
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.deck import DeckRead, DeckCreate, DeckUpdate
from app.services.deck_service import deck_service
from app.db.session import get_db
from app.auth import get_current_user


router = APIRouter(prefix="/decks", tags=["decks"])


@router.get("/", response_model=List[DeckRead])
def list_decks(
    is_opponent: Optional[bool] = Query(None, description="対戦相手のデッキのみ取得"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ログインユーザーのデッキ一覧を取得
    
    Args:
        is_opponent: 対戦相手のデッキかどうか（省略時は全て取得）
        db: データベースセッション
        current_user: 現在のユーザー
    
    Returns:
        デッキのリスト
    """
    return deck_service.get_user_decks(
        db=db, 
        user_id=current_user.id,
        is_opponent=is_opponent
    )


@router.post("/", response_model=DeckRead, status_code=status.HTTP_201_CREATED)
def create_deck(
    deck: DeckCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    新しいデッキを作成
    
    Args:
        deck: デッキ作成スキーマ
        db: データベースセッション
        current_user: 現在のユーザー
    
    Returns:
        作成されたデッキ
    """
    return deck_service.create_user_deck(
        db=db,
        user_id=current_user.id,
        deck_in=deck
    )


@router.get("/{deck_id}", response_model=DeckRead)
def get_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    IDでデッキを取得
    
    Args:
        deck_id: デッキID
        db: データベースセッション
        current_user: 現在のユーザー
    
    Returns:
        デッキ
    
    Raises:
        HTTPException: デッキが見つからない場合
    """
    deck = deck_service.get_by_id(
        db=db,
        id=deck_id,
        user_id=current_user.id
    )
    
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="デッキが見つかりません"
        )
    
    return deck


@router.put("/{deck_id}", response_model=DeckRead)
def update_deck(
    deck_id: int,
    deck: DeckUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    デッキを更新
    
    Args:
        deck_id: デッキID
        deck: デッキ更新スキーマ
        db: データベースセッション
        current_user: 現在のユーザー
    
    Returns:
        更新されたデッキ
    
    Raises:
        HTTPException: デッキが見つからない場合
    """
    updated_deck = deck_service.update(
        db=db,
        id=deck_id,
        obj_in=deck,
        user_id=current_user.id
    )
    
    if not updated_deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="デッキが見つかりません"
        )
    
    return updated_deck


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    デッキを削除
    
    Args:
        deck_id: デッキID
        db: データベースセッション
        current_user: 現在のユーザー
    
    Raises:
        HTTPException: デッキが見つからない場合
    """
    success = deck_service.delete(
        db=db,
        id=deck_id,
        user_id=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="デッキが見つかりません"
        )
