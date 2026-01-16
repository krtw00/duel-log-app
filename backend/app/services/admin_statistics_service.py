"""
管理者用統計サービス

システム全体の統計情報を集計するサービス
"""

from datetime import datetime, timedelta
from typing import List, Tuple

from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.models.deck import Deck
from app.models.duel import Duel
from app.models.shared_statistics import SharedStatistics
from app.models.user import User
from app.schemas.admin import (
    DeckStats,
    DuelStats,
    DuelsTimelineResponse,
    GameModeStats,
    RegistrationEntry,
    StatisticsOverviewResponse,
    TimelineEntry,
    UserRegistrationsResponse,
    UserStats,
)


class AdminStatisticsService:
    """管理者用統計サービス"""

    def __init__(self, db: Session):
        self.db = db

    def get_overview(self) -> StatisticsOverviewResponse:
        """
        統計概要を取得

        Returns:
            StatisticsOverviewResponse: 統計概要
        """
        now = datetime.utcnow()
        first_day_of_month = now.replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )

        # ユーザー統計
        user_stats = self._get_user_stats(first_day_of_month)

        # デッキ統計
        deck_stats = self._get_deck_stats()

        # 対戦統計
        duel_stats = self._get_duel_stats(first_day_of_month)

        return StatisticsOverviewResponse(
            users=user_stats,
            decks=deck_stats,
            duels=duel_stats,
        )

    def _get_user_stats(self, first_day_of_month: datetime) -> UserStats:
        """ユーザー統計を取得"""
        # 総ユーザー数
        total = self.db.query(func.count(User.id)).scalar() or 0

        # 今月の新規ユーザー数
        new_this_month = (
            self.db.query(func.count(User.id))
            .filter(User.createdat >= first_day_of_month)
            .scalar()
            or 0
        )

        # 今月のアクティブユーザー数（対戦記録を追加したユーザー）
        active_this_month = (
            self.db.query(func.count(func.distinct(Duel.user_id)))
            .filter(Duel.played_date >= first_day_of_month)
            .scalar()
            or 0
        )

        return UserStats(
            total=total,
            new_this_month=new_this_month,
            active_this_month=active_this_month,
        )

    def _get_deck_stats(self) -> DeckStats:
        """デッキ統計を取得"""
        # アクティブデッキ数
        active = (
            self.db.query(func.count(Deck.id)).filter(Deck.active == True).scalar() or 0  # noqa: E712
        )

        # アーカイブデッキ数
        archived = (
            self.db.query(func.count(Deck.id)).filter(Deck.active == False).scalar()  # noqa: E712
            or 0
        )

        # プレイヤーデッキ数
        player_decks = (
            self.db.query(func.count(Deck.id))
            .filter(Deck.is_opponent == False)  # noqa: E712
            .scalar()
            or 0
        )

        # 相手デッキ数
        opponent_decks = (
            self.db.query(func.count(Deck.id)).filter(Deck.is_opponent == True).scalar()  # noqa: E712
            or 0
        )

        return DeckStats(
            active=active,
            archived=archived,
            player_decks=player_decks,
            opponent_decks=opponent_decks,
        )

    def _get_duel_stats(self, first_day_of_month: datetime) -> DuelStats:
        """対戦統計を取得"""
        # 総対戦数
        total = self.db.query(func.count(Duel.id)).scalar() or 0

        # 今月の対戦数
        this_month = (
            self.db.query(func.count(Duel.id))
            .filter(Duel.played_date >= first_day_of_month)
            .scalar()
            or 0
        )

        # ゲームモード別対戦数
        game_mode_counts = (
            self.db.query(Duel.game_mode, func.count(Duel.id))
            .group_by(Duel.game_mode)
            .all()
        )

        by_game_mode = GameModeStats()
        for mode, count in game_mode_counts:
            if mode == "RANK":
                by_game_mode.RANK = count
            elif mode == "RATE":
                by_game_mode.RATE = count
            elif mode == "EVENT":
                by_game_mode.EVENT = count
            elif mode == "DC":
                by_game_mode.DC = count

        return DuelStats(
            total=total,
            this_month=this_month,
            by_game_mode=by_game_mode,
        )

    def get_duels_timeline(
        self, period: str = "daily", days: int = 30
    ) -> DuelsTimelineResponse:
        """
        対戦数の推移を取得

        Args:
            period: daily or monthly
            days: 取得する日数（最大365）

        Returns:
            DuelsTimelineResponse: 対戦数推移
        """
        days = min(days, 365)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        if period == "daily":
            timeline = self._get_daily_duels_timeline(start_date, end_date)
        else:
            timeline = self._get_monthly_duels_timeline(start_date, end_date)

        return DuelsTimelineResponse(timeline=timeline)

    def _get_daily_duels_timeline(
        self, start_date: datetime, end_date: datetime
    ) -> List[TimelineEntry]:
        """日別の対戦数を取得"""
        results = (
            self.db.query(
                func.date(Duel.played_date).label("date"),
                func.count(Duel.id).label("count"),
            )
            .filter(Duel.played_date >= start_date, Duel.played_date <= end_date)
            .group_by(func.date(Duel.played_date))
            .order_by(func.date(Duel.played_date))
            .all()
        )

        # 結果をマップに変換
        result_map = {str(row.date): row.count for row in results}

        # 全日付を埋める
        timeline = []
        current_date = start_date.date()
        end_date_only = end_date.date()
        while current_date <= end_date_only:
            date_str = str(current_date)
            count = result_map.get(date_str, 0)
            timeline.append(TimelineEntry(date=date_str, count=count))
            current_date += timedelta(days=1)

        return timeline

    def _get_monthly_duels_timeline(
        self, start_date: datetime, end_date: datetime
    ) -> List[TimelineEntry]:
        """月別の対戦数を取得"""
        results = (
            self.db.query(
                extract("year", Duel.played_date).label("year"),
                extract("month", Duel.played_date).label("month"),
                func.count(Duel.id).label("count"),
            )
            .filter(Duel.played_date >= start_date, Duel.played_date <= end_date)
            .group_by(extract("year", Duel.played_date), extract("month", Duel.played_date))
            .order_by(extract("year", Duel.played_date), extract("month", Duel.played_date))
            .all()
        )

        return [
            TimelineEntry(date=f"{int(row.year)}-{int(row.month):02d}", count=row.count)
            for row in results
        ]

    def get_user_registrations(self, months: int = 12) -> UserRegistrationsResponse:
        """
        ユーザー登録数の推移を取得

        Args:
            months: 取得する月数（最大24）

        Returns:
            UserRegistrationsResponse: ユーザー登録数推移
        """
        months = min(months, 24)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=months * 30)

        results = (
            self.db.query(
                extract("year", User.createdat).label("year"),
                extract("month", User.createdat).label("month"),
                func.count(User.id).label("count"),
            )
            .filter(User.createdat >= start_date)
            .group_by(extract("year", User.createdat), extract("month", User.createdat))
            .order_by(extract("year", User.createdat), extract("month", User.createdat))
            .all()
        )

        registrations = [
            RegistrationEntry(
                month=f"{int(row.year)}-{int(row.month):02d}", count=row.count
            )
            for row in results
        ]

        return UserRegistrationsResponse(registrations=registrations)

    # ========================================
    # メンテナンス機能
    # ========================================

    def scan_orphaned_opponent_decks(self) -> int:
        """
        対戦履歴が存在しない相手デッキをスキャン

        Returns:
            孤立した相手デッキの数
        """
        # 対戦履歴で使われているデッキIDのサブクエリ
        # opponent_deck_id と deck_id の両方をチェック（データ不整合対策）
        used_as_opponent = self.db.query(Duel.opponent_deck_id).distinct()
        used_as_player = self.db.query(Duel.deck_id).distinct()

        # どちらからも参照されていない相手デッキをカウント
        orphaned_count = (
            self.db.query(func.count(Deck.id))
            .filter(
                Deck.is_opponent == True,  # noqa: E712
                ~Deck.id.in_(used_as_opponent),
                ~Deck.id.in_(used_as_player),
            )
            .scalar()
            or 0
        )

        return orphaned_count

    def cleanup_orphaned_opponent_decks(self) -> int:
        """
        対戦履歴が存在しない相手デッキを削除

        Returns:
            削除したデッキの数
        """
        # 対戦履歴で使われているデッキIDのサブクエリ
        # opponent_deck_id と deck_id の両方をチェック（データ不整合対策）
        used_as_opponent = self.db.query(Duel.opponent_deck_id).distinct()
        used_as_player = self.db.query(Duel.deck_id).distinct()

        # どちらからも参照されていない相手デッキを取得
        orphaned_decks = (
            self.db.query(Deck)
            .filter(
                Deck.is_opponent == True,  # noqa: E712
                ~Deck.id.in_(used_as_opponent),
                ~Deck.id.in_(used_as_player),
            )
            .all()
        )

        deleted_count = len(orphaned_decks)

        # 削除
        for deck in orphaned_decks:
            self.db.delete(deck)

        self.db.commit()
        return deleted_count

    def scan_orphaned_shared_urls(self) -> int:
        """
        孤立した共有URLをスキャン（ユーザー削除後に残存）

        Note: 通常はCASCADE DELETEで削除されるため、
        この関数は過去データや異常系の対応用

        Returns:
            孤立した共有URLの数
        """
        # 存在するユーザーIDのサブクエリ
        existing_user_ids = self.db.query(User.id).distinct()

        # 存在しないユーザーの共有URLをカウント
        orphaned_count = (
            self.db.query(func.count(SharedStatistics.id))
            .filter(~SharedStatistics.user_id.in_(existing_user_ids))
            .scalar()
            or 0
        )

        return orphaned_count

    def cleanup_orphaned_shared_urls(self) -> int:
        """
        孤立した共有URLを削除

        Returns:
            削除した共有URLの数
        """
        # 存在するユーザーIDのサブクエリ
        existing_user_ids = self.db.query(User.id).distinct()

        # 存在しないユーザーの共有URLを取得
        orphaned_urls = (
            self.db.query(SharedStatistics)
            .filter(~SharedStatistics.user_id.in_(existing_user_ids))
            .all()
        )

        deleted_count = len(orphaned_urls)

        # 削除
        for url in orphaned_urls:
            self.db.delete(url)

        self.db.commit()
        return deleted_count

    def scan_expired_shared_urls(self) -> Tuple[int, datetime | None]:
        """
        期限切れの共有URLをスキャン

        Returns:
            (期限切れの数, 最古の期限切れ日時)
        """
        now = datetime.utcnow()

        # 期限切れの共有URLをカウント
        expired_count = (
            self.db.query(func.count(SharedStatistics.id))
            .filter(
                SharedStatistics.expires_at.isnot(None),
                SharedStatistics.expires_at < now,
            )
            .scalar()
            or 0
        )

        # 最古の期限切れ日時を取得
        oldest_expired = None
        if expired_count > 0:
            oldest = (
                self.db.query(func.min(SharedStatistics.expires_at))
                .filter(
                    SharedStatistics.expires_at.isnot(None),
                    SharedStatistics.expires_at < now,
                )
                .scalar()
            )
            oldest_expired = oldest

        return expired_count, oldest_expired

    def cleanup_expired_shared_urls(self) -> int:
        """
        期限切れの共有URLを削除

        Returns:
            削除した共有URLの数
        """
        now = datetime.utcnow()

        # 期限切れの共有URLを取得
        expired_urls = (
            self.db.query(SharedStatistics)
            .filter(
                SharedStatistics.expires_at.isnot(None),
                SharedStatistics.expires_at < now,
            )
            .all()
        )

        deleted_count = len(expired_urls)

        # 削除
        for url in expired_urls:
            self.db.delete(url)

        self.db.commit()
        return deleted_count
