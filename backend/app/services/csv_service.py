"""
CSVサービス
デュエルデータのCSVインポート/エクスポート機能を提供
"""

import csv
from datetime import datetime
from io import StringIO
from typing import List, Optional

from sqlalchemy import extract as sa_extract
from sqlalchemy.orm import Session, joinedload

from app.models.duel import Duel
from app.utils.ranks import get_rank_name, get_rank_value


class CSVService:
    """CSV処理サービスクラス"""

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
        # フィルタリングしてDuelを取得
        duels_query = (
            db.query(Duel)
            .filter(Duel.user_id == user_id)
            .options(joinedload(Duel.deck), joinedload(Duel.opponent_deck))
        )

        if year:
            duels_query = duels_query.filter(
                sa_extract("year", Duel.played_date) == year
            )
        if month:
            duels_query = duels_query.filter(
                sa_extract("month", Duel.played_date) == month
            )
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
            "coin": ("コイン", lambda d: "表" if d.coin else "裏"),
            "first_or_second": (
                "先攻/後攻",
                lambda d: "先攻" if d.first_or_second else "後攻",
            ),
            "game_mode": ("ゲームモード", lambda d: d.game_mode or ""),
            "rank": ("ランク", lambda d: get_rank_name(d.rank)),
            "rate_value": (
                "レート",
                lambda d: d.rate_value if d.rate_value is not None else "",
            ),
            "dc_value": (
                "DC値",
                lambda d: d.dc_value if d.dc_value is not None else "",
            ),
            "played_date": (
                "対戦日時",
                lambda d: (
                    d.played_date.strftime("%Y-%m-%d %H:%M:%S") if d.played_date else ""
                ),
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
        header = [
            column_mapping[col][0] for col in export_columns if col in column_mapping
        ]
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
        from app.services.deck_service import deck_service

        created_count = 0
        skipped_count = 0
        errors = []

        # UTF-8 BOMを除去
        if csv_content.startswith("\ufeff"):
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
                    errors.append(
                        f"行{row_num}: 使用デッキまたは相手デッキの名前が不足しています"
                    )
                    continue

                if not played_date_str:
                    errors.append(f"行{row_num}: 対戦日時が不足しています")
                    continue

                try:
                    played_date = datetime.strptime(
                        played_date_str, "%Y-%m-%d %H:%M:%S"
                    )
                except ValueError:
                    try:
                        played_date = datetime.strptime(
                            played_date_str, "%Y/%m/%d %H:%M"
                        )
                    except ValueError:
                        errors.append(
                            f"行{row_num}: 対戦日時の形式が不正です: {played_date_str}"
                        )
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

                    rank_str = row.get("ランク")
                    rank_value = None
                    if rank_str:
                        if rank_str.isdigit():
                            rank_value = int(rank_str)
                        else:
                            rank_value = get_rank_value(rank_str)

                    # Duelオブジェクトを作成
                    duel_data = {
                        "user_id": user_id,
                        "deck_id": my_deck.id,
                        "opponentDeck_id": opponent_deck.id,
                        "result": row.get("結果") == "勝利",
                        "game_mode": row.get("ゲームモード", "RANK"),
                        "rank": rank_value,
                        "rate_value": (
                            int(row["レート"])
                            if row.get("レート") and row["レート"].isdigit()
                            else None
                        ),
                        "dc_value": (
                            int(row["DC値"])
                            if row.get("DC値") and row["DC値"].isdigit()
                            else None
                        ),
                        "coin": row.get("コイン", "") == "表",
                        "first_or_second": row.get("先攻/後攻", "") in ["先攻", "先行"],
                        "played_date": played_date,
                        "notes": row.get("メモ", ""),
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
            raise Exception(f"データベースへの保存に失敗しました: {str(e)}") from e

        return {"created": created_count, "skipped": skipped_count, "errors": errors}


# シングルトンインスタンス
csv_service = CSVService()
