"""
デッキ分布計算サービス
相手デッキの分布計算に特化したビジネスロジックを提供
"""

from typing import Any, Dict, List, Optional

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.deck import Deck
from app.models.duel import Duel
from app.utils.query_builders import (
    apply_date_range_filter,
    apply_deck_filters,
    apply_range_filter,
    build_base_duels_query,
)


class DeckDistributionService:
    """デッキ分布計算サービスクラス"""

    def _calculate_deck_distribution_from_duels(
        self, duels: List[Duel]
    ) -> List[Dict[str, Any]]:
        """
        対戦記録リストから相手デッキの分布を計算

        相手デッキごとの対戦数とその割合を算出し、出現頻度順にソートします。

        Args:
            duels: 対戦記録のリスト

        Returns:
            相手デッキの分布データのリスト。各要素は以下の構造:
            - deck_name (str): 相手デッキ名
            - count (int): 対戦数
            - percentage (float): 出現率（%）
            出現数の多い順にソート済み

        処理フロー:
            1. 対戦数が0の場合は空リストを返す
            2. 各対戦記録から相手デッキ名を取得してカウント
            3. カウント結果から割合を計算
            4. 出現数の多い順にソート
        """
        total_duels = len(duels)
        if total_duels == 0:
            return []

        # 相手デッキごとの対戦数をカウント
        deck_counts_map = {}
        for duel in duels:
            if duel.opponent_deck and duel.opponent_deck.name:
                deck_name = duel.opponent_deck.name
                deck_counts_map[deck_name] = deck_counts_map.get(deck_name, 0) + 1

        # 分布データを作成（出現数の多い順にソート）
        distribution = [
            {
                "deck_name": name,
                "count": count,
                "percentage": (count / total_duels) * 100,
            }
            for name, count in sorted(
                deck_counts_map.items(), key=lambda x: x[1], reverse=True
            )
        ]
        return distribution

    def get_deck_distribution_monthly(
        self,
        db: Session,
        user_id: int,
        year: int,
        month: int,
        game_mode: Optional[str] = None,
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
        my_deck_id: Optional[int] = None,
        opponent_deck_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        指定された年月の相手デッキ分布を取得

        特定の年月における相手デッキの出現頻度を集計します。
        範囲指定がある場合はメモリ上で処理し、ない場合はデータベースで集計します。

        Args:
            db: データベースセッション
            user_id: ユーザーID
            year: 年（例: 2025）
            month: 月（1-12）
            game_mode: ゲームモード（'RANK', 'RATE', 'EVENT', 'DC'など）でフィルタリング（任意）
            range_start: 範囲の開始位置（1始まり、任意）
            range_end: 範囲の終了位置（1始まり、任意）
            my_deck_id: プレイヤーデッキIDでフィルタリング（任意）
            opponent_deck_id: 相手デッキIDでフィルタリング（任意）

        Returns:
            相手デッキの分布データのリスト。各要素は以下の構造:
            - deck_name (str): 相手デッキ名
            - count (int): 対戦数
            - percentage (float): 出現率（%）
            出現数の多い順にソート済み

        処理フロー:
            1. 年月でフィルタリングしたベースクエリを構築
            2. デッキフィルタを適用
            3. 範囲指定がある場合はメモリ上で処理、ない場合はDB集計
        """
        # 共通クエリビルダーを使用してベースクエリを構築
        base_query = build_base_duels_query(db, user_id, game_mode)

        # 年月フィルタを適用
        base_query = apply_date_range_filter(base_query, year, month)

        # デッキフィルタを適用
        base_query = apply_deck_filters(base_query, my_deck_id, opponent_deck_id)

        # 範囲指定がある場合
        if range_start is not None or range_end is not None:
            duels = base_query.order_by(Duel.played_date.desc()).all()
            duels = apply_range_filter(duels, range_start, range_end)
            return self._calculate_deck_distribution_from_duels(duels)
        else:
            # 通常のクエリベースの集計
            filtered_query = base_query
            total_duels = filtered_query.with_entities(func.count(Duel.id)).scalar()

            if total_duels == 0:
                return []

            deck_counts = (
                filtered_query.join(Deck, Duel.opponentDeck_id == Deck.id)
                .group_by(Deck.name)
                .with_entities(Deck.name, func.count(Duel.id).label("count"))
                .order_by(desc("count"))
                .all()
            )

            distribution = [
                {
                    "deck_name": name,
                    "count": count,
                    "percentage": (count / total_duels) * 100 if total_duels > 0 else 0,
                }
                for name, count in deck_counts
            ]
            return distribution

    def get_deck_distribution_recent(
        self,
        db: Session,
        user_id: int,
        limit: int = 30,
        game_mode: Optional[str] = None,
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
        my_deck_id: Optional[int] = None,
        opponent_deck_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        直近N戦の相手デッキ分布を取得

        最新の対戦記録から指定された件数分の相手デッキ分布を集計します。

        Args:
            db: データベースセッション
            user_id: ユーザーID
            limit: 取得する対戦数（デフォルト: 30）
            game_mode: ゲームモード（'RANK', 'RATE', 'EVENT', 'DC'など）でフィルタリング（任意）
            range_start: 範囲の開始位置（1始まり、任意）
            range_end: 範囲の終了位置（1始まり、任意）
            my_deck_id: プレイヤーデッキIDでフィルタリング（任意）
            opponent_deck_id: 相手デッキIDでフィルタリング（任意）

        Returns:
            相手デッキの分布データのリスト。各要素は以下の構造:
            - deck_name (str): 相手デッキ名
            - count (int): 対戦数
            - percentage (float): 出現率（%）
            出現数の多い順にソート済み

        処理フロー:
            1. ベースクエリを構築してデッキフィルタを適用
            2. 日付降順でソート
            3. 範囲指定がある場合は範囲フィルタを適用、ない場合はlimit件取得
            4. 相手デッキの分布を計算
        """
        # 共通クエリビルダーを使用してベースクエリを構築
        query = build_base_duels_query(db, user_id, game_mode)

        # デッキフィルタを適用
        query = apply_deck_filters(query, my_deck_id, opponent_deck_id)

        # 範囲指定がある場合
        if range_start is not None or range_end is not None:
            duels = query.order_by(Duel.played_date.desc()).all()
            duels = apply_range_filter(duels, range_start, range_end)
            return self._calculate_deck_distribution_from_duels(duels)
        else:
            duels = (
                query.order_by(Duel.played_date.desc())
                .limit(limit)
                .all()
            )
            return self._calculate_deck_distribution_from_duels(duels)


# シングルトンインスタンス
deck_distribution_service = DeckDistributionService()
