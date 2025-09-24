from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    passwordhash = Column(String, nullable=False)
    createdat = Column(DateTime, default=datetime.utcnow)
    updatedat = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    decks = relationship("Deck", back_populates="user")
    duels = relationship("Duel", back_populates="user")
    sharedurls = relationship("SharedURL", back_populates="user")


class Deck(Base):
    __tablename__ = "decks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    createdat = Column(DateTime, default=datetime.utcnow)
    updatedat = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="decks")
    duels = relationship("Duel", back_populates="deck")


class Duel(Base):
    __tablename__ = "duels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deck_id = Column(Integer, ForeignKey("decks.id"), nullable=False)

    result = Column(Boolean, nullable=False)           # true=勝ち, false=負け
    rank = Column(Integer, nullable=True)
    coin = Column(Boolean, nullable=False)             # true=表, false=裏
    first_or_second = Column(Boolean, nullable=False)  # true=先手, false=後手

    dateplayed = Column(DateTime, nullable=False)
    notes = Column(String, nullable=True)
    createdat = Column(DateTime, default=datetime.utcnow)
    updatedat = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="duels")
    deck = relationship("Deck", back_populates="duels")


class SharedURL(Base):
    __tablename__ = "sharedurls"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    year_month = Column(String, nullable=False)  # YYYY-MM
    url = Column(String, unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    createdat = Column(DateTime, default=datetime.utcnow)
    updatedat = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="sharedurls")
