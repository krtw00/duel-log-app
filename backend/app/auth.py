"""
認証依存関係
JWTトークンの検証と現在のユーザー取得
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from typing import Optional

# HTTPベアラートークンのセキュリティスキーム
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    JWTトークンから現在のユーザーを取得する
    
    Args:
        credentials: HTTPベアラートークン（Authorizationヘッダーから自動抽出）
        db: データベースセッション
    
    Returns:
        User: 認証されたユーザーオブジェクト
    
    Raises:
        HTTPException: トークンが無効または期限切れの場合（401 Unauthorized）
    """
    # 認証情報の検証
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証情報を検証できませんでした",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # トークンをデコード
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise credentials_exception
    
    # ペイロードからユーザーIDを取得
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # データベースからユーザーを取得
    try:
        user_id_int = int(user_id)
    except ValueError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id_int).first()
    
    if user is None:
        raise credentials_exception
    
    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    JWTトークンから現在のユーザーを取得する（オプショナル版）
    
    トークンがない場合でもエラーを発生させず、Noneを返す
    認証が必須ではないエンドポイントで使用する
    
    Args:
        credentials: HTTPベアラートークン（オプショナル）
        db: データベースセッション
    
    Returns:
        User or None: 認証されたユーザーオブジェクト、または None
    """
    if credentials is None:
        return None
    
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None
