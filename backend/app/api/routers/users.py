import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user_service import user_service

# ルーター定義
router = APIRouter(prefix="/users", tags=["users"])

# ロガー初期化
logger = logging.getLogger(__name__)


# ユーザー作成
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """新規ユーザーを作成する"""
    # メールアドレスの重複チェック
    existing_user = (
        db.query(user_service.model)
        .filter(user_service.model.email == user.email)
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="このメールアドレスは既に使用されています",
        )

    new_user = user_service.create(db=db, obj_in=user)
    return new_user


# ユーザー取得（ID指定）
@router.get("/{user_id}", response_model=UserResponse, response_model_exclude_none=True)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """IDで指定されたユーザーを取得する"""
    # 認可チェック: 自分のデータのみ取得可能
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="他のユーザーの情報にアクセスする権限がありません",
        )

    db_user = user_service.get_by_id(db=db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


# ユーザー一覧取得
# 注意: このエンドポイントは管理者のみがアクセスできるべきですが、
# 現在管理者の概念が実装されていません。
# セキュリティ上のリスクを避けるため、このエンドポイントは無効化されています。
# TODO: 管理者機能を実装後、適切な権限チェックを追加してください。
# @router.get("/", response_model=list[UserResponse])
# def read_users(
#     skip: int = 0,
#     limit: int = 100,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     """ユーザーの一覧を取得する（管理者のみ）"""
#     # TODO: 管理者チェックを追加
#     # if not current_user.is_admin:
#     #     raise HTTPException(status_code=403, detail="管理者権限が必要です")
#     return user_service.get_all(db=db, skip=skip, limit=limit)


# ユーザー更新
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """IDで指定されたユーザーを更新する"""
    # 認可チェック: 自分のデータのみ更新可能
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="他のユーザーの情報を更新する権限がありません",
        )

    db_user = user_service.get_by_id(db=db, id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    updated_user = user_service.update_profile(db=db, db_obj=db_user, obj_in=user_in)
    return updated_user


# ユーザー削除
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """IDで指定されたユーザーを削除する"""
    # 認可チェック: 自分のアカウントのみ削除可能
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="他のユーザーのアカウントを削除する権限がありません",
        )

    success = user_service.delete(db=db, id=user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return
