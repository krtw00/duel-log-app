"""管理者向けユーザー管理サービス"""

import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.deck import Deck
from app.models.duel import Duel
from app.models.shared_statistics import SharedStatistics
from app.models.user import User
from app.schemas.admin import (
    PasswordResetResponse,
    UpdateUserStatusResponse,
    UserDetailResponse,
    UserFeatureUsage,
    UserStatsDetail,
)

logger = logging.getLogger(__name__)


class AdminUserService:
    """管理者向けユーザー管理サービス"""

    VALID_STATUSES = {"active", "suspended", "deleted"}

    def __init__(self, db: Session):
        self.db = db

    def get_user_detail(self, user_id: int) -> Optional[UserDetailResponse]:
        """ユーザー詳細情報を取得"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # 統計情報を集計
        stats = self._get_user_stats(user_id)

        # 機能利用状況を取得
        feature_usage = self._get_feature_usage(user)

        return UserDetailResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            is_admin=user.is_admin,
            status=getattr(user, "status", "active"),
            status_reason=getattr(user, "status_reason", None),
            createdat=user.createdat,
            updatedat=user.updatedat,
            last_login_at=getattr(user, "last_login_at", None),
            theme_preference=user.theme_preference,
            streamer_mode=user.streamer_mode,
            enable_screen_analysis=user.enable_screen_analysis,
            stats=stats,
            feature_usage=feature_usage,
        )

    def _get_user_stats(self, user_id: int) -> UserStatsDetail:
        """ユーザーの利用統計を取得"""
        # 総対戦数
        total_duels = (
            self.db.query(func.count(Duel.id)).filter(Duel.user_id == user_id).scalar()
            or 0
        )

        # 今月の対戦数
        now = datetime.now(timezone.utc)
        first_day_of_month = now.replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        this_month_duels = (
            self.db.query(func.count(Duel.id))
            .filter(
                Duel.user_id == user_id,
                Duel.played_date >= first_day_of_month,
            )
            .scalar()
            or 0
        )

        # 勝敗数
        total_wins = (
            self.db.query(func.count(Duel.id))
            .filter(Duel.user_id == user_id, Duel.is_win == True)  # noqa: E712
            .scalar()
            or 0
        )
        total_losses = total_duels - total_wins

        # 勝率
        win_rate = (total_wins / total_duels * 100) if total_duels > 0 else 0.0

        # デッキ数
        player_decks_count = (
            self.db.query(func.count(Deck.id))
            .filter(Deck.user_id == user_id, Deck.is_opponent == False)  # noqa: E712
            .scalar()
            or 0
        )
        opponent_decks_count = (
            self.db.query(func.count(Deck.id))
            .filter(Deck.user_id == user_id, Deck.is_opponent == True)  # noqa: E712
            .scalar()
            or 0
        )

        # 共有統計数
        shared_statistics_count = (
            self.db.query(func.count(SharedStatistics.id))
            .filter(SharedStatistics.user_id == user_id)
            .scalar()
            or 0
        )

        return UserStatsDetail(
            total_duels=total_duels,
            this_month_duels=this_month_duels,
            total_wins=total_wins,
            total_losses=total_losses,
            win_rate=round(win_rate, 2),
            player_decks_count=player_decks_count,
            opponent_decks_count=opponent_decks_count,
            shared_statistics_count=shared_statistics_count,
        )

    def _get_feature_usage(self, user: User) -> UserFeatureUsage:
        """ユーザーの機能利用状況を取得"""
        # 共有統計使用
        has_shared_statistics = (
            self.db.query(func.count(SharedStatistics.id))
            .filter(SharedStatistics.user_id == user.id)
            .scalar()
            or 0
        ) > 0

        return UserFeatureUsage(
            has_shared_statistics=has_shared_statistics,
            has_streamer_mode=user.streamer_mode,
            has_screen_analysis=user.enable_screen_analysis,
        )

    def update_user_status(
        self, user_id: int, new_status: str, reason: Optional[str] = None
    ) -> Optional[UpdateUserStatusResponse]:
        """ユーザーのアカウント状態を更新"""
        if new_status not in self.VALID_STATUSES:
            return None

        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        user.status = new_status
        user.status_reason = reason

        self.db.commit()
        self.db.refresh(user)

        logger.info(f"User {user_id} status updated to {new_status}")

        # 詳細情報を再取得
        user_detail = self.get_user_detail(user_id)

        status_messages = {
            "active": "ユーザーを有効化しました",
            "suspended": "ユーザーを停止しました",
            "deleted": "ユーザーを削除扱いにしました",
        }

        return UpdateUserStatusResponse(
            success=True,
            message=status_messages.get(new_status, "状態を更新しました"),
            user=user_detail,
        )

    async def reset_user_password(self, user_id: int) -> PasswordResetResponse:
        """ユーザーのパスワードリセットメールを送信"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return PasswordResetResponse(
                success=False, message="ユーザーが見つかりません"
            )

        if not user.email:
            return PasswordResetResponse(
                success=False, message="ユーザーにメールアドレスが設定されていません"
            )

        # Service Role Keyがない場合
        if not settings.SUPABASE_SERVICE_ROLE_KEY:
            return PasswordResetResponse(
                success=False,
                message="SUPABASE_SERVICE_ROLE_KEYが設定されていません",
            )

        # Supabase Admin APIを使用してパスワードリセットメールを送信
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.SUPABASE_URL}/auth/v1/admin/generate-link",
                    headers={
                        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "type": "recovery",
                        "email": user.email,
                        "redirect_to": f"{settings.FRONTEND_URL}/reset-password",
                    },
                    timeout=30.0,
                )

                if response.status_code == 200:
                    logger.info(f"Password reset email sent for user {user_id}")
                    return PasswordResetResponse(
                        success=True,
                        message=f"パスワードリセットメールを {user.email} に送信しました",
                    )
                else:
                    logger.error(
                        f"Failed to send password reset email: {response.status_code} - {response.text}"
                    )
                    return PasswordResetResponse(
                        success=False,
                        message=f"パスワードリセットメールの送信に失敗しました: {response.status_code}",
                    )

        except Exception as e:
            logger.error(f"Error sending password reset email: {str(e)}")
            return PasswordResetResponse(
                success=False, message=f"エラーが発生しました: {str(e)}"
            )
