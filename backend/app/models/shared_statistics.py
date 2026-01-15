from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base

if TYPE_CHECKING:
    from app.models.user import User


class SharedStatistics(Base):
    __tablename__ = "shared_statistics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    share_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    year: Mapped[int] = mapped_column()
    month: Mapped[int] = mapped_column()
    game_mode: Mapped[str] = mapped_column(String(10))  # RANK, RATE, EVENT, DC
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="shared_statistics")
