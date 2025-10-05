from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base
from app.models.duel import Duel

class Deck(Base):
    __tablename__ = "decks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    is_opponent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    createdat: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedat: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="decks")
    duels = relationship("Duel", foreign_keys='[Duel.deck_id]', back_populates="deck")
    opponent_duels = relationship("Duel", foreign_keys='[Duel.opponentDeck_id]', back_populates="opponent_deck")