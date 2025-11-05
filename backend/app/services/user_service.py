import logging

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.base import BaseService

logger = logging.getLogger(__name__)


class UserService(BaseService[User, UserCreate, UserUpdate]):
    """ユーザーサービスクラス"""

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
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
        # TODO: アーキテクチャ改善 - 循環依存の回避
        # 現在、循環依存を避けるために動的インポートを使用していますが、
        # これはテストとメンテナンスを困難にします。
        #
        # 推奨される改善:
        # 1. duel_serviceを依存性注入で受け取る
        # 2. または、共通の export_service を作成
        # 3. インターフェース（Protocol）を使用して依存関係を抽象化
        from app.services.duel_service import duel_service

        return duel_service.export_duels_to_csv(db=db, user_id=user_id)

    def import_all_data_from_csv(
        self, db: Session, user_id: int, csv_content: str
    ) -> dict:
        # TODO: アーキテクチャ改善 - 循環依存の回避
        # export_all_data_to_csv と同様の問題
        from app.models.deck import Deck
        from app.models.duel import Duel
        from app.services.duel_service import duel_service

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
        return duel_service.import_duels_from_csv(
            db=db, user_id=user_id, csv_content=csv_content
        )


# シングルトンインスタンス
user_service = UserService(User)
