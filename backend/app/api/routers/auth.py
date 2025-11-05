"""
認証関連のAPIエンドポイント
"""

import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

import resend
from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
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
# 現在のファイルからの相対パスでテンプレートディレクトリを指定
template_dir = Path(__file__).parent.parent.parent / "templates" / "email"
jinja_env = Environment(loader=FileSystemLoader(str(template_dir)))


def _is_safari_browser(user_agent: str) -> bool:
    """
    User-AgentからSafariブラウザを判定

    Safari（特にiOS/iPadOS）はSameSite=Noneのクッキーを厳しく制限するため、
    SameSite=Laxを使用する必要がある
    """
    if not user_agent:
        return False

    user_agent_lower = user_agent.lower()

    # Safariの判定（ChromeやEdgeではない純粋なSafari）
    is_safari = (
        "safari" in user_agent_lower
        and "chrome" not in user_agent_lower
        and "edg" not in user_agent_lower
    )

    # iOSデバイスの判定
    is_ios = (
        "iphone" in user_agent_lower
        or "ipad" in user_agent_lower
        or "ipod" in user_agent_lower
    )

    return is_safari or is_ios


@router.post("/login")
def login(
    response: Response,
    login_data: LoginRequest,
    db: Session = Depends(get_db),
    user_agent: str | None = Header(None),
):
    """
    ユーザーログイン

    メールアドレスとパスワードで認証し、HttpOnlyクッキーにJWTアクセストークンを設定する
    """
    is_production = settings.ENVIRONMENT == "production"

    logger.info(f"Login attempt for email: {login_data.email}")
    logger.info(f"Environment: {settings.ENVIRONMENT}, Is Production: {is_production}")
    logger.info(f"User-Agent: {user_agent}")

    user = db.query(User).filter(User.email == login_data.email).first()

    if not user or not verify_password(login_data.password, user.passwordhash):
        logger.warning(f"Login failed for email: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "username": user.username,
    }
    access_token = create_access_token(data=token_data)

    is_production = settings.ENVIRONMENT == "production"

    # Safari/iOS判定
    is_safari = _is_safari_browser(user_agent or "")

    # Safari ITP対策: SafariではSameSite=Laxを使用
    # クロスサイトCookieはSafariでブロックされるため、同一サイトとして扱う
    # 注意: この対策はフロントエンドとバックエンドが異なるドメインの場合は完全には機能しない
    # 理想的にはバックエンドをサブパス（/api）に配置するか、同一ドメインに配置する
    if is_safari:
        samesite_value = "lax"
        secure_value = True if is_production else False
        logger.info("Safari/iOS detected - using SameSite=Lax")
    else:
        samesite_value = "none" if is_production else "lax"
        secure_value = is_production
        logger.info(f"Non-Safari browser - using SameSite={samesite_value}")

    cookie_params = {
        "key": "access_token",
        "value": access_token,
        "httponly": True,
        "samesite": samesite_value,
        "secure": secure_value,
        "path": "/",
        "max_age": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }

    # Safari対応: productionの場合はdomainを明示的に設定しない（サブドメイン問題を回避）
    # これによりCookieは現在のドメインに対してのみ設定される

    logger.info(
        f"Setting cookie with params: samesite={cookie_params['samesite']}, secure={cookie_params['secure']}, httponly={cookie_params['httponly']}, path={cookie_params['path']}, max_age={cookie_params['max_age']}"
    )

    response.set_cookie(**cookie_params)

    logger.info(f"User logged in successfully: {user.email} (ID: {user.id})")
    logger.info(f"Cookie has been set for user: {user.email}")

    # Safari ITP対策: レスポンスボディにもトークンを含める
    # Safari/iOSではクロスサイトCookieがブロックされるため、
    # フロントエンドでlocalStorageに保存してAuthorizationヘッダーで送信する
    # OBS連携機能のため、すべてのブラウザでトークンを返すように変更
    response_data = {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "streamer_mode": user.streamer_mode,
            "theme_preference": user.theme_preference,
        },
    }

    # ⚠️ セキュリティ警告: レスポンスボディにトークンを含めることはXSS脆弱性のリスクがあります
    # OBS連携サポートのため、レスポンスにアクセストークンを追加していますが、
    # 将来的には /auth/obs-token エンドポイントを使用して、限定スコープの
    # 短寿命トークンを取得する方式に移行することを推奨します。
    #
    # NOTE: Vercel/Render環境でHttpOnlyクッキーが正しく機能しないケースがあるため、
    # localStorageフォールバックとして常に追加していますが、セキュリティリスクがあります。
    #
    # TODO: フロントエンドを修正して、以下の改善を実施してください：
    # 1. 通常のログインではトークンをレスポンスに含めない
    # 2. OBS連携が必要な場合のみ、専用エンドポイントから取得
    # 3. localStorageではなくHttpOnlyクッキーを優先使用
    response_data["access_token"] = access_token
    logger.warning(
        f"Login successful for {user.email}. "
        f"access_token included in response (security risk - consider using /auth/obs-token instead)."
    )

    return response_data


@router.post("/logout")
def logout(response: Response, user_agent: str | None = Header(None)):
    """
    ユーザーログアウト

    HttpOnlyクッキーをクリアしてログアウトする
    """
    is_production = settings.ENVIRONMENT == "production"
    is_safari = _is_safari_browser(user_agent or "")

    if is_safari:
        samesite_value = "lax"
        secure_value = True if is_production else False
        logger.info(
            "Safari/iOS detected on logout - using SameSite=Lax for cookie deletion"
        )
    else:
        samesite_value = "none" if is_production else "lax"
        secure_value = is_production
        logger.info(
            f"Non-Safari browser on logout - using SameSite={samesite_value} for cookie deletion"
        )

    cookie_params = {
        "key": "access_token",
        "value": "",
        "httponly": True,
        "samesite": samesite_value,
        "secure": secure_value,
        "path": "/",
        "max_age": 0,
    }

    response.set_cookie(**cookie_params)

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


@router.post("/obs-token", status_code=status.HTTP_200_OK)
def get_obs_token(
    current_user: User = Depends(get_current_user),
):
    """
    OBS連携用の限定スコープトークンを取得する

    このエンドポイントは、OBSオーバーレイなど外部ツール向けに
    短寿命で統計情報閲覧のみに限定されたトークンを発行します。

    - 有効期限: 24時間
    - スコープ: obs_overlay（統計情報の読み取りのみ）
    - セキュリティ: 通常のJWTトークンと異なり、書き込み操作は不可

    Returns:
        dict: OBS専用トークンと有効期限情報
    """
    # OBS専用のトークンデータ（スコープを限定）
    token_data = {
        "sub": str(current_user.id),
        "scope": "obs_overlay",  # 統計情報閲覧のみ
        "username": current_user.username,
    }

    # 24時間有効のトークンを生成
    obs_token = create_access_token(data=token_data, expires_delta=timedelta(hours=24))

    logger.info(
        f"OBS token generated for user {current_user.email} (ID: {current_user.id})"
    )

    return {
        "obs_token": obs_token,
        "expires_in": 24 * 60 * 60,  # 秒単位
        "scope": "obs_overlay",
        "message": "OBS連携用トークンを発行しました。このトークンは24時間有効です。",
    }
