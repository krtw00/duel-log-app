"""
認証関連のAPIエンドポイント
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.schemas.auth import LoginRequest
from app.db.session import get_db
from app.models.user import User
from app.core.security import verify_password, create_access_token
from app.core.config import settings
import logging

# ルーター定義
router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)

# ロガー初期化
logger = logging.getLogger(__name__)


@router.post("/login")
def login(
    response: Response,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    ユーザーログイン
    
    メールアドレスとパスワードで認証し、HttpOnlyクッキーにJWTアクセストークンを設定する
    
    Args:
        response: FastAPIのレスポンスオブジェクト
        login_data: ログイン情報（email, password）
        db: データベースセッション
    
    Returns:
        ログイン成功メッセージ
    
    Raises:
        HTTPException: 認証失敗時（401 Unauthorized）
    """
    # メールアドレスでユーザーを検索
    user = db.query(User).filter(User.email == login_data.email).first()
    
    # ユーザーが存在しない、またはパスワードが一致しない場合
    if not user or not verify_password(login_data.password, user.passwordhash):
        logger.warning(f"Login failed for email: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # JWTトークンのペイロードを作成
    token_data = {
        "sub": str(user.id),  # "sub"はJWTの標準クレーム（subject）
        "email": user.email,
        "username": user.username
    }
    
    # アクセストークンを生成
    access_token = create_access_token(data=token_data)
    
    # HttpOnlyクッキーにトークンを設定
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=not settings.DEBUG,  # 本番環境ではTrueに設定
        path="/"
    )
    
    logger.info(f"User logged in successfully: {user.email} (ID: {user.id})")
    
    return {"message": "Login successful"}


@router.post("/logout")
def logout(response: Response):
    """
    ユーザーログアウト
    
    HttpOnlyクッキーをクリアしてログアウトする
    """
    response.delete_cookie("access_token")
    return {"message": "Logout successful"}
