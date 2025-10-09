"""
認証関連の依存性
このファイルは後方互換性のために残していますが、
新しいコードでは app.api.deps を使用してください
"""

from app.api.deps import (
    get_current_user,
    get_current_user_optional,
)

__all__ = [
    "get_current_user",
    "get_current_user_optional",
]
