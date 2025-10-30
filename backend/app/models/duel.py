"""
対戦履歴モデル

トレーディングカードゲームの対戦結果を記録・管理するためのモデル。
ユーザーが使用したデッキ、対戦相手のデッキ、勝敗、ゲームモード、
ターン順などの詳細な情報を保持します。
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models import Base


class Duel(Base):
    """
    対戦履歴モデル

    各対戦の詳細情報を記録します。統計情報の計算やデッキ相性分析の
    基礎データとして使用されます。
    """

    __tablename__ = "duels"

    # 基本情報
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deck_id = Column(Integer, ForeignKey("decks.id"), nullable=False)  # 使用デッキ
    opponentDeck_id = Column(
        Integer, ForeignKey("decks.id"), nullable=False
    )  # 相手のデッキ（注: 本番DB仕様でcamelCase）

    # 対戦結果
    result = Column(Boolean, nullable=False)  # True=勝利, False=敗北
    game_mode = Column(
        String(10), nullable=False, default="RANK", server_default="RANK"
    )  # RANK, RATE, EVENT, DC

    # ゲームモード別の値
    rank = Column(Integer, nullable=True)  # ランクモード時のランク（1-15: B2～M1）
    rate_value = Column(Float, nullable=True)  # レートモード時のレート数値（小数点2桁）
    dc_value = Column(Float, nullable=True)  # DCモード時のDC数値（小数点2桁）

    # 対戦詳細
    coin = Column(Boolean, nullable=False)  # True=コイントス勝利, False=敗北
    first_or_second = Column(Boolean, nullable=False)  # True=先攻, False=後攻
    played_date = Column(DateTime(timezone=True), nullable=False)  # 対戦日時
    notes = Column(String, nullable=True)  # メモ（任意）

    # タイムスタンプ
    create_date = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    update_date = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # リレーションシップ
    user = relationship("User", back_populates="duels")  # この対戦を記録したユーザー
    deck = relationship(
        "Deck", foreign_keys=[deck_id], back_populates="duels"
    )  # 使用したデッキ
    opponent_deck = relationship(
        "Deck", foreign_keys=[opponentDeck_id], back_populates="opponent_duels"
    )  # 対戦相手のデッキ
