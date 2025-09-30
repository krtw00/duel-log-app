"""
認証が必要なエンドポイントの使用例を示すルーター
"""
from fastapi import APIRouter, Depends
from app.schemas.user import UserResponse
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/me",
    tags=["current user"]
)


@router.get("/", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    現在のユーザー情報を取得
    
    認証が必要なエンドポイントの例
    Authorizationヘッダーに「Bearer {token}」形式でJWTトークンを含める必要がある
    
    Args:
        current_user: 認証されたユーザー（get_current_userから自動取得）
    
    Returns:
        UserResponse: 現在のユーザー情報
    """
    return current_user
