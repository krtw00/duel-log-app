from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.db.session import get_db
from app.services.user_service import user_service

import logging

# ルーター定義
router = APIRouter(
    prefix="/users",
    tags=["users"]
)

# ロガー初期化
logger = logging.getLogger(__name__)

# ユーザー作成
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """新規ユーザーを作成する"""
    # メールアドレスの重複チェック
    existing_user = db.query(user_service.model).filter(user_service.model.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="このメールアドレスは既に使用されています",
        )
    
    new_user = user_service.create(db=db, obj_in=user)
    return new_user

# ユーザー取得（ID指定）
@router.get("/{user_id}", response_model=UserResponse, response_model_exclude_none=True)
def read_user(user_id: int, db: Session = Depends(get_db)):
    """IDで指定されたユーザーを取得する"""
    db_user = user_service.get_by_id(db=db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

# ユーザー一覧取得
@router.get("/", response_model=list[UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """ユーザーの一覧を取得する"""
    return user_service.get_all(db=db, skip=skip, limit=limit)

# ユーザー更新 (注意: このエンドポイントは管理者向けであるべき)
@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_in: UserUpdate, db: Session = Depends(get_db)):
    """IDで指定されたユーザーを更新する (管理者向け)"""
    db_user = user_service.get_by_id(db=db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=4.04, detail="User not found")
    
    # user_serviceのupdate_profileを管理者権限で呼び出す形にする
    # 本来は権限チェックが必要
    updated_user = user_service.update_profile(db=db, db_obj=db_user, obj_in=user_in)
    return updated_user

# ユーザー削除 (注意: このエンドポイントは管理者向けであるべき)
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """IDで指定されたユーザーを削除する (管理者向け)"""
    success = user_service.delete(db=db, id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return