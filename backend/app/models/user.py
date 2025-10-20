from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models import Base

if TYPE_CHECKING:
    from app.models.deck import Deck
    from app.models.duel import Duel
    from app.models.password_reset_token import PasswordResetToken
    from app.models.shared_statistics import SharedStatistics
    from app.models.sharedUrl import SharedUrl


def __repr__(self):
    return f"<User id={self.id} username={self.username} email={self.email}>"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=True)
    passwordhash: Mapped[str] = mapped_column(String, nullable=False)
    streamer_mode: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    theme_preference: Mapped[str] = mapped_column(
        String, nullable=False, server_default="dark"
    )
    createdat: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updatedat: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    decks: Mapped[list["Deck"]] = relationship(
        "Deck", back_populates="user", cascade="all, delete-orphan"
    )
    duels: Mapped[list["Duel"]] = relationship(
        "Duel", back_populates="user", cascade="all, delete-orphan"
    )
    sharedurls: Mapped[list["SharedUrl"]] = relationship(
        "SharedUrl", back_populates="user", cascade="all, delete-orphan"
    )
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(
        "PasswordResetToken", back_populates="user", cascade="all, delete-orphan"
    )
    shared_statistics: Mapped[list["SharedStatistics"]] = relationship(
        "SharedStatistics", back_populates="user", cascade="all, delete-orphan"
    )
