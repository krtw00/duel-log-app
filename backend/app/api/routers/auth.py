"""
認証関連のAPIエンドポイント
"""

import logging
from datetime import datetime, timedelta, timezone

import resend
from fastapi import APIRouter, Depends, HTTPException, Response, status
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_password_reset_token,
    get_password_hash,
    verify_password,
)
from app.db.session import get_db
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.schemas.auth import ForgotPasswordRequest, LoginRequest, ResetPasswordRequest

# ルーター定義
router = APIRouter(prefix="/auth", tags=["authentication"])

# ロガー初期化
logger = logging.getLogger(__name__)

# Jinja2テンプレート環境の初期化
jinja_env = Environment(loader=FileSystemLoader("./app/templates/email"))


@router.post("/login")
def login(response: Response, login_data: LoginRequest, db: Session = Depends(get_db)):
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
        "username": user.username,
    }

    # アクセストークンを生成
    access_token = create_access_token(data=token_data)

    # クロスオリジン対応のクッキー設定
    is_production = settings.ENVIRONMENT == "production"

    # HttpOnlyクッキーにトークンを設定
    # 注: partitioned属性はStarlette 0.36.0+で利用可能
    # 現在のバージョンでは未サポートのため、基本的なCookie設定のみ使用
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="none" if is_production else "lax",  # クロスオリジンの場合は"none"
        secure=is_production,  # 本番環境（HTTPS）では必ずTrue
        partitioned=is_production,  # サードパーティCookieとして許可
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # 秒単位
    )

    logger.info(f"User logged in successfully: {user.email} (ID: {user.id})")
    logger.info(
        f"Cookie settings - SameSite: {'none' if is_production else 'lax'}, Secure: {is_production}"
    )

    return {
        "message": "Login successful",
        "user": {"id": user.id, "username": user.username, "email": user.email},
    }


@router.post("/logout")
def logout(response: Response):
    """
    ユーザーログアウト

    HttpOnlyクッキーをクリアしてログアウトする
    """
    is_production = settings.ENVIRONMENT == "production"

    # Cookieを削除するために、max_age=0で設定し直す
    response.set_cookie(
        key="access_token",
        value="",
        httponly=True,
        samesite="none" if is_production else "lax",
        secure=is_production,
        partitioned=is_production,
        path="/",
        max_age=0,
    )

    return {"message": "Logout successful"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    request: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    """
    パスワード再設定メールを送信する (Resend APIを使用)
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
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)  # 1時間有効

    reset_token_entry = PasswordResetToken(
        user_id=user.id, token=token, expires_at=expires_at
    )
    db.add(reset_token_entry)
    db.commit()
    db.refresh(reset_token_entry)

    # --- Resend API を使ったメール送信処理 ---
    reset_link = f"{settings.FRONTEND_URL}/reset-password/{token}"

    # HTMLテンプレートをレンダリング
    try:
        template = jinja_env.get_template("password_reset.html")
        html_content = template.render(username=user.username, reset_link=reset_link)
    except Exception as e:
        logger.error(f"Failed to render email template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="メールテンプレートの生成に失敗しました。",
        ) from e

    try:
        resend.api_key = settings.RESEND_API_KEY
        params = {
            "from": f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>",
            "to": [user.email],
            "subject": "パスワード再設定のご案内",
            "html": html_content,
        }
        email = resend.Emails.send(params)
        logger.info(
            f"Password reset email sent to {user.email} via Resend. Email ID: {email['id']}"
        )

    except Exception as e:
        logger.error(
            f"An unexpected error occurred while sending email to {user.email}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="メールの送信中に予期せぬエラーが発生しました。",
        ) from e

    return {"message": "パスワード再設定の案内をメールで送信しました。"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    新しいパスワードを設定する
    """
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新しいパスワードと確認用パスワードが一致しません。",
        )

    # トークンを検索
    reset_token_entry = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token == request.token)
        .first()
    )

    if not reset_token_entry or reset_token_entry.is_expired():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効なトークンまたは有効期限切れのトークンです。",
        )

    user = db.query(User).filter(User.id == reset_token_entry.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="ユーザーが見つかりません。"
        )

    # パスワードを更新
    user.passwordhash = get_password_hash(request.new_password)
    db.add(user)

    # 使用済みトークンを削除
    db.delete(reset_token_entry)
    db.commit()

    logger.info(f"Password for user {user.email} has been reset.")

    return {"message": "パスワードが正常にリセットされました。"}
