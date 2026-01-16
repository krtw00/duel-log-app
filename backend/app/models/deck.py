"""デッキモデル

ユーザーが使用するデッキと対戦相手のデッキを管理するモデル。
is_opponentフラグにより、自分のデッキと相手のデッキを区別します。
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Deck(Base):
    """デッキモデル

    プレイヤーデッキと相手デッキの両方を管理します。
    is_opponentフラグで区別され、統計情報やデッキ相性分析に使用されます。
    """

    __tablename__ = "decks"

    # 基本情報
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )  # デッキの所有者
    name: Mapped[str] = mapped_column(String, nullable=False)  # デッキ名

    # デッキ属性
    is_opponent: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )  # True=相手デッキ, False=自分のデッキ
    active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )  # True=アクティブ, False=アーカイブ済み

    # タイムスタンプ
    createdat: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updatedat: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # リレーションシップ
    user: Mapped["User"] = relationship(
        "User", back_populates="decks"
    )  # デッキの所有者
    duels = relationship(
        "Duel", foreign_keys="[Duel.deck_id]", back_populates="deck"
    )  # このデッキを使用した対戦
    opponent_duels = relationship(
        "Duel", foreign_keys="[Duel.opponent_deck_id]", back_populates="opponent_deck"
    )  # このデッキと対戦した履歴
