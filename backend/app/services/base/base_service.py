"""
基底サービスクラス
共通のCRUD操作を提供
"""

from typing import Generic, List, Optional, Type, TypeVar

from pydantic import BaseModel
from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    基底サービスクラス

    共通のCRUD操作を提供し、各エンティティのサービスクラスで継承する
    """

    def __init__(self, model: Type[ModelType]):
        """
        Args:
            model: SQLAlchemyモデルクラス
        """
        self.model = model

    def get_by_id(
        self, db: Session, id: int, user_id: Optional[int] = None
    ) -> Optional[ModelType]:
        """
        IDでエンティティを取得

        Args:
            db: データベースセッション
            id: エンティティID
            user_id: ユーザーID（指定した場合、ユーザーに属するものだけ取得）

        Returns:
            エンティティまたはNone
        """
        query = db.query(self.model).filter(self.model.id == id)

        if user_id is not None:
            query = query.filter(self.model.user_id == user_id)

        return query.first()

    def get_all(
        self,
        db: Session,
        user_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ModelType]:
        """
        全てのエンティティを取得

        Args:
            db: データベースセッション
            user_id: ユーザーID（指定した場合、ユーザーに属するものだけ取得）
            skip: スキップする件数
            limit: 取得する最大件数

        Returns:
            エンティティのリスト
        """
        query = db.query(self.model)

        if user_id is not None:
            query = query.filter(self.model.user_id == user_id)

        return query.offset(skip).limit(limit).all()

    def create(
        self, db: Session, obj_in: CreateSchemaType, user_id: Optional[int] = None, commit: bool = True
    ) -> ModelType:
        """
        エンティティを作成

        Args:
            db: データベースセッション
            obj_in: 作成スキーマ
            user_id: ユーザーID（自動的にuser_idをセット）
            commit: Trueの場合、データベースに即時コミットする

        Returns:
            作成されたエンティティ
        """
        obj_data = obj_in.model_dump(exclude_unset=True)

        if user_id is not None:
            obj_data["user_id"] = user_id

        db_obj = self.model(**obj_data)
        db.add(db_obj)
        
        if commit:
            db.commit()
            db.refresh(db_obj)
        else:
            db.flush()
            
        return db_obj

    def update(
        self,
        db: Session,
        id: int,
        obj_in: UpdateSchemaType,
        user_id: Optional[int] = None,
    ) -> Optional[ModelType]:
        """
        エンティティを更新

        Args:
            db: データベースセッション
            id: エンティティID
            obj_in: 更新スキーマ
            user_id: ユーザーID（指定した場合、ユーザーに属するものだけ更新）

        Returns:
            更新されたエンティティまたはNone
        """
        db_obj = self.get_by_id(db, id, user_id)

        if db_obj is None:
            return None

        update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: int, user_id: Optional[int] = None) -> bool:
        """
        エンティティを削除

        Args:
            db: データベースセッション
            id: エンティティID
            user_id: ユーザーID（指定した場合、ユーザーに属するものだけ削除）

        Returns:
            削除成功時True、エンティティが見つからない場合False
        """
        db_obj = self.get_by_id(db, id, user_id)

        if db_obj is None:
            return False

        db.delete(db_obj)
        db.commit()
        return True
