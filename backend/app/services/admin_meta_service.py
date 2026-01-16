"""管理者向けメタ分析サービス"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import Integer, func
from sqlalchemy.orm import Session

from app.models.deck import Deck
from app.models.duel import Duel
from app.schemas.admin import (
    DeckRanking,
    DeckTrendEntry,
    DeckTrendsResponse,
    GameModeStatDetail,
    GameModeStatsDetailResponse,
    PopularDecksResponse,
)

logger = logging.getLogger(__name__)


class AdminMetaService:
    """管理者向けメタ分析サービス"""

    def __init__(self, db: Session):
        self.db = db

    def get_popular_decks(
        self,
        days: int = 30,
        game_mode: Optional[str] = None,
        min_usage: int = 5,
        limit: int = 20,
    ) -> PopularDecksResponse:
        """人気デッキランキングを取得

        Args:
            days: 対象期間（日数）、0の場合は全期間
            game_mode: ゲームモードでフィルタ（RANK, RATE, EVENT, DC）
            min_usage: 最小使用回数
            limit: 取得件数上限

        Returns:
            人気デッキランキング
        """
        # 期間設定
        now = datetime.now(timezone.utc)
        period_start = None
        period_end = now

        # ベースクエリ
        query = self.db.query(
            Deck.name,
            func.count(Duel.id).label("usage_count"),
            func.sum(func.cast(Duel.is_win == False, Integer)).label("win_count"),  # noqa: E712
        ).join(Duel, Duel.opponent_deck_id == Deck.id)

        # 期間フィルタ
        if days > 0:
            period_start = now - timedelta(days=days)
            query = query.filter(Duel.played_date >= period_start)

        # ゲームモードフィルタ
        if game_mode:
            query = query.filter(Duel.game_mode == game_mode)

        # グループ化と最小使用回数フィルタ
        query = (
            query.group_by(Deck.name)
            .having(func.count(Duel.id) >= min_usage)
            .order_by(func.count(Duel.id).desc())
            .limit(limit)
        )

        # 結果を取得
        results = query.all()

        # ランキングを生成
        decks = []
        for idx, row in enumerate(results, 1):
            deck_name = row[0]
            usage_count = row[1]

            # 相手デッキとしての勝敗（ユーザー視点で相手が使ったデッキ）
            # is_win=Trueはユーザーの勝利=相手デッキの敗北
            # 相手デッキの勝率を計算するため、is_win=Falseの数が相手デッキの勝利数
            win_query = self.db.query(func.count(Duel.id)).join(
                Deck, Duel.opponent_deck_id == Deck.id
            ).filter(
                Deck.name == deck_name,
                Duel.is_win == False,  # noqa: E712
            )

            if days > 0:
                win_query = win_query.filter(Duel.played_date >= period_start)
            if game_mode:
                win_query = win_query.filter(Duel.game_mode == game_mode)

            win_count = win_query.scalar() or 0
            loss_count = usage_count - win_count
            win_rate = (win_count / usage_count * 100) if usage_count > 0 else 0.0

            decks.append(
                DeckRanking(
                    rank=idx,
                    deck_name=deck_name,
                    usage_count=usage_count,
                    win_count=win_count,
                    loss_count=loss_count,
                    win_rate=round(win_rate, 2),
                )
            )

        # 総対戦数
        total_query = self.db.query(func.count(Duel.id))
        if days > 0:
            total_query = total_query.filter(Duel.played_date >= period_start)
        if game_mode:
            total_query = total_query.filter(Duel.game_mode == game_mode)
        total_duels = total_query.scalar() or 0

        return PopularDecksResponse(
            decks=decks,
            total_duels=total_duels,
            period_start=period_start,
            period_end=period_end,
        )

    def get_deck_trends(
        self,
        days: int = 30,
        interval: str = "daily",
        game_mode: Optional[str] = None,
        top_n: int = 5,
    ) -> DeckTrendsResponse:
        """デッキ使用率推移を取得

        Args:
            days: 対象期間（日数）
            interval: 集計間隔（daily, weekly）
            game_mode: ゲームモードでフィルタ
            top_n: 上位N件のデッキを表示

        Returns:
            デッキ使用率推移
        """
        now = datetime.now(timezone.utc)
        period_start = now - timedelta(days=days)

        # まず上位デッキを特定
        top_decks_query = (
            self.db.query(
                Deck.name,
                func.count(Duel.id).label("usage_count"),
            )
            .join(Duel, Duel.opponent_deck_id == Deck.id)
            .filter(Duel.played_date >= period_start)
        )

        if game_mode:
            top_decks_query = top_decks_query.filter(Duel.game_mode == game_mode)

        top_decks_query = (
            top_decks_query.group_by(Deck.name)
            .order_by(func.count(Duel.id).desc())
            .limit(top_n)
        )

        top_decks = [row[0] for row in top_decks_query.all()]

        if not top_decks:
            return DeckTrendsResponse(trends=[], top_decks=[])

        # 日付ごとの集計
        trends = []

        if interval == "weekly":
            # 週単位で集計
            current_date = period_start
            while current_date <= now:
                week_end = current_date + timedelta(days=7)
                date_str = current_date.strftime("%Y-%m-%d")

                # その週の総対戦数を取得
                total_query = self.db.query(func.count(Duel.id)).filter(
                    Duel.played_date >= current_date,
                    Duel.played_date < week_end,
                )
                if game_mode:
                    total_query = total_query.filter(Duel.game_mode == game_mode)
                total_duels = total_query.scalar() or 0

                # 各デッキの使用数を取得
                for deck_name in top_decks:
                    usage_query = (
                        self.db.query(func.count(Duel.id))
                        .join(Deck, Duel.opponent_deck_id == Deck.id)
                        .filter(
                            Deck.name == deck_name,
                            Duel.played_date >= current_date,
                            Duel.played_date < week_end,
                        )
                    )
                    if game_mode:
                        usage_query = usage_query.filter(Duel.game_mode == game_mode)
                    usage_count = usage_query.scalar() or 0

                    usage_rate = (
                        (usage_count / total_duels * 100) if total_duels > 0 else 0.0
                    )

                    trends.append(
                        DeckTrendEntry(
                            date=date_str,
                            deck_name=deck_name,
                            usage_count=usage_count,
                            usage_rate=round(usage_rate, 2),
                        )
                    )

                current_date = week_end
        else:
            # 日単位で集計
            current_date = period_start.replace(hour=0, minute=0, second=0, microsecond=0)
            while current_date <= now:
                next_date = current_date + timedelta(days=1)
                date_str = current_date.strftime("%Y-%m-%d")

                # その日の総対戦数を取得
                total_query = self.db.query(func.count(Duel.id)).filter(
                    Duel.played_date >= current_date,
                    Duel.played_date < next_date,
                )
                if game_mode:
                    total_query = total_query.filter(Duel.game_mode == game_mode)
                total_duels = total_query.scalar() or 0

                # 各デッキの使用数を取得
                for deck_name in top_decks:
                    usage_query = (
                        self.db.query(func.count(Duel.id))
                        .join(Deck, Duel.opponent_deck_id == Deck.id)
                        .filter(
                            Deck.name == deck_name,
                            Duel.played_date >= current_date,
                            Duel.played_date < next_date,
                        )
                    )
                    if game_mode:
                        usage_query = usage_query.filter(Duel.game_mode == game_mode)
                    usage_count = usage_query.scalar() or 0

                    usage_rate = (
                        (usage_count / total_duels * 100) if total_duels > 0 else 0.0
                    )

                    trends.append(
                        DeckTrendEntry(
                            date=date_str,
                            deck_name=deck_name,
                            usage_count=usage_count,
                            usage_rate=round(usage_rate, 2),
                        )
                    )

                current_date = next_date

        return DeckTrendsResponse(trends=trends, top_decks=top_decks)

    def get_game_mode_stats(
        self, days: int = 30
    ) -> GameModeStatsDetailResponse:
        """ゲームモード別統計を取得

        Args:
            days: 対象期間（日数）、0の場合は全期間

        Returns:
            ゲームモード別統計
        """
        now = datetime.now(timezone.utc)

        # ベースクエリ
        query = self.db.query(
            Duel.game_mode,
            func.count(Duel.id).label("duel_count"),
            func.count(func.distinct(Duel.user_id)).label("user_count"),
        )

        # 期間フィルタ
        if days > 0:
            period_start = now - timedelta(days=days)
            query = query.filter(Duel.played_date >= period_start)

        # グループ化
        results = query.group_by(Duel.game_mode).all()

        # 総対戦数を計算
        total_duels = sum(row[1] for row in results)

        # 統計を生成
        stats = []
        game_mode_order = {"RANK": 1, "RATE": 2, "EVENT": 3, "DC": 4}

        for row in sorted(results, key=lambda x: game_mode_order.get(x[0], 99)):
            game_mode = row[0]
            duel_count = row[1]
            user_count = row[2]
            percentage = (duel_count / total_duels * 100) if total_duels > 0 else 0.0

            stats.append(
                GameModeStatDetail(
                    game_mode=game_mode,
                    duel_count=duel_count,
                    user_count=user_count,
                    percentage=round(percentage, 2),
                )
            )

        return GameModeStatsDetailResponse(stats=stats, total_duels=total_duels)
