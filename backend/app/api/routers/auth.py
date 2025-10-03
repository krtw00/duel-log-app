"""
認証関連のAPIエンドポイント
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.core.security import verify_password, create_access_token, generate_password_reset_token, get_password_hash
from app.core.config import settings
from app.schemas.auth import LoginRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.db.session import get_db
from app.models.user import User
from app.models.password_reset_token import PasswordResetToken
import logging
from datetime import datetime, timedelta, timezone

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
    
    # クロスオリジン対応のクッキー設定
    is_production = settings.ENVIRONMENT == "production"
    
    # HttpOnlyクッキーにトークンを設定
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="none" if is_production else "lax",  # クロスオリジンの場合は"none"
        secure=is_production,  # 本番環境（HTTPS）では必ずTrue
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # 秒単位
    )
    
    logger.info(f"User logged in successfully: {user.email} (ID: {user.id})")
    logger.info(f"Cookie settings - SameSite: {'none' if is_production else 'lax'}, Secure: {is_production}")
    
    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }


@router.post("/logout")
def logout(response: Response):
    """
    ユーザーログアウト
    
    HttpOnlyクッキーをクリアしてログアウトする
    """
    is_production = settings.ENVIRONMENT == "production"
    
    response.delete_cookie(
        key="access_token",
        path="/",
        samesite="none" if is_production else "lax",
        secure=is_production
    )
    
    return {"message": "Logout successful"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    パスワード再設定メールを送信する
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # セキュリティのため、ユーザーが存在しない場合でも成功したかのように振る舞う
        logger.info(f"Password reset requested for non-existent email: {request.email}")
        return {"message": "パスワード再設定の案内をメールで送信しました。"}

    # 既存のトークンを無効化
    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).delete()
    db.commit()

    # 新しいトークンを生成
    token = generate_password_reset_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1) # 1時間有効

    reset_token_entry = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.add(reset_token_entry)
    db.commit()
    db.refresh(reset_token_entry)

    # TODO: メール送信機能の実装
    reset_link = f"http://localhost:5173/reset-password/{token}" # フロントエンドのURL
    logger.info(f"Password reset link for {user.email}: {reset_link}")
    # send_email(user.email, "パスワード再設定のご案内", f"以下のリンクからパスワードを再設定してください: {reset_link}")

    return {"message": "パスワード再設定の案内をメールで送信しました。"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    新しいパスワードを設定する
    """
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新しいパスワードと確認用パスワードが一致しません。"
        )
    
    # トークンを検索
    reset_token_entry = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == request.token
    ).first()

    if not reset_token_entry or reset_token_entry.is_expired():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効なトークンまたは有効期限切れのトークンです。"
        )
    
    user = db.query(User).filter(User.id == reset_token_entry.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません。"
        )

    # パスワードを更新
    user.passwordhash = get_password_hash(request.new_password)
    db.add(user)
    
    # 使用済みトークンを削除
    db.delete(reset_token_entry)
    db.commit()

    logger.info(f"Password for user {user.email} has been reset.")

    return {"message": "パスワードが正常にリセットされました。"}
