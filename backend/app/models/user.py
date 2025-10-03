from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func


from app.models import Base
from app.models.duel import Duel

def __repr__(self):
    return f"<User id={self.id} username={self.username} email={self.email}>"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=True)
    passwordhash: Mapped[str] = mapped_column(String, nullable=False)
    createdat: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updatedat: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)




    decks: Mapped[list["Deck"]] = relationship("Deck", back_populates="user", cascade="all, delete-orphan")
    duels: Mapped[list["Duel"]] = relationship("Duel", back_populates="user", cascade="all, delete-orphan")
    sharedurls: Mapped[list["SharedUrl"]] = relationship("SharedUrl", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")