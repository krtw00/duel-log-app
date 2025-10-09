from sqlalchemy.orm import DeclarativeBase


# 明示的に Base を定義
class Base(DeclarativeBase):
    pass


# 各モデルを import
from .deck import Deck
from .duel import Duel
from .password_reset_token import PasswordResetToken
from .shared_statistics import SharedStatistics
from .sharedUrl import SharedUrl
from .user import User

__all__ = [
    "Base",
    "User",
    "Deck",
    "Duel",
    "SharedUrl",
    "PasswordResetToken",
    "SharedStatistics",
]
