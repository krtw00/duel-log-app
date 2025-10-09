"""
デッキエンドポイント
デッキのCRUD操作を提供
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.deck import DeckCreate, DeckRead, DeckUpdate
from app.services.deck_service import deck_service

router = APIRouter(prefix="/decks", tags=["decks"])


@router.get("/", response_model=List[DeckRead])
def list_decks(
    is_opponent: Optional[bool] = Query(None, description="対戦相手のデッキのみ取得"),
    active_only: bool = Query(True, description="アクティブなデッキのみ取得"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    ログインユーザーのデッキ一覧を取得

    Args:
        is_opponent: 対戦相手のデッキかどうか（省略時は全て取得）
        active_only: アクティブなデッキのみ取得するか
        db: データベースセッション
        current_user: 現在のユーザー

    Returns:
        デッキのリスト
    """
    return deck_service.get_user_decks(
        db=db, user_id=current_user.id, is_opponent=is_opponent, active_only=active_only
    )


@router.post("/", response_model=DeckRead, status_code=status.HTTP_201_CREATED)
def create_deck(
    deck: DeckCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    新しいデッキを作成

    Args:
        deck: デッキ作成スキーマ
        db: データベースセッション
        current_user: 現在のユーザー

    Returns:
        作成されたデッキ

    Raises:
        HTTPException: 同じ名前のデッキが既に存在する場合
    """
    try:
        return deck_service.create_user_deck(
            db=db, user_id=current_user.id, deck_in=deck
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.get("/{deck_id}", response_model=DeckRead)
def get_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
    deck = deck_service.get_by_id(db=db, id=deck_id, user_id=current_user.id)

    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="デッキが見つかりません"
        )

    return deck


@router.put("/{deck_id}", response_model=DeckRead)
def update_deck(
    deck_id: int,
    deck: DeckUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
        HTTPException: デッキが見つからない場合または同じ名前のデッキが既に存在する場合
    """
    try:
        updated_deck = deck_service.update_user_deck(
            db=db, deck_id=deck_id, user_id=current_user.id, deck_in=deck
        )

        if not updated_deck:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="デッキが見つかりません"
            )
        return updated_deck

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
    success = deck_service.delete(db=db, id=deck_id, user_id=current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="デッキが見つかりません"
        )


@router.post("/archive-all", status_code=status.HTTP_200_OK)
def archive_all_decks(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    全デッキをアーカイブ（非アクティブ化）
    月末に新弾が来る際などに使用

    Args:
        db: データベースセッション
        current_user: 現在のユーザー

    Returns:
        アーカイブされたデッキ数
    """
    count = deck_service.archive_all_decks(db=db, user_id=current_user.id)
    return {
        "message": f"{count}件のデッキをアーカイブしました",
        "archived_count": count,
    }
