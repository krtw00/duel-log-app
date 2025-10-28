"""
時系列データサービス
レートやDCポイントの時系列データ生成に特化したビジネスロジックを提供
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.duel import Duel


class TimeSeriesService:
    """時系列データサービスクラス"""

    def _build_base_duels_query(
        self, db: Session, user_id: int, game_mode: Optional[str] = None
    ):
        """
        ユーザーの対戦記録を取得するためのベースクエリを構築

        Args:
            db: データベースセッション
            user_id: ユーザーID
            game_mode: ゲームモード（'RANK', 'RATE', 'EVENT', 'DC'など）でフィルタリング（任意）

        Returns:
            フィルタリング済みのSQLAlchemyクエリオブジェクト
        """
        query = db.query(Duel).filter(Duel.user_id == user_id)
        if game_mode:
            query = query.filter(Duel.game_mode == game_mode)
        return query

    def _apply_range_filter(
        self,
        duels: List[Duel],
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
    ) -> List[Duel]:
        """
        対戦記録リストに範囲指定フィルタを適用

        指定された範囲（例: 1-50戦目）の対戦記録のみを抽出します。
        リストは新しい順（日付降順）にソートされている必要があります。

        Args:
            duels: 対戦記録のリスト（日付降順にソート済み）
            range_start: 範囲の開始位置（1始まり、任意）
            range_end: 範囲の終了位置（1始まり、任意）

        Returns:
            範囲フィルタ適用後の対戦記録リスト

        Note:
            - range_startとrange_endは1始まりの番号（例: 1-50）
            - 内部では0始まりのインデックスに変換して処理
        """
        filtered = duels

        # 範囲フィルター
        if range_start is not None or range_end is not None:
            start = max(0, (range_start or 1) - 1)  # 1始まりを0始まりに変換
            end = range_end if range_end is not None else len(filtered)
            filtered = filtered[start:end]

        return filtered

    def get_time_series_data(
        self,
        db: Session,
        user_id: int,
        game_mode: str,
        year: int,
        month: int,
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
        my_deck_id: Optional[int] = None,
        opponent_deck_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        指定されたゲームモードの月間時系列データを取得（レート/DC値の推移）

        レートモードまたはDCモードの対戦記録から、日付ごとの値の推移を生成します。
        各日付で最後の値を使用し、値がない場合は前回の値を引き継ぎます。

        Args:
            db: データベースセッション
            user_id: ユーザーID
            game_mode: ゲームモード（'RATE' または 'DC'）
            year: 年（例: 2025）
            month: 月（1-12）
            range_start: 範囲の開始位置（1始まり、任意）
            range_end: 範囲の終了位置（1始まり、任意）
            my_deck_id: プレイヤーデッキIDでフィルタリング（任意）
            opponent_deck_id: 相手デッキIDでフィルタリング（任意）

        Returns:
            時系列データのリスト。各要素は以下の構造:
            - date (str): 日付（'YYYY-MM-DD'形式）
            - value (int | None): レート値またはDC値

        処理フロー:
            1. 指定された年月の期間を計算
            2. 該当期間の対戦記録を取得
            3. 範囲フィルタを適用（指定がある場合）
            4. 日付昇順でソート
            5. 各対戦から値を抽出し、時系列データを構築
            6. 同じ日付の場合は最後の値を使用

        Note:
            - game_mode='RATE'の場合: rate_value を使用
            - game_mode='DC'の場合: dc_value を使用
            - 値がない日は前回の値を引き継ぎ
        """
        # 月の最初の日と最後の日を計算
        start_date = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
        if month == 12:
            # 12月の場合は翌年1月1日の直前まで
            end_date = datetime(
                year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc
            ) - timedelta(microseconds=1)
        else:
            # それ以外は翌月1日の直前まで
            end_date = datetime(
                year, month + 1, 1, 0, 0, 0, tzinfo=timezone.utc
            ) - timedelta(microseconds=1)

        # 該当月の対戦記録を取得
        query = self._build_base_duels_query(db, user_id, game_mode).filter(
            Duel.played_date >= start_date,
            Duel.played_date <= end_date,
        )

        # デッキフィルターを適用
        if my_deck_id is not None:
            query = query.filter(Duel.deck_id == my_deck_id)
        if opponent_deck_id is not None:
            query = query.filter(Duel.opponent_deck_id == opponent_deck_id)

        # 日付降順で取得（範囲フィルタ用）
        duels = query.order_by(Duel.played_date.desc(), Duel.id.desc()).all()

        # 範囲指定を適用
        if range_start is not None or range_end is not None:
            duels = self._apply_range_filter(duels, range_start, range_end)

        # 時系列データ生成のため、日付昇順に再ソート
        duels = sorted(duels, key=lambda d: (d.played_date, d.id))

        time_series_data = []
        current_value = None  # 直前の値を保持（値がない日のため）

        # 各対戦記録から値を抽出して時系列データを構築
        for duel in duels:
            date_str = duel.played_date.strftime("%Y-%m-%d")
            value = None

            # ゲームモードに応じて適切な値を取得
            if game_mode == "RATE" and duel.rate_value is not None:
                value = duel.rate_value
            elif game_mode == "DC" and duel.dc_value is not None:
                value = duel.dc_value

            # 値がある場合は更新、ない場合は前回の値を引き継ぎ
            if value is not None:
                current_value = value

            # その日の値（または直前の値）を追加
            time_series_data.append({"date": date_str, "value": current_value})

        # 同じ日付で複数の対戦がある場合、最後の値のみを保持
        processed_data = {}
        for item in time_series_data:
            processed_data[item["date"]] = item["value"]

        # 辞書をリストに変換して返す
        return [{"date": date, "value": value} for date, value in processed_data.items()]


# シングルトンインスタンス
time_series_service = TimeSeriesService()
