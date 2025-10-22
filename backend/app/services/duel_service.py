"""
デュエルサービス
デュエルに関するビジネスロジックを提供
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.duel import Duel
from app.schemas.duel import DuelCreate, DuelUpdate
from app.services.base import BaseService
from app.utils.query_builders import apply_duel_filters


class DuelService(BaseService[Duel, DuelCreate, DuelUpdate]):
    """デュエルサービスクラス"""

    def __init__(self):
        super().__init__(Duel)

    def get_user_duels(
        self,
        db: Session,
        user_id: int,
        deck_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        year: Optional[int] = None,
        month: Optional[int] = None,
    ) -> List[Duel]:
        """
        ユーザーのデュエルを取得（フィルタリング可能）

        Args:
            db: データベースセッション
            user_id: ユーザーID
            deck_id: デッキID（指定した場合、そのデッキのデュエルのみ）
            start_date: 開始日（指定した場合、この日以降のデュエル）
            end_date: 終了日（指定した場合、この日以前のデュエル）
            year: 年（指定した場合、その年のデュエル）
            month: 月（指定した場合、その月のデュエル）

        Returns:
            デュエルのリスト
        """
        query = db.query(Duel)
        query = apply_duel_filters(
            query, user_id=user_id, year=year, month=month, deck_id=deck_id
        )

        if start_date is not None:
            query = query.filter(Duel.played_date >= start_date)

        if end_date is not None:
            query = query.filter(Duel.played_date <= end_date)

        return query.order_by(Duel.played_date.desc()).all()

    def create_user_duel(self, db: Session, user_id: int, duel_in: DuelCreate) -> Duel:
        """
        ユーザーのデュエルを作成

        Args:
            db: データベースセッション
            user_id: ユーザーID
            duel_in: デュエル作成スキーマ

        Returns:
            作成されたデュエル
        """
        return self.create(db, duel_in, user_id=user_id)

    def get_win_rate(
        self, db: Session, user_id: int, deck_id: Optional[int] = None
    ) -> float:
        """
        勝率を計算

        Args:
            db: データベースセッション
            user_id: ユーザーID
            deck_id: デッキID（指定した場合、そのデッキの勝率）

        Returns:
            勝率（0.0〜1.0）、デュエルがない場合は0.0
        """
        query = db.query(Duel).filter(Duel.user_id == user_id)

        if deck_id is not None:
            query = query.filter(Duel.deck_id == deck_id)

        total_duels = query.count()

        if total_duels == 0:
            return 0.0

        wins = query.filter(Duel.result).count()

        return wins / total_duels

    def get_latest_duel_values(self, db: Session, user_id: int) -> dict:
        """
        ユーザーの各ゲームモードにおける最新のランク、レート、DC値を取得
        """
        latest_values = {}

        # ゲームモード別の設定
        game_mode_configs = [
            ("RANK", Duel.rank, "rank"),
            ("RATE", Duel.rate_value, "rate_value"),
            ("DC", Duel.dc_value, "dc_value"),
        ]

        for mode, value_field, attr_name in game_mode_configs:
            latest_duel = (
                db.query(Duel)
                .filter(
                    Duel.user_id == user_id,
                    Duel.game_mode == mode,
                    value_field.isnot(None),
                )
                .order_by(Duel.played_date.desc())
                .first()
            )
            if latest_duel:
                latest_values[mode] = {
                    "value": getattr(latest_duel, attr_name),
                    "deck_id": latest_duel.deck_id,
                    "opponentDeck_id": latest_duel.opponentDeck_id,
                }

        return latest_values

    def export_duels_to_csv(
        self,
        db: Session,
        user_id: int,
        year: Optional[int] = None,
        month: Optional[int] = None,
        game_mode: Optional[str] = None,
        columns: Optional[List[str]] = None,
    ) -> str:
        """
        ユーザーのDuelデータをCSV形式でエクスポート

        Args:
            db: データベースセッション
            user_id: ユーザーID
            year: 年
            month: 月
            game_mode: ゲームモード
            columns: エクスポートするカラムのリスト

        Returns:
            CSV形式の文字列（UTF-8 BOM付き）
        """
        from app.services.csv_service import csv_service

        return csv_service.export_duels_to_csv(db, user_id, year, month, game_mode, columns)

    def import_duels_from_csv(
        self, db: Session, user_id: int, csv_content: str
    ) -> dict:
        """
        CSV形式のデータからDuelをインポート

        Args:
            db: データベースセッション
            user_id: ユーザーID
            csv_content: CSV形式の文字列

        Returns:
            インポート結果の辞書 {'created': 作成数, 'skipped': スキップ数, 'errors': エラーリスト}
        """
        from app.services.csv_service import csv_service

        return csv_service.import_duels_from_csv(db, user_id, csv_content)


# シングルトンインスタンス
duel_service = DuelService()
