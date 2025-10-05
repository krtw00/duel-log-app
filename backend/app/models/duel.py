from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models import Base
from datetime import datetime, timezone

class Duel(Base):
    __tablename__ = "duels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deck_id = Column(Integer, ForeignKey("decks.id"), nullable=False)
    opponentDeck_id = Column(Integer, ForeignKey("decks.id"), nullable=False)

    result = Column(Boolean, nullable=False)
    game_mode = Column(String(10), nullable=False, default='RANK', server_default='RANK')  # RANK, RATE, EVENT, DC
    rank = Column(Integer, nullable=True)  # ランクモード時のランク（1-15: B2～M1）
    rate_value = Column(Integer, nullable=True)  # レートモード時のレート数値
    dc_value = Column(Integer, nullable=True)  # DCモード時のDC数値
    coin = Column(Boolean, nullable=False)
    first_or_second = Column(Boolean, nullable=False)
    played_date = Column(DateTime(timezone=True), nullable=False)
    notes = Column(String, nullable=True)
    create_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    update_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="duels")
    deck = relationship("Deck", foreign_keys=[deck_id], back_populates="duels")
    opponent_deck = relationship("Deck", foreign_keys=[opponentDeck_id], back_populates="opponent_duels")
