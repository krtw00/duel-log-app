"""
セキュリティ関連のユーティリティ関数
パスワードのハッシュ化、JWT生成・検証など

注意: メイン認証はSupabase Authに移行済み。
このファイルにはOBSトークン生成とレガシー互換性のための関数を残しています。
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# bcryptは最大72バイトまでしか扱えない
MAX_BCRYPT_BYTES = 72


def _truncate_password(password: str) -> str:
    """
    パスワードを72バイトに切り詰める（UTF-8文字境界を考慮）

    Args:
        password: 元のパスワード

    Returns:
        72バイト以下に切り詰められたパスワード
    """
    password_bytes = password.encode("utf-8")
    if len(password_bytes) <= MAX_BCRYPT_BYTES:
        return password

    # UTF-8文字境界を考慮して切り詰め
    truncated_bytes = password_bytes[:MAX_BCRYPT_BYTES]
    # 不完全な文字を削除するため、デコードエラーが発生しないところまで戻す
    while truncated_bytes:
        try:
            return truncated_bytes.decode("utf-8")
        except UnicodeDecodeError:
            truncated_bytes = truncated_bytes[:-1]
    return ""


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    平文パスワードとハッシュ化されたパスワードを照合する

    Args:
        plain_password: 平文パスワード
        hashed_password: ハッシュ化されたパスワード

    Returns:
        パスワードが一致すればTrue、そうでなければFalse
    """
    # bcryptの制限に対応（72バイトまで）
    trimmed_password = _truncate_password(plain_password)

    # bcryptを直接使用してパスワードを検証
    try:
        return bcrypt.checkpw(
            trimmed_password.encode("utf-8"),
            (
                hashed_password.encode("utf-8")
                if isinstance(hashed_password, str)
                else hashed_password
            ),
        )
    except (ValueError, AttributeError):
        return False


def get_password_hash(password: str) -> str:
    """
    平文パスワードをハッシュ化する

    Args:
        password: 平文パスワード

    Returns:
        ハッシュ化されたパスワード
    """
    # bcryptの制限に対応（72バイトまで）
    trimmed_password = _truncate_password(password)

    # bcryptを直接使用してパスワードをハッシュ化
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(trimmed_password.encode("utf-8"), salt)

    # 文字列として返す（データベース保存用）
    return hashed.decode("utf-8")


def create_access_token(
    data: dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
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
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    # JWTの標準クレーム
    to_encode.update({"exp": expire})

    # JWT生成
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
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
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
