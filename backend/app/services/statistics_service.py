"""統計サービス。

統計に関するビジネスロジックを提供。
"""

from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.deck import Deck
from app.models.duel import Duel
from app.utils.datetime_utils import month_range_utc
from app.utils.query_builders import build_base_duels_query


class StatisticsService:
    """統計サービスクラス。"""

    def _build_base_duels_query(
        self, db: Session, user_id: int, game_mode: Optional[str] = None
    ):
        return build_base_duels_query(db, user_id, game_mode)

    def _apply_range_filter(
        self,
        duels: List[Duel],
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
    ) -> List[Duel]:
        """デュエルリストに範囲指定を適用。

        duelsは新しい順にソートされている必要がある。
        """
        filtered = duels

        # 範囲フィルター
        if range_start is not None or range_end is not None:
            start = max(0, (range_start or 1) - 1)  # 1始まりを0始まりに変換
            end = range_end if range_end is not None else len(filtered)
            filtered = filtered[start:end]

        return filtered

    def get_available_decks(
        self,
        db: Session,
        user_id: int,
        year: int,
        month: int,
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
        game_mode: Optional[str] = None,
    ) -> Dict[str, List[Dict[str, Any]]]:
        """指定された期間・範囲に存在するデッキ一覧を取得。"""
        start_utc, end_utc = month_range_utc(year, month)
        query = self._build_base_duels_query(db, user_id, game_mode).filter(
            Duel.played_date >= start_utc, Duel.played_date < end_utc
        )

        # 範囲指定がある場合
        duels = query.order_by(Duel.played_date.desc()).all()
        if range_start is not None or range_end is not None:
            duels = self._apply_range_filter(duels, range_start, range_end)

        # 使用デッキと相手デッキを集計
        my_deck_ids = set()
        opponent_deck_ids = set()

        for duel in duels:
            if duel.deck_id:
                my_deck_ids.add(duel.deck_id)
            if duel.opponent_deck_id:
                opponent_deck_ids.add(duel.opponent_deck_id)

        # デッキ情報を取得（並び順は「月ではなく全期間の対戦数」を基準にする）
        my_decks = []
        if my_deck_ids:
            my_deck_count_query = db.query(Duel.deck_id, func.count(Duel.id)).filter(
                Duel.user_id == user_id, Duel.deck_id.in_(my_deck_ids)
            )
            if game_mode is not None:
                my_deck_count_query = my_deck_count_query.filter(
                    Duel.game_mode == game_mode
                )
            my_deck_counts = dict(my_deck_count_query.group_by(Duel.deck_id).all())

            my_decks_query = (
                db.query(Deck)
                .filter(
                    Deck.user_id == user_id,
                    Deck.id.in_(my_deck_ids),
                    Deck.is_opponent.is_(False),
                )
                .all()
            )
            my_decks = [{"id": deck.id, "name": deck.name} for deck in my_decks_query]
            my_decks.sort(
                key=lambda d: (-my_deck_counts.get(d["id"], 0), d["name"].lower())
            )

        opponent_decks = []
        if opponent_deck_ids:
            opponent_deck_count_query = db.query(
                Duel.opponent_deck_id, func.count(Duel.id)
            ).filter(
                Duel.user_id == user_id,
                Duel.opponent_deck_id.in_(opponent_deck_ids),
            )
            if game_mode is not None:
                opponent_deck_count_query = opponent_deck_count_query.filter(
                    Duel.game_mode == game_mode
                )
            opponent_deck_counts = dict(
                opponent_deck_count_query.group_by(Duel.opponent_deck_id).all()
            )

            opponent_decks_query = (
                db.query(Deck)
                .filter(
                    Deck.user_id == user_id,
                    Deck.id.in_(opponent_deck_ids),
                    Deck.is_opponent.is_(True),
                )
                .all()
            )
            opponent_decks = [
                {"id": deck.id, "name": deck.name} for deck in opponent_decks_query
            ]
            opponent_decks.sort(
                key=lambda d: (-opponent_deck_counts.get(d["id"], 0), d["name"].lower())
            )

        return {"my_decks": my_decks, "opponent_decks": opponent_decks}

    def get_duels_by_month(
        self, db: Session, user_id: int, year: int, month: int
    ) -> List[Duel]:
        """指定された年月におけるユーザーのデュエルリストを取得。"""
        start_utc, end_utc = month_range_utc(year, month)
        duels = (
            db.query(Duel)
            .filter(Duel.user_id == user_id)
            .filter(Duel.played_date >= start_utc, Duel.played_date < end_utc)
            .order_by(Duel.played_date.desc())
            .all()
        )

        # デッキ情報を結合
        deck_ids = list(
            set(
                [d.deck_id for d in duels if d.deck_id]
                + [d.opponent_deck_id for d in duels if d.opponent_deck_id]
            )
        )
        if deck_ids:  # deck_ids が空でない場合のみクエリを実行
            decks = db.query(Deck).filter(Deck.id.in_(deck_ids)).all()
            deck_map = {deck.id: deck for deck in decks}
        else:
            deck_map = {}

        for duel in duels:
            # deck と opponentDeck オブジェクトを設定
            deck_id_value = int(duel.deck_id) if duel.deck_id is not None else None
            opponent_deck_id_value = (
                int(duel.opponent_deck_id)
                if duel.opponent_deck_id is not None
                else None
            )

            duel.deck = deck_map.get(deck_id_value) if deck_id_value else None  # type: ignore[assignment]
            duel.opponent_deck = (
                deck_map.get(opponent_deck_id_value) if opponent_deck_id_value else None  # type: ignore[assignment]
            )

            # deck_name と opponent_deck_name 属性を必ず追加
            duel.deck_name = duel.deck.name if duel.deck else "不明"  # type: ignore[attr-defined]
            duel.opponent_deck_name = duel.opponent_deck.name if duel.opponent_deck else "不明"  # type: ignore[attr-defined]

        return duels


# シングルトンインスタンス
statistics_service = StatisticsService()
