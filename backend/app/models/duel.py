from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models import Base


class Duel(Base):
    """
    対戦記録モデル

    トレーディングカードゲームの1回の対戦（デュエル）に関する情報を記録します。
    勝敗、使用デッキ、相手デッキ、ターン順、コイントス結果などを含みます。
    """

    __tablename__ = "duels"

    # 基本フィールド
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # 対戦したユーザー
    deck_id = Column(Integer, ForeignKey("decks.id"), nullable=False)  # 使用したプレイヤーのデッキ
    opponent_deck_id = Column(
        "opponentDeck_id", Integer, ForeignKey("decks.id"), nullable=False
    )  # 相手のデッキ

    # 対戦結果フィールド
    is_win = Column("result", Boolean, nullable=False)  # 勝敗: True = 勝ち, False = 負け

    # ゲームモード関連フィールド
    game_mode = Column(
        String(10), nullable=False, default="RANK", server_default="RANK"
    )  # ゲームモード: 'RANK', 'RATE', 'EVENT', 'DC'
    rank = Column(Integer, nullable=True)  # ランクモード時のランク（1-15: B2～M1）
    rate_value = Column(Integer, nullable=True)  # レートモード時のレート数値
    dc_value = Column(Integer, nullable=True)  # DCモード時のDC数値

    # ターン順・コイントス関連フィールド
    won_coin_toss = Column("coin", Boolean, nullable=False)  # コイントス結果: True = 勝ち, False = 負け
    is_going_first = Column("first_or_second", Boolean, nullable=False)  # ターン順: True = 先攻, False = 後攻

    # その他のフィールド
    played_date = Column(DateTime(timezone=True), nullable=False)  # 対戦日時
    notes = Column(String, nullable=True)  # メモ（任意）

    # メタデータフィールド
    create_date = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )  # 作成日時
    update_date = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )  # 更新日時

    # リレーションシップ
    user = relationship("User", back_populates="duels")  # 対戦したユーザー
    deck = relationship("Deck", foreign_keys=[deck_id], back_populates="duels")  # プレイヤーのデッキ
    opponent_deck = relationship(
        "Deck", foreign_keys=[opponent_deck_id], back_populates="opponent_duels"
    )  # 相手のデッキ
