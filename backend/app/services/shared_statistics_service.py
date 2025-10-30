import secrets
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.shared_statistics import SharedStatistics
from app.schemas.shared_statistics import SharedStatisticsCreate
from app.services.base.base_service import BaseService


class SharedStatisticsService(
    BaseService[SharedStatistics, SharedStatisticsCreate, None]
):
    def __init__(self):
        super().__init__(SharedStatistics)

    def create_shared_statistics(
        self, db: Session, user_id: int, shared_stats_in: SharedStatisticsCreate
    ) -> SharedStatistics:
        """
        共有統計エントリを作成し、ユニークな共有IDを生成します。
        """
        share_id = secrets.token_urlsafe(
            16
        )  # Generate a URL-safe text string, 16 bytes for good randomness

        db_obj = SharedStatistics(
            share_id=share_id,
            user_id=user_id,
            year=shared_stats_in.year,
            month=shared_stats_in.month,
            game_mode=shared_stats_in.game_mode,
            expires_at=shared_stats_in.expires_at,
            created_at=datetime.now(timezone.utc),
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_share_id(self, db: Session, share_id: str) -> Optional[SharedStatistics>:
        """共有IDで共有リンクを取得。"""
        return (
            db.query(SharedStatistics)
            .options(joinedload(SharedStatistics.user))
            .filter(SharedStatistics.share_id == share_id)
            .first()
        )

    def delete_shared_statistics(
        self, db: Session, share_id: str, user_id: int
    ) -> bool:
        """
        共有IDに基づいて共有統計エントリを削除します。
        ユーザーIDが一致する場合のみ削除を許可します。
        """
        db_obj = (
            db.query(SharedStatistics)
            .filter(
                SharedStatistics.share_id == share_id,
                SharedStatistics.user_id == user_id,
            )
            .first()
        )
        if db_obj:
            db.delete(db_obj)
            db.commit()
            return True
        return False


shared_statistics_service = SharedStatisticsService()
