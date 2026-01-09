"""デッキサービス。

デッキに関するビジネスロジックを提供。
"""

from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.deck import Deck
from app.models.duel import Duel
from app.schemas.deck import DeckCreate, DeckUpdate
from app.services.base import BaseService
from app.utils.datetime_utils import current_month_range_utc


class DeckService(BaseService[Deck, DeckCreate, DeckUpdate]):
    """デッキサービスクラス。"""

    def __init__(self):
        """DeckServiceのコンストラクタ。"""
        super().__init__(Deck)

    def get_user_decks(
        self,
        db: Session,
        user_id: int,
        is_opponent: Optional[bool] = None,
        active_only: bool = True,
    ) -> List[Deck]:
        """ユーザーのデッキを取得。"""
        if is_opponent:
            start_utc, end_utc = current_month_range_utc()

            # CTE to count duels for each opponent deck in the current (local) month
            duel_counts = (
                db.query(
                    Duel.opponent_deck_id.label("deck_id"),
                    func.count(Duel.id).label("duel_count"),
                )
                .filter(
                    Duel.user_id == user_id,
                    Duel.played_date >= start_utc,
                    Duel.played_date < end_utc,
                )
                .group_by(Duel.opponent_deck_id)
                .subquery("duel_counts")
            )

            query = db.query(Deck).outerjoin(
                duel_counts, Deck.id == duel_counts.c.deck_id
            )

            query = query.filter(Deck.user_id == user_id)
            query = query.filter(Deck.is_opponent.is_(True))

            if active_only:
                query = query.filter(Deck.active.is_(True))

            query = query.order_by(
                func.coalesce(duel_counts.c.duel_count, 0).desc(), Deck.name
            )

            return query.all()

        # Original logic for other cases
        query = db.query(Deck).filter(Deck.user_id == user_id)

        if is_opponent is not None:
            query = query.filter(Deck.is_opponent == is_opponent)

        if active_only:
            query = query.filter(Deck.active.is_(True))

        return query.all()

    def get_by_id(
        self,
        db: Session,
        id: int,
        user_id: Optional[int] = None,
        include_inactive: bool = False,
    ) -> Optional[Deck]:
        """IDでデッキを取得（必要に応じて非アクティブも含む）。"""
        query = db.query(Deck).filter(Deck.id == id)

        if user_id is not None:
            query = query.filter(Deck.user_id == user_id)

        if not include_inactive:
            query = query.filter(Deck.active.is_(True))

        return query.first()

    def get_by_name(
        self,
        db: Session,
        user_id: int,
        name: str,
        is_opponent: bool,
        include_inactive: bool = False,
    ) -> Optional[Deck]:
        """同じユーザー内で同じ名前とタイプのデッキを取得。"""
        query = db.query(Deck).filter(
            Deck.user_id == user_id,
            Deck.name == name,
            Deck.is_opponent == is_opponent,
        )

        if not include_inactive:
            query = query.filter(Deck.active.is_(True))

        return query.first()

    def create_user_deck(
        self, db: Session, user_id: int, deck_in: DeckCreate, commit: bool = True
    ) -> Deck:
        """ユーザーのデッキを作成。"""
        # 同じ名前のデッキが存在するかチェック
        existing_deck = self.get_by_name(
            db=db, user_id=user_id, name=deck_in.name, is_opponent=deck_in.is_opponent
        )

        if existing_deck:
            deck_type = "相手のデッキ" if deck_in.is_opponent else "自分のデッキ"
            raise ValueError(f"同じ名前の{deck_type}が既に存在します")

        # DeckCreateにuser_idが含まれている場合は除外
        deck_data = deck_in.model_dump(exclude={"user_id"})
        deck_obj = DeckCreate(**deck_data)

        return self.create(db, deck_obj, user_id=user_id, commit=commit)

    def update_user_deck(
        self, db: Session, deck_id: int, user_id: int, deck_in: DeckUpdate
    ) -> Optional[Deck]:
        """ユーザーのデッキを更新。"""
        # 更新対象のデッキを取得
        deck = self.get_by_id(db=db, id=deck_id, user_id=user_id)
        if not deck:
            return None

        # 名前が変更される場合、重複チェック
        if deck_in.name and deck_in.name != deck.name:
            is_opponent = (
                deck_in.is_opponent
                if deck_in.is_opponent is not None
                else deck.is_opponent
            )
            existing_deck = self.get_by_name(
                db=db, user_id=user_id, name=deck_in.name, is_opponent=is_opponent
            )

            if existing_deck:
                deck_type = "相手のデッキ" if is_opponent else "自分のデッキ"
                raise ValueError(f"同じ名前の{deck_type}が既に存在します")

        return self.update(db=db, id=deck_id, obj_in=deck_in, user_id=user_id)

    def delete(self, db: Session, id: int, user_id: Optional[int] = None) -> bool:
        """デッキを論理削除（active=False）に変更。既存のアーカイブと統合。

        同名のアーカイブ済みデッキが存在する場合、対戦履歴をそのデッキに統合し、
        このデッキを物理削除します。これにより、重複アーカイブを防ぎます。

        Args:
            db: データベースセッション
            id: 削除するデッキのID
            user_id: ユーザーID（オプション）

        Returns:
            True: 削除が成功した場合
            False: デッキが存在しない、または既にアーカイブ済みの場合
        """
        # アーカイブ対象のデッキを取得
        deck = self.get_by_id(db=db, id=id, user_id=user_id, include_inactive=True)

        if deck is None or deck.active is False:
            return False

        # 同名のアーカイブ済みデッキを探す
        existing_archive = self.get_by_name(
            db=db,
            user_id=deck.user_id,
            name=deck.name,
            is_opponent=deck.is_opponent,
            include_inactive=True,
        )

        # active=Falseのアーカイブが既に存在する場合、マージ処理を実行
        if (
            existing_archive
            and existing_archive.id != deck.id
            and not existing_archive.active
        ):
            # 対戦履歴を既存のアーカイブに移行（プレイヤーデッキとして）
            db.query(Duel).filter(Duel.deck_id == deck.id).update(
                {"deck_id": existing_archive.id}
            )

            # 対戦履歴を既存のアーカイブに移行（相手デッキとして）
            db.query(Duel).filter(Duel.opponent_deck_id == deck.id).update(
                {"opponent_deck_id": existing_archive.id}
            )

            # 統合元のデッキを物理削除
            db.delete(deck)
        else:
            # 通常のアーカイブ（論理削除）
            deck.active = False

        db.commit()
        return True

    def archive_all_decks(self, db: Session, user_id: int) -> int:
        """ユーザーの全デッキをアーカイブ（非アクティブ化）。"""
        result = (
            db.query(Deck)
            .filter(Deck.user_id == user_id, Deck.active.is_(True))
            .update({"active": False})
        )
        db.commit()
        return result

    def get_or_create(
        self, db: Session, user_id: int, name: str, is_opponent: bool
    ) -> Deck:
        """デッキを取得、なければ作成。"""
        deck = self.get_by_name(
            db,
            user_id=user_id,
            name=name,
            is_opponent=is_opponent,
        )
        if deck:
            return deck

        deck_in = DeckCreate(name=name, is_opponent=is_opponent, active=True)
        return self.create_user_deck(db, user_id=user_id, deck_in=deck_in, commit=False)


# シングルトンインスタンス
deck_service = DeckService()
