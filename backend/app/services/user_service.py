import logging
from typing import Callable, Optional, Protocol

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.base import BaseService

logger = logging.getLogger(__name__)


class DuelExportImportProtocol(Protocol):
    """デュエルのエクスポート/インポート機能のプロトコル"""

    def export_duels_to_csv(self, db: Session, user_id: int) -> str: ...
    def import_duels_from_csv(
        self, db: Session, user_id: int, csv_content: str
    ) -> dict: ...


class UserService(BaseService[User, UserCreate, UserUpdate]):
    """ユーザーサービスクラス"""

    _duel_service_factory: Optional[Callable[[], DuelExportImportProtocol]] = None

    @classmethod
    def set_duel_service_factory(
        cls, factory: Callable[[], DuelExportImportProtocol]
    ) -> None:
        """
        DuelServiceファクトリーを設定（循環依存を回避するための遅延バインディング）
        アプリケーション初期化時に呼び出す
        """
        cls._duel_service_factory = factory

    def _get_duel_service(self) -> DuelExportImportProtocol:
        """DuelServiceのインスタンスを取得"""
        if self._duel_service_factory is None:
            # フォールバック: 動的インポート（後方互換性のため）
            from app.services.duel_service import duel_service

            return duel_service
        return self._duel_service_factory()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:  # type: ignore[override]
        """
        新しいユーザーを作成する（パスワードをハッシュ化）
        """
        create_data = obj_in.model_dump()
        create_data.pop("password")
        create_data["passwordhash"] = get_password_hash(obj_in.password)

        db_obj = self.model(**create_data)

        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
        except IntegrityError as e:
            db.rollback()
            logger.error(f"❌ IntegrityError on user creation: {e}")
            raise HTTPException(
                status_code=409,
                detail="ユーザー名またはメールアドレスは既に使用されています",
            ) from e

        return db_obj

    def update_profile(self, db: Session, *, db_obj: User, obj_in: UserUpdate) -> User:
        """
        ユーザープロフィールを更新する
        パスワードが含まれている場合はハッシュ化する
        """
        update_data = obj_in.model_dump(exclude_unset=True)

        if "password" in update_data and update_data["password"]:
            hashed_password = get_password_hash(update_data["password"])
            update_data["passwordhash"] = hashed_password
            del update_data["password"]

        # Userモデルのフィールドを直接更新
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="ユーザー名またはメールアドレスは既に使用されています",
            ) from e

        return db_obj

    def export_all_data_to_csv(self, db: Session, user_id: int) -> str:
        """ユーザーの全デュエルデータをCSVとしてエクスポート"""
        duel_svc = self._get_duel_service()
        return duel_svc.export_duels_to_csv(db=db, user_id=user_id)

    def import_all_data_from_csv(
        self, db: Session, user_id: int, csv_content: str
    ) -> dict:
        """CSVからユーザーの全データをインポート（既存データは削除）"""
        from app.models.deck import Deck
        from app.models.duel import Duel

        try:
            # Delete all existing data
            db.query(Duel).filter(Duel.user_id == user_id).delete(
                synchronize_session=False
            )
            db.query(Deck).filter(Deck.user_id == user_id).delete(
                synchronize_session=False
            )
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500, detail=f"データの削除に失敗しました: {e}"
            ) from e

        # Import new data
        duel_svc = self._get_duel_service()
        return duel_svc.import_duels_from_csv(
            db=db, user_id=user_id, csv_content=csv_content
        )


# シングルトンインスタンス
user_service = UserService(User)
