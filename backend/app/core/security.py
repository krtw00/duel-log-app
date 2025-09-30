"""
セキュリティ関連のユーティリティ関数
パスワードのハッシュ化、JWT生成・検証など
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from passlib.context import CryptContext
from jose import jwt, JWTError
from app.core.config import settings

# パスワードハッシュ化設定
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# bcryptは最大72バイトまでしか扱えない
MAX_BCRYPT_BYTES = 72


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    平文パスワードとハッシュ化されたパスワードを照合する
    
    Args:
        plain_password: 平文パスワード
        hashed_password: ハッシュ化されたパスワード
    
    Returns:
        パスワードが一致すればTrue、そうでなければFalse
    """
    # bcryptの制限に対応
    password_bytes = plain_password.encode("utf-8")[:MAX_BCRYPT_BYTES]
    trimmed_password = password_bytes.decode("utf-8", errors="ignore")
    return pwd_context.verify(trimmed_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    平文パスワードをハッシュ化する
    
    Args:
        password: 平文パスワード
    
    Returns:
        ハッシュ化されたパスワード
    """
    # bcryptの制限に対応（72バイトまで）
    password_bytes = password.encode("utf-8")[:MAX_BCRYPT_BYTES]
    trimmed_password = password_bytes.decode("utf-8", errors="ignore")
    return pwd_context.hash(trimmed_password)


def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    JWTアクセストークンを生成する
    
    Args:
        data: トークンに含めるペイロードデータ（通常はユーザーID等）
        expires_delta: トークンの有効期限（Noneの場合はデフォルト値を使用）
    
    Returns:
        JWT文字列
    """
    to_encode = data.copy()
    
    # 有効期限の設定
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # デフォルトの有効期限を使用
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # JWTの標準クレーム
    to_encode.update({"exp": expire})
    
    # JWT生成
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """
    JWTアクセストークンをデコードして検証する
    
    Args:
        token: JWT文字列
    
    Returns:
        デコードされたペイロード（検証失敗時はNone）
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
