"""
デュエルサービス
デュエルに関するビジネスロジックを提供
"""
import csv
from datetime import datetime
from io import StringIO
from typing import List, Optional

from sqlalchemy import extract as sa_extract  # sa.extract を使用するためにインポート
from sqlalchemy.orm import Session

from app.models.duel import Duel
from app.schemas.duel import DuelCreate, DuelUpdate
from app.services.base import BaseService


def get_rank_name(rank_value: Optional[int]) -> str:
    if rank_value is None:
        return ""
    ranks = {
        1: 'ビギナー2', 2: 'ビギナー1', 3: 'ブロンズ5', 4: 'ブロンズ4', 5: 'ブロンズ3',
        6: 'ブロンズ2', 7: 'ブロンズ1', 8: 'シルバー5', 9: 'シルバー4', 10: 'シルバー3',
        11: 'シルバー2', 12: 'シルバー1', 13: 'ゴールド5', 14: 'ゴールド4', 15: 'ゴールド3',
        16: 'ゴールド2', 17: 'ゴールド1', 18: 'プラチナ5', 19: 'プラチナ4', 20: 'プラチナ3',
        21: 'プラチナ2', 22: 'プラチナ1', 23: 'ダイヤ5', 24: 'ダイヤ4', 25: 'ダイヤ3',
        26: 'ダイヤ2', 27: 'ダイヤ1', 28: 'マスター5', 29: 'マスター4', 30: 'マスター3',
        31: 'マスター2', 32: 'マスター1'
    }
    return ranks.get(rank_value, '不明')

def get_rank_value(rank_label: Optional[str]) -> Optional[int]:
    if not rank_label:
        return None
    ranks = {
        'ビギナー2': 1, 'ビギナー1': 2, 'ブロンズ5': 3, 'ブロンズ4': 4, 'ブロンズ3': 5,
        'ブロンズ2': 6, 'ブロンズ1': 7, 'シルバー5': 8, 'シルバー4': 9, 'シルバー3': 10,
        'シルバー2': 11, 'シルバー1': 12, 'ゴールド5': 13, 'ゴールド4': 14, 'ゴールド3': 15,
        'ゴールド2': 16, 'ゴールド1': 17, 'プラチナ5': 18, 'プラチナ4': 19, 'プラチナ3': 20,
        'プラチナ2': 21, 'プラチナ1': 22, 'ダイヤ5': 23, 'ダイヤ4': 24, 'ダイヤ3': 25,
        'ダイヤ2': 26, 'ダイヤ1': 27, 'マスター5': 28, 'マスター4': 29, 'マスター3': 30,
        'マスター2': 31, 'マスター1': 32
    }
    return ranks.get(rank_label)


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
        month: Optional[int] = None
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
        query = db.query(Duel).filter(Duel.user_id == user_id)

        if deck_id is not None:
            query = query.filter(Duel.deck_id == deck_id)

        if start_date is not None:
            query = query.filter(Duel.played_date >= start_date)

        if end_date is not None:
            query = query.filter(Duel.played_date <= end_date)

        if year is not None:
            query = query.filter(sa_extract('year', Duel.played_date) == year)
        if month is not None:
            query = query.filter(sa_extract('month', Duel.played_date) == month)

        return query.order_by(Duel.played_date.desc()).all()

    def create_user_duel(
        self,
        db: Session,
        user_id: int,
        duel_in: DuelCreate
    ) -> Duel:
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
        self,
        db: Session,
        user_id: int,
        deck_id: Optional[int] = None
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

        wins = query.filter(Duel.result == True).count()

        return wins / total_duels

    def get_latest_duel_values(self, db: Session, user_id: int) -> dict:
        """
        ユーザーの各ゲームモードにおける最新のランク、レート、DC値を取得
        """
        latest_values = {}

        # 最新のランク値を取得
        latest_rank_duel = (
            db.query(Duel)
            .filter(Duel.user_id == user_id, Duel.game_mode == 'RANK', Duel.rank.isnot(None))
            .order_by(Duel.played_date.desc())
            .first()
        )
        if latest_rank_duel:
            latest_values['RANK'] = {
                'value': latest_rank_duel.rank,
                'deck_id': latest_rank_duel.deck_id,
                'opponentDeck_id': latest_rank_duel.opponentDeck_id,
            }

        # 最新のレート値を取得
        latest_rate_duel = (
            db.query(Duel)
            .filter(Duel.user_id == user_id, Duel.game_mode == 'RATE', Duel.rate_value.isnot(None))
            .order_by(Duel.played_date.desc())
            .first()
        )
        if latest_rate_duel:
            latest_values['RATE'] = {
                'value': latest_rate_duel.rate_value,
                'deck_id': latest_rate_duel.deck_id,
                'opponentDeck_id': latest_rate_duel.opponentDeck_id,
            }

        # 最新のDC値を取得
        latest_dc_duel = (
            db.query(Duel)
            .filter(Duel.user_id == user_id, Duel.game_mode == 'DC', Duel.dc_value.isnot(None))
            .order_by(Duel.played_date.desc())
            .first()
        )
        if latest_dc_duel:
            latest_values['DC'] = {
                'value': latest_dc_duel.dc_value,
                'deck_id': latest_dc_duel.deck_id,
                'opponentDeck_id': latest_dc_duel.opponentDeck_id,
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
        ユーザーのDuelデータをCSV形式でエクスポート（フィルタリングとカラム選択付き）

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
        from sqlalchemy.orm import joinedload

        # フィルタリングしてDuelを取得
        duels_query = (
            db.query(Duel)
            .filter(Duel.user_id == user_id)
            .options(joinedload(Duel.deck), joinedload(Duel.opponent_deck))
        )

        if year:
            duels_query = duels_query.filter(sa_extract("year", Duel.played_date) == year)
        if month:
            duels_query = duels_query.filter(sa_extract("month", Duel.played_date) == month)
        if game_mode:
            duels_query = duels_query.filter(Duel.game_mode == game_mode)

        duels = duels_query.order_by(Duel.played_date.desc()).all()

        # カラムのマッピング
        column_mapping = {
            "deck_name": ("使用デッキ", lambda d: d.deck.name if d.deck else ""),
            "opponent_deck_name": (
                "相手デッキ",
                lambda d: d.opponent_deck.name if d.opponent_deck else "",
            ),
            "result": ("結果", lambda d: "勝利" if d.result else "敗北"),
            "game_mode": ("ゲームモード", lambda d: d.game_mode or ""),
            "rank": ("ランク", lambda d: get_rank_name(d.rank)),
            "rate_value": ("レート", lambda d: d.rate_value if d.rate_value is not None else ""),
            "dc_value": ("DC値", lambda d: d.dc_value if d.dc_value is not None else ""),
            "coin": ("コイン", lambda d: "表" if d.coin else "裏"),
            "first_or_second": ("先攻/後攻", lambda d: "先攻" if d.first_or_second else "後攻"),
            "played_date": (
                "対戦日時",
                lambda d: d.played_date.strftime("%Y-%m-%d %H:%M:%S")
                if d.played_date
                else "",
            ),
            "notes": ("メモ", lambda d: d.notes or ""),
        }

        # デフォルトまたは指定されたカラムを使用
        export_columns = columns if columns else list(column_mapping.keys())

        # CSV出力用のStringIOバッファ
        output = StringIO()
        output.write("\ufeff")  # UTF-8 BOM
        writer = csv.writer(output)

        # ヘッダー行
        header = [column_mapping[col][0] for col in export_columns if col in column_mapping]
        writer.writerow(header)

        # データ行
        for duel in duels:
            row = [
                column_mapping[col][1](duel)
                for col in export_columns
                if col in column_mapping
            ]
            writer.writerow(row)

        csv_content = output.getvalue()
        output.close()

        return csv_content

    def import_duels_from_csv(self, db: Session, user_id: int, csv_content: str) -> dict:
        """
        CSV形式のデータからDuelをインポート
        
        Args:
            db: データベースセッション
            user_id: ユーザーID
            csv_content: CSV形式の文字列
            
        Returns:
            インポート結果の辞書 {'created': 作成数, 'errors': エラーリスト}
        """
        from io import StringIO
        import csv
        from datetime import datetime
        from app.services.deck_service import deck_service

        created_count = 0
        skipped_count = 0
        errors = []

        # UTF-8 BOMを除去
        if csv_content.startswith('\ufeff'):
            csv_content = csv_content[1:]

        # CSVをパース
        csv_file = StringIO(csv_content)
        reader = csv.DictReader(csv_file)

        for row_num, row in enumerate(reader, start=2):  # ヘッダーの次の行から
            try:
                deck_name = row.get("使用デッキ")
                opponent_deck_name = row.get("相手デッキ")
                played_date_str = row.get("対戦日時")

                if not deck_name or not opponent_deck_name:
                    errors.append(f"行{row_num}: 使用デッキまたは相手デッキの名前が不足しています")
                    continue
                
                if not played_date_str:
                    errors.append(f"行{row_num}: 対戦日時が不足しています")
                    continue
                
                try:
                    played_date = datetime.strptime(played_date_str, '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    try:
                        played_date = datetime.strptime(played_date_str, '%Y/%m/%d %H:%M')
                    except ValueError:
                        errors.append(f"行{row_num}: 対戦日時の形式が不正です: {played_date_str}")
                        continue

                with db.begin_nested():
                    # デッキを取得または作成
                    my_deck = deck_service.get_or_create(
                        db, user_id=user_id, name=deck_name, is_opponent=False
                    )
                    opponent_deck = deck_service.get_or_create(
                        db, user_id=user_id, name=opponent_deck_name, is_opponent=True
                    )

                    # 重複チェック
                    existing_duel = (
                        db.query(Duel)
                        .filter_by(
                            user_id=user_id,
                            deck_id=my_deck.id,
                            opponentDeck_id=opponent_deck.id,
                            played_date=played_date,
                        )
                        .first()
                    )

                    if existing_duel:
                        skipped_count += 1
                        continue

                    rank_str = row.get('ランク')
                    rank_value = None
                    if rank_str:
                        if rank_str.isdigit():
                            rank_value = int(rank_str)
                        else:
                            rank_value = get_rank_value(rank_str)

                    # Duelオブジェクトを作成
                    duel_data = {
                        'user_id': user_id,
                        'deck_id': my_deck.id,
                        'opponentDeck_id': opponent_deck.id,
                        'result': row.get('結果') == '勝利',
                        'game_mode': row.get('ゲームモード', 'RANK'),
                        'rank': rank_value,
                        'rate_value': int(row['レート']) if row.get('レート') and row['レート'].isdigit() else None,
                        'dc_value': int(row['DC値']) if row.get('DC値') and row['DC値'].isdigit() else None,
                        'coin': row.get('コイン', '') == '表',
                        'first_or_second': row.get('先攻/後攻', '') in ['先攻', '先行'],
                        'played_date': played_date,
                        'notes': row.get('メモ', '')
                    }

                    # DBに保存
                    duel = Duel(**duel_data)
                    db.add(duel)
                    created_count += 1

            except Exception as e:
                errors.append(f"行{row_num}: {str(e)}")
                continue

        # コミット
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise Exception(f"データベースへの保存に失敗しました: {str(e)}")

        return {
            'created': created_count,
            'skipped': skipped_count,
            'errors': errors
        }


# シングルトンインスタンス
duel_service = DuelService()
