from __future__ import annotations

from datetime import datetime
import uuid
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models import Base

class SharedUrl(Base):
    __tablename__ = "sharedurls"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    year_month: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    createdat: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedat: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="sharedurls")