"""デュエルサービス。

デュエルに関するビジネスロジックを提供。
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.models.duel import Duel
from app.schemas.duel import DuelCreate, DuelUpdate
from app.services.base import BaseService
from app.utils.query_builders import apply_duel_filters


class DuelService(BaseService[Duel, DuelCreate, DuelUpdate]):
    """デュエルサービスクラス。"""

    def __init__(self):
        """DuelServiceのコンストラクタ。"""
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
        game_mode: Optional[str] = None,
        opponent_deck_id: Optional[int] = None,
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
    ) -> List[Duel]:
        """ユーザーのデュエルを取得（フィルタリング可能）。"""
        query = db.query(Duel).options(
            joinedload(Duel.deck), joinedload(Duel.opponent_deck)
        )
        query = apply_duel_filters(
            query,
            user_id=user_id,
            game_mode=game_mode,
            year=year,
            month=month,
            deck_id=deck_id,
            opponent_deck_id=opponent_deck_id,
        )

        if start_date is not None:
            query = query.filter(Duel.played_date >= start_date)

        if end_date is not None:
            query = query.filter(Duel.played_date <= end_date)

        duels = query.order_by(Duel.played_date.desc()).all()

        if range_start is not None or range_end is not None:
            start_index = max(0, (range_start or 1) - 1)
            end_index = range_end if range_end is not None else len(duels)
            duels = duels[start_index:end_index]

        return duels

    def create_user_duel(self, db: Session, user_id: int, duel_in: DuelCreate) -> Duel:
        """ユーザーのデュエルを作成。"""
        return self.create(db, duel_in, user_id=user_id)

    def get_win_rate(
        self, db: Session, user_id: int, deck_id: Optional[int] = None
    ) -> float:
        """勝率を計算。"""
        query = db.query(Duel).filter(Duel.user_id == user_id)

        if deck_id is not None:
            query = query.filter(Duel.deck_id == deck_id)

        total_duels = query.count()

        if total_duels == 0:
            return 0.0

        wins = query.filter(Duel.is_win).count()

        return wins / total_duels

    def get_latest_duel_values(self, db: Session, user_id: int) -> dict:
        """ユーザーの各ゲームモードにおける最新のランク、レート、DC値を取得。"""
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
                    value_field.isnot(None),  # type: ignore[attr-defined]
                )
                .order_by(Duel.played_date.desc())
                .first()
            )
            if latest_duel:
                latest_values[mode] = {
                    "value": getattr(latest_duel, attr_name),
                    "deck_id": latest_duel.deck_id,
                    "opponent_deck_id": latest_duel.opponent_deck_id,
                }

        # EVENTモードの最新デッキ情報を取得
        latest_event_duel = (
            db.query(Duel)
            .filter(
                Duel.user_id == user_id,
                Duel.game_mode == "EVENT",
            )
            .order_by(Duel.played_date.desc())
            .first()
        )
        if latest_event_duel:
            latest_values["EVENT"] = {
                "value": 0,  # EVENTモードには固有の値がないためダミー値
                "deck_id": latest_event_duel.deck_id,
                "opponent_deck_id": latest_event_duel.opponent_deck_id,
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
        """ユーザーのDuelデータをCSV形式でエクスポート。"""
        from app.services.csv_service import csv_service

        return csv_service.export_duels_to_csv(
            db, user_id, year, month, game_mode, columns
        )

    def import_duels_from_csv(
        self, db: Session, user_id: int, csv_content: str
    ) -> dict:
        """CSV形式のデータからDuelをインポート。"""
        from app.services.csv_service import csv_service

        return csv_service.import_duels_from_csv(db, user_id, csv_content)


# シングルトンインスタンス
duel_service = DuelService()
