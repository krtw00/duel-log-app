from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models import Base
from datetime import datetime
import uuid

class Duel(Base):
    __tablename__ = "duels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deck_id = Column(Integer, ForeignKey("decks.id"), nullable=False)

    result = Column(Boolean, nullable=False)
    rank = Column(Integer, nullable=True)
    coin = Column(Boolean, nullable=False)
    first_or_second = Column(Boolean, nullable=False)
    dateplayed = Column(DateTime, nullable=False)
    notes = Column(String, nullable=True)
    createdat = Column(DateTime, default=datetime.utcnow)
    updatedat = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="duels")
    deck = relationship("Deck", back_populates="duels")