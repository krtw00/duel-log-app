from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models import Base


class SharedStatistics(Base):
    __tablename__ = "shared_statistics"

    id = Column(Integer, primary_key=True, index=True)
    share_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    game_mode = Column(String(10), nullable=False)  # RANK, RATE, EVENT, DC
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    expires_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="shared_statistics")
