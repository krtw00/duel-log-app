"""
総合統計サービス
全体、月次、直近などの総合的な統計に関するビジネスロジックを提供
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.duel import Duel
from app.utils.query_builders import apply_date_range_filter, build_base_duels_query


class GeneralStatsService:
    """総合統計サービスクラス"""

    def _calculate_general_stats(self, duels: List[Duel]) -> Dict[str, Any]:
        """
        対戦記録のリストから総合統計情報を計算

        総対戦数、勝率、先攻/後攻時の勝率、コイントス勝率、先攻率を算出します。

        Args:
            duels: 対戦記録のリスト

        Returns:
            以下のキーを持つ統計情報の辞書:
            - total_duels (int): 総対戦数
            - win_count (int): 総勝利数
            - lose_count (int): 総敗北数
            - win_rate (float): 総合勝率（%）
            - first_turn_win_rate (float): 先攻時の勝率（%）
            - second_turn_win_rate (float): 後攻時の勝率（%）
            - coin_win_rate (float): コイントス勝率（%）
            - go_first_rate (float): 先攻になった確率（%）

        処理フロー:
            1. 総対戦数をカウント（0の場合は全ての値を0で返す）
            2. 総合勝敗数と勝率を計算
            3. 先攻/後攻別に分けて各勝率を計算
            4. コイントス勝率を計算
            5. 先攻率を計算
        """
        total_duels = len(duels)

        # 対戦数が0の場合は全ての統計を0で返す
        if total_duels == 0:
            return {
                "total_duels": 0,
                "win_count": 0,
                "lose_count": 0,
                "win_rate": 0,
                "first_turn_win_rate": 0,
                "second_turn_win_rate": 0,
                "coin_win_rate": 0,
                "go_first_rate": 0,
            }

        # 総合勝敗数と勝率を計算
        win_count = sum(1 for d in duels if d.result is True)
        lose_count = total_duels - win_count
        win_rate = (win_count / total_duels) * 100 if total_duels > 0 else 0

        # 先攻・後攻の対戦をそれぞれ抽出
        # first_or_second: True = 先攻, False = 後攻
        first_turn_duels = [d for d in duels if d.first_or_second is True]
        second_turn_duels = [d for d in duels if d.first_or_second is False]

        # 先攻時の勝率を計算
        first_turn_total = len(first_turn_duels)
        first_turn_wins = sum(1 for d in first_turn_duels if d.result is True)
        first_turn_win_rate = (
            (first_turn_wins / first_turn_total) * 100 if first_turn_total > 0 else 0
        )

        # 後攻時の勝率を計算
        second_turn_total = len(second_turn_duels)
        second_turn_wins = sum(1 for d in second_turn_duels if d.result is True)
        second_turn_win_rate = (
            (second_turn_wins / second_turn_total) * 100
            if second_turn_total > 0
            else 0
        )

        # コイントス勝率を計算（coin: True = 勝ち）
        coin_total = total_duels
        coin_wins = sum(1 for d in duels if d.coin is True)
        coin_win_rate = (coin_wins / coin_total) * 100 if coin_total > 0 else 0

        # 先攻になった確率を計算
        go_first_total = sum(1 for d in duels if d.first_or_second is True)
        go_first_rate = (go_first_total / total_duels) * 100 if total_duels > 0 else 0

        return {
            "total_duels": total_duels,
            "win_count": win_count,
            "lose_count": lose_count,
            "win_rate": win_rate,
            "first_turn_win_rate": first_turn_win_rate,
            "second_turn_win_rate": second_turn_win_rate,
            "coin_win_rate": coin_win_rate,
            "go_first_rate": go_first_rate,
        }

    def get_overall_stats(
        self,
        db: Session,
        user_id: int,
        year: int,
        month: int,
        game_mode: Optional[str] = None,
        start_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        指定された年月の統計情報を取得

        特定の年月における対戦記録を集計し、総合統計と最新の使用デッキ・ランクを返します。

        Args:
            db: データベースセッション
            user_id: ユーザーID
            year: 年（例: 2025）
            month: 月（1-12）
            game_mode: ゲームモード（'RANK', 'RATE', 'EVENT', 'DC'など）でフィルタリング（任意）
            start_id: この ID より大きい対戦記録のみを対象（任意、範囲フィルタリング用）

        Returns:
            以下のキーを持つ統計情報の辞書:
            - total_duels, win_count, lose_count, win_rate, first_turn_win_rate,
              second_turn_win_rate, coin_win_rate, go_first_rate (_calculate_general_statsの戻り値)
            - current_deck (str | None): 最新の使用デッキ名
            - current_rank (str | None): 最新のランク（例: 'MASTER_5'）

        処理フロー:
            1. 年月でフィルタリングしたクエリを構築
            2. ゲームモードとstart_idでさらにフィルタリング
            3. 統計情報を計算
            4. 最新の対戦記録から使用デッキとランクを取得
        """
        # 共通クエリビルダーを使用してベースクエリを構築
        query = build_base_duels_query(db, user_id, game_mode)

        # 年月フィルタを適用
        query = apply_date_range_filter(query, year, month)

        # 範囲フィルタを適用
        if start_id is not None:
            query = query.filter(Duel.id > start_id)

        # 対戦記録を取得して統計を計算
        duels = query.all()
        stats = self._calculate_general_stats(duels)

        # 最新の対戦記録から使用デッキとランクを取得
        latest_duel = query.order_by(Duel.played_date.desc()).first()

        current_deck = None
        current_rank = None
        if latest_duel:
            current_deck = latest_duel.deck.name if latest_duel.deck else None
            current_rank = latest_duel.rank

        return {
            **stats,
            "current_deck": current_deck,
            "current_rank": current_rank,
        }

    def get_all_time_stats(
        self,
        db: Session,
        user_id: int,
        game_mode: Optional[str] = None,
        start_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        全期間の統計情報を取得

        アカウント作成以降の全ての対戦記録を集計します。

        Args:
            db: データベースセッション
            user_id: ユーザーID
            game_mode: ゲームモード（'RANK', 'RATE', 'EVENT', 'DC'など）でフィルタリング（任意）
            start_id: この ID より大きい対戦記録のみを対象（任意、範囲フィルタリング用）

        Returns:
            以下のキーを持つ統計情報の辞書:
            - total_duels, win_count, lose_count, win_rate, first_turn_win_rate,
              second_turn_win_rate, coin_win_rate, go_first_rate (_calculate_general_statsの戻り値)
            - current_deck (str | None): 最新の使用デッキ名
            - current_rank (str | None): 最新のランク（例: 'MASTER_5'）

        処理フロー:
            1. ユーザーの全対戦記録を取得するクエリを構築
            2. ゲームモードとstart_idでフィルタリング
            3. 統計情報を計算
            4. 最新の対戦記録から使用デッキとランクを取得
        """
        # 共通クエリビルダーを使用してベースクエリを構築
        query = build_base_duels_query(db, user_id, game_mode)

        # 範囲フィルタを適用
        if start_id is not None:
            query = query.filter(Duel.id > start_id)

        # 対戦記録を取得して統計を計算
        duels = query.all()
        stats = self._calculate_general_stats(duels)

        # 最新の対戦記録から使用デッキとランクを取得
        latest_duel = query.order_by(Duel.played_date.desc()).first()

        current_deck = None
        current_rank = None
        if latest_duel:
            current_deck = latest_duel.deck.name if latest_duel.deck else None
            current_rank = latest_duel.rank

        return {
            **stats,
            "current_deck": current_deck,
            "current_rank": current_rank,
        }

    def get_recent_stats(
        self,
        db: Session,
        user_id: int,
        limit: int = 30,
        game_mode: Optional[str] = None,
        start_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        直近N戦の統計情報を取得

        最新の対戦記録から指定された件数分を集計します。
        デフォルトでは直近30戦の統計を返します。

        Args:
            db: データベースセッション
            user_id: ユーザーID
            limit: 取得する対戦数（デフォルト: 30）
            game_mode: ゲームモード（'RANK', 'RATE', 'EVENT', 'DC'など）でフィルタリング（任意）
            start_id: この ID より大きい対戦記録のみを対象（任意、範囲フィルタリング用）

        Returns:
            以下のキーを持つ統計情報の辞書:
            - total_duels, win_count, lose_count, win_rate, first_turn_win_rate,
              second_turn_win_rate, coin_win_rate, go_first_rate (_calculate_general_statsの戻り値)
            - current_deck (str | None): 最新の使用デッキ名
            - current_rank (str | None): 最新のランク（例: 'MASTER_5'）

        処理フロー:
            1. ユーザーの対戦記録を取得するクエリを構築
            2. ゲームモードとstart_idでフィルタリング
            3. 日付降順でソートし、指定件数を取得
            4. 統計情報を計算
            5. 最新の対戦記録から使用デッキとランクを取得

        Note:
            日付降順でソート済みのため、duels[0]が最新の対戦記録となります。
        """
        # 共通クエリビルダーを使用してベースクエリを構築
        query = build_base_duels_query(db, user_id, game_mode)

        # 範囲フィルタを適用
        if start_id is not None:
            query = query.filter(Duel.id > start_id)

        # 日付降順で並び替えて直近N戦を取得
        duels = query.order_by(Duel.played_date.desc()).limit(limit).all()
        stats = self._calculate_general_stats(duels)

        # 最新の対戦記録から使用デッキとランクを取得（duelsは既に日付降順）
        current_deck = None
        current_rank = None
        if duels:
            latest_duel = duels[0]  # 既に日付降順なので最初の要素が最新
            current_deck = latest_duel.deck.name if latest_duel.deck else None
            current_rank = latest_duel.rank

        return {
            **stats,
            "current_deck": current_deck,
            "current_rank": current_rank,
        }


# シングルトンインスタンス
general_stats_service = GeneralStatsService()
