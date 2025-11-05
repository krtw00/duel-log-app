from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models import Base

if TYPE_CHECKING:
    from app.models.user import User


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    token: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="password_reset_tokens")

    def is_expired(self) -> bool:
        now = datetime.now(timezone.utc)
        # Ensure expires_at is timezone-aware for comparison
        expires_at = self.expires_at
        if expires_at.tzinfo is None:
            # If naive, assume UTC
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return now > expires_at

    def __repr__(self):
        return f"<PasswordResetToken id={self.id} user_id={self.user_id} expires_at={self.expires_at}>"
