"""
デッキサービス
デッキに関するビジネスロジックを提供
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.models.deck import Deck
from app.models.duel import Duel
from app.schemas.deck import DeckCreate, DeckUpdate
from app.services.base import BaseService


class DeckService(BaseService[Deck, DeckCreate, DeckUpdate]):
    """デッキサービスクラス"""

    def __init__(self):
        super().__init__(Deck)

    def get_user_decks(
        self,
        db: Session,
        user_id: int,
        is_opponent: Optional[bool] = None,
        active_only: bool = True,
    ) -> List[Deck]:
        """
        ユーザーのデッキを取得

        プレイヤーのデッキまたは相手のデッキを取得します。
        相手のデッキの場合、今月の対戦数順にソートされます。

        Args:
            db: データベースセッション
            user_id: ユーザーID
            is_opponent: デッキタイプ指定（True=相手のデッキ, False=プレイヤーのデッキ, None=全て）
            active_only: アクティブなデッキのみ取得するか（デフォルト: True）

        Returns:
            デッキのリスト
            - 相手のデッキの場合: 今月の対戦数が多い順、次に名前順
            - それ以外の場合: デフォルトの順序

        処理フロー:
            1. is_opponent=Trueの場合は特別な処理（対戦数順ソート）
            2. それ以外の場合は通常のフィルタリング
        """
        # 相手のデッキの場合: 今月の対戦数順にソート
        if is_opponent:
            now = datetime.utcnow()

            # サブクエリ: 今月の各相手デッキとの対戦数を集計
            # よく対戦する相手デッキを優先表示するため
            duel_counts = (
                db.query(
                    Duel.opponent_deck_id.label("deck_id"),
                    func.count(Duel.id).label("duel_count"),
                )
                .filter(
                    Duel.user_id == user_id,
                    extract("month", Duel.played_date) == now.month,
                    extract("year", Duel.played_date) == now.year,
                )
                .group_by(Duel.opponent_deck_id)
                .subquery("duel_counts")
            )

            # デッキテーブルと対戦数サブクエリを外部結合
            query = db.query(Deck).outerjoin(
                duel_counts, Deck.id == duel_counts.c.deck_id
            )

            # ユーザーIDと相手デッキフラグでフィルタ
            query = query.filter(Deck.user_id == user_id)
            query = query.filter(Deck.is_opponent.is_(True))

            # アクティブなデッキのみに絞り込み（オプション）
            if active_only:
                query = query.filter(Deck.active.is_(True))

            # 対戦数の多い順→デッキ名順でソート
            # coalesceで対戦数がNULLの場合は0として扱う
            query = query.order_by(
                func.coalesce(duel_counts.c.duel_count, 0).desc(), Deck.name
            )

            return query.all()

        # プレイヤーのデッキまたは全デッキの場合: 通常のフィルタリング
        query = db.query(Deck).filter(Deck.user_id == user_id)

        # is_opponentフラグでフィルタ（Noneの場合は全て取得）
        if is_opponent is not None:
            query = query.filter(Deck.is_opponent == is_opponent)

        # アクティブなデッキのみに絞り込み（オプション）
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
        """
        IDでデッキを取得

        デッキIDから特定のデッキを取得します。
        user_idを指定することで、特定ユーザーのデッキのみに絞り込めます。

        Args:
            db: データベースセッション
            id: デッキID
            user_id: ユーザーID（指定した場合、そのユーザーのデッキのみ取得）
            include_inactive: 非アクティブ（削除済み）デッキも含めるか（デフォルト: False）

        Returns:
            デッキオブジェクト（見つからない場合はNone）

        Note:
            - デフォルトではアクティブなデッキのみを返す
            - 削除済みデッキを取得したい場合は include_inactive=True を指定
        """
        query = db.query(Deck).filter(Deck.id == id)

        # ユーザーIDでフィルタ（指定された場合）
        if user_id is not None:
            query = query.filter(Deck.user_id == user_id)

        # アクティブなデッキのみに絞り込み（デフォルト）
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
        """
        同じユーザー内で同じ名前とタイプのデッキを取得

        Args:
            db: データベースセッション
            user_id: ユーザーID
            name: デッキ名
            is_opponent: 対戦相手のデッキかどうか

        Returns:
            デッキ（存在しない場合はNone）
        """
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
        """
        ユーザーのデッキを作成

        Args:
            db: データベースセッション
            user_id: ユーザーID
            deck_in: デッキ作成スキーマ

        Returns:
            作成されたデッキ

        Raises:
            ValueError: 同じ名前のデッキが既に存在する場合
        """
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
        """
        ユーザーのデッキを更新

        Args:
            db: データベースセッション
            deck_id: デッキID
            user_id: ユーザーID
            deck_in: デッキ更新スキーマ

        Returns:
            更新されたデッキ（存在しない場合はNone）

        Raises:
            ValueError: 同じ名前のデッキが既に存在する場合
        """
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
        """
        デッキを論理削除（active=False）に変更

        物理削除ではなく、activeフラグをFalseにすることで論理削除を行います。
        これにより、過去の対戦記録との整合性を保ちながらデッキを「削除」できます。

        Args:
            db: データベースセッション
            id: デッキID
            user_id: ユーザーID（指定した場合、そのユーザーのデッキのみ削除可能）

        Returns:
            削除成功の場合True、失敗の場合False
            - False: デッキが存在しないか、既に削除済み

        Note:
            - 物理削除ではなく論理削除（active=False）を行う
            - 過去の対戦記録からの参照を維持
            - include_inactive=Trueで取得して、既に削除済みかチェック
        """
        # 削除対象のデッキを取得（削除済みも含める）
        deck = self.get_by_id(db=db, id=id, user_id=user_id, include_inactive=True)

        # デッキが存在しない、または既に削除済みの場合は失敗
        if deck is None or deck.active is False:
            return False

        # 論理削除: activeフラグをFalseに設定
        deck.active = False
        db.commit()
        return True

    def archive_all_decks(self, db: Session, user_id: int) -> int:
        """
        ユーザーの全デッキをアーカイブ（非アクティブ化）

        Args:
            db: データベースセッション
            user_id: ユーザーID

        Returns:
            アーカイブされたデッキの数
        """
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
        """
        デッキを取得、存在しなければ作成

        指定された名前とタイプのデッキを取得します。
        存在しない場合は新規作成します。
        CSVインポートなど、一括データ登録時に便利なメソッドです。

        Args:
            db: データベースセッション
            user_id: ユーザーID
            name: デッキ名
            is_opponent: 相手のデッキかどうか

        Returns:
            既存または新規作成されたデッキオブジェクト

        Note:
            - 既存デッキがある場合はそれを返す（作成しない）
            - 新規作成する場合は commit=False で作成（呼び出し元でコミット制御）
            - CSVインポートなど、大量データ処理時の性能向上のため
        """
        # 既存デッキを検索
        deck = self.get_by_name(
            db,
            user_id=user_id,
            name=name,
            is_opponent=is_opponent,
        )

        # 既存デッキがあればそれを返す
        if deck:
            return deck

        # 存在しなければ新規作成（commit=Falseで呼び出し元に制御を委譲）
        deck_in = DeckCreate(name=name, is_opponent=is_opponent, active=True)
        return self.create_user_deck(db, user_id=user_id, deck_in=deck_in, commit=False)


# シングルトンインスタンス
deck_service = DeckService()
