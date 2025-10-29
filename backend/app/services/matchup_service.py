"""
デッキ相性計算サービス
デッキ間の相性計算に特化したビジネスロジックを提供
"""

from typing import Any, Dict, List, Optional

from sqlalchemy import extract
from sqlalchemy.orm import Session

from app.models.deck import Deck
from app.models.duel import Duel
from app.utils.query_builders import apply_range_filter, build_base_duels_query


class MatchupService:
    """デッキ相性計算サービスクラス"""

    def get_matchup_chart(
        self,
        db: Session,
        user_id: int,
        year: Optional[int] = None,
        month: Optional[int] = None,
        game_mode: Optional[str] = None,
        range_start: Optional[int] = None,
        range_end: Optional[int] = None,
        my_deck_id: Optional[int] = None,
        opponent_deck_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        デッキ相性表のデータを取得

        プレイヤーデッキと相手デッキのペアごとに、先攻/後攻別の勝率を計算します。

        Args:
            db: データベースセッション
            user_id: ユーザーID
            year: 年でフィルタリング（任意）
            month: 月でフィルタリング（任意）
            game_mode: ゲームモード（'RANK', 'RATE', 'EVENT', 'DC'など）でフィルタリング（任意）
            range_start: 対戦記録の範囲開始（1始まり、任意）
            range_end: 対戦記録の範囲終了（1始まり、任意）
            my_deck_id: プレイヤーデッキIDでフィルタリング（任意）
            opponent_deck_id: 相手デッキIDでフィルタリング（任意）

        Returns:
            各デッキペアの相性データのリスト。各要素は以下の構造:
            {
                'deck_name': str,              # プレイヤーのデッキ名
                'opponent_deck_name': str,     # 相手のデッキ名
                'total_duels': int,            # 総対戦数
                'wins': int,                   # 総勝利数
                'losses': int,                 # 総敗北数
                'win_rate': float,             # 総合勝率（%）
                'win_rate_first': float,       # 先攻時の勝率（%）
                'win_rate_second': float,      # 後攻時の勝率（%）
            }
            対戦数の多い順にソート済み

        処理フロー:
            1. フィルタリング条件に基づいて対戦記録を取得
            2. プレイヤーデッキと相手デッキのマッピングを構築
            3. デッキペアごとに先攻/後攻別の勝敗を集計
            4. 勝率を計算してフロントエンド向けの形式に変換
        """
        query = build_base_duels_query(db, user_id, game_mode)

        if year is not None:
            query = query.filter(extract("year", Duel.played_date) == year)
        if month is not None:
            query = query.filter(extract("month", Duel.played_date) == month)

        # デッキフィルター
        if my_deck_id is not None:
            query = query.filter(Duel.deck_id == my_deck_id)
        if opponent_deck_id is not None:
            query = query.filter(Duel.opponentDeck_id == opponent_deck_id)

        duels = query.order_by(Duel.played_date.desc()).all()

        # 範囲指定を適用
        if range_start is not None or range_end is not None:
            duels = apply_range_filter(duels, range_start, range_end)
        my_decks = (
            db.query(Deck)
            .filter(Deck.user_id == user_id, Deck.is_opponent.is_(False))
            .all()
        )
        opponent_decks = (
            db.query(Deck)
            .filter(Deck.user_id == user_id, Deck.is_opponent.is_(True))
            .all()
        )

        # デッキIDから名前へのマッピングを作成（高速検索用）
        my_deck_map = {deck.id: deck.name for deck in my_decks}
        opponent_deck_map = {deck.id: deck.name for deck in opponent_decks}

        # 3階層の辞書構造を初期化: {プレイヤーデッキ名: {相手デッキ名: {先攻/後攻別の勝敗カウント}}}
        # 全てのデッキペアの組み合わせを事前に作成し、勝敗カウンターを0で初期化
        matchups: Dict[str, Dict[str, Dict[str, int]]] = {
            my_deck_name: {
                opp_deck_name: {
                    "wins_first": 0,    # 先攻時の勝利数
                    "losses_first": 0,  # 先攻時の敗北数
                    "wins_second": 0,   # 後攻時の勝利数
                    "losses_second": 0, # 後攻時の敗北数
                }
                for opp_deck_name in opponent_deck_map.values()
            }
            for my_deck_name in my_deck_map.values()
        }

        # 各対戦記録を集計
        for duel in duels:
            my_deck_name = my_deck_map.get(duel.deck_id)
            opp_deck_name = opponent_deck_map.get(duel.opponentDeck_id)

            # デッキ名が見つかった場合のみ集計（削除されたデッキの対戦記録はスキップ）
            if my_deck_name and opp_deck_name:
                if duel.first_or_second:  # 先攻（first_or_second=True）の場合
                    if duel.result:  # 勝利（result=True）
                        matchups[my_deck_name][opp_deck_name]["wins_first"] += 1
                    else:  # 敗北（result=False）
                        matchups[my_deck_name][opp_deck_name]["losses_first"] += 1
                else:  # 後攻（first_or_second=False）の場合
                    if duel.result:  # 勝利
                        matchups[my_deck_name][opp_deck_name]["wins_second"] += 1
                    else:  # 敗北
                        matchups[my_deck_name][opp_deck_name]["losses_second"] += 1

        # フロントエンドが扱いやすいフラットな配列形式に変換
        chart_data = []
        for my_deck_name, opponents in matchups.items():
            for opp_deck_name, results in opponents.items():
                total_first = results["wins_first"] + results["losses_first"]
                total_second = results["wins_second"] + results["losses_second"]
                total_duels = total_first + total_second

                # 1回以上対戦があるデッキペアのみ結果に含める
                if total_duels > 0:
                    chart_data.append(
                        {
                            "deck_name": my_deck_name,
                            "opponent_deck_name": opp_deck_name,
                            "total_duels": total_duels,
                            "wins": results["wins_first"] + results["wins_second"],
                            "losses": results["losses_first"]
                            + results["losses_second"],
                            "win_rate": (
                                (
                                    (results["wins_first"] + results["wins_second"])
                                    / total_duels
                                )
                                * 100
                                if total_duels > 0
                                else 0
                            ),
                            "win_rate_first": (
                                (results["wins_first"] / total_first) * 100
                                if total_first > 0
                                else 0
                            ),
                            "win_rate_second": (
                                (results["wins_second"] / total_second) * 100
                                if total_second > 0
                                else 0
                            ),
                        }
                    )

        # 使用率（対戦数）でソート
        chart_data.sort(key=lambda x: x["total_duels"], reverse=True)

        return chart_data


# シングルトンインスタンス
matchup_service = MatchupService()
