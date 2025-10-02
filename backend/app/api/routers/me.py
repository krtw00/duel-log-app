from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.schemas.user import UserResponse, UserUpdate
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.user_service import user_service

router = APIRouter(
    prefix="/me",
    tags=["current user"]
)


@router.get("/", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    現在のユーザー情報を取得
    """
    return current_user


@router.put("/", response_model=UserResponse)
def update_my_profile(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    現在のユーザー情報を更新
    """
    updated_user = user_service.update_profile(
        db=db, 
        db_obj=current_user, 
        obj_in=user_in
    )
    return updated_user


@router.delete("/", status_code=status.HTTP_200_OK)
def delete_my_account(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    現在のアカウントを削除
    
    ユーザーに関連するすべてのデータ（デッキ、デュエル）も削除される
    """
    user_service.delete(db=db, id=current_user.id)
    response.delete_cookie("access_token")
    return {"message": "アカウントが正常に削除されました"}
