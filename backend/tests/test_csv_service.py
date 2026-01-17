"""
CSVサービスのテスト
エクスポート/インポート機能、バリデーション、異常系のテスト
"""

from datetime import datetime, timezone

import pytest
from sqlalchemy.orm import Session

from app.models.deck import Deck
from app.models.duel import Duel
from app.services.csv_service import CSVService


@pytest.fixture
def csv_service():
    """CSVサービスのインスタンスを返す"""
    return CSVService()


@pytest.fixture
def sample_duels(db_session: Session, test_user):
    """テスト用のデュエルデータを作成"""
    my_deck = Deck(name="Test My Deck", user_id=test_user.id, is_opponent=False)
    opponent_deck = Deck(
        name="Test Opponent Deck", user_id=test_user.id, is_opponent=True
    )
    db_session.add_all([my_deck, opponent_deck])
    db_session.commit()

    duel = Duel(
        user_id=test_user.id,
        deck_id=my_deck.id,
        opponent_deck_id=opponent_deck.id,
        is_win=True,
        game_mode="RANK",
        rank=10,
        won_coin_toss=True,
        is_going_first=True,
        played_date=datetime(2023, 5, 15, 10, 0, 0, tzinfo=timezone.utc),
        notes="Test note",
    )
    db_session.add(duel)
    db_session.commit()

    return {"my_deck": my_deck, "opponent_deck": opponent_deck, "duel": duel}


class TestCSVExport:
    """CSVエクスポートのテスト"""

    def test_export_basic(self, csv_service, db_session, test_user, sample_duels):
        """基本的なエクスポート"""
        result = csv_service.export_duels_to_csv(db_session, test_user.id)

        assert "\ufeff" in result  # BOM
        assert "使用デッキ" in result
        assert "相手デッキ" in result
        assert "Test My Deck" in result
        assert "Test Opponent Deck" in result
        assert "勝利" in result
        assert "Test note" in result

    def test_export_empty(self, csv_service, db_session, test_user):
        """データがない場合のエクスポート"""
        result = csv_service.export_duels_to_csv(db_session, test_user.id)

        assert "\ufeff" in result  # BOM
        assert "使用デッキ" in result  # ヘッダーのみ
        lines = result.strip().split("\n")
        assert len(lines) == 1  # ヘッダーのみ

    def test_export_with_column_selection(
        self, csv_service, db_session, test_user, sample_duels
    ):
        """特定カラムのみエクスポート"""
        result = csv_service.export_duels_to_csv(
            db_session, test_user.id, columns=["deck_name", "result"]
        )

        assert "使用デッキ" in result
        assert "結果" in result
        assert "相手デッキ" not in result
        assert "メモ" not in result

    def test_export_with_year_filter(
        self, csv_service, db_session, test_user, sample_duels
    ):
        """年フィルター付きエクスポート"""
        # 2023年のデータあり
        result_2023 = csv_service.export_duels_to_csv(
            db_session, test_user.id, year=2023
        )
        assert "Test My Deck" in result_2023

        # 2020年のデータなし
        result_2020 = csv_service.export_duels_to_csv(
            db_session, test_user.id, year=2020
        )
        lines = result_2020.strip().split("\n")
        assert len(lines) == 1  # ヘッダーのみ

    def test_export_with_month_filter(
        self, csv_service, db_session, test_user, sample_duels
    ):
        """月フィルター付きエクスポート"""
        # 5月のデータあり
        result_may = csv_service.export_duels_to_csv(db_session, test_user.id, month=5)
        assert "Test My Deck" in result_may

        # 1月のデータなし
        result_jan = csv_service.export_duels_to_csv(db_session, test_user.id, month=1)
        lines = result_jan.strip().split("\n")
        assert len(lines) == 1  # ヘッダーのみ

    def test_export_with_game_mode_filter(
        self, csv_service, db_session, test_user, sample_duels
    ):
        """ゲームモードフィルター付きエクスポート"""
        result_rank = csv_service.export_duels_to_csv(
            db_session, test_user.id, game_mode="RANK"
        )
        assert "Test My Deck" in result_rank

        result_rate = csv_service.export_duels_to_csv(
            db_session, test_user.id, game_mode="RATE"
        )
        lines = result_rate.strip().split("\n")
        assert len(lines) == 1  # ヘッダーのみ


class TestCSVImport:
    """CSVインポートのテスト"""

    def test_import_basic(self, csv_service, db_session, test_user):
        """基本的なインポート"""
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "Import Deck,Import Opponent,勝利,RANK,10,,,表,先攻,2023-06-15 10:00:00,Imported note\n"
        )

        result = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )

        assert result["created"] == 1
        assert result["skipped"] == 0
        assert len(result["errors"]) == 0

    def test_import_with_bom(self, csv_service, db_session, test_user):
        """BOM付きCSVのインポート"""
        csv_content = (
            "\ufeff使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "BOM Deck,BOM Opponent,勝利,RANK,10,,,表,先攻,2023-06-15 10:00:00,\n"
        )

        result = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )

        assert result["created"] == 1
        assert result["skipped"] == 0
        assert len(result["errors"]) == 0

    def test_import_missing_deck_name(self, csv_service, db_session, test_user):
        """使用デッキ名が欠けている場合"""
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            ",Missing Opponent,勝利,RANK,10,,,表,先攻,2023-06-15 10:00:00,\n"
        )

        result = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )

        assert result["created"] == 0
        assert len(result["errors"]) == 1
        assert "使用デッキ" in result["errors"][0]

    def test_import_missing_opponent_deck_name(
        self, csv_service, db_session, test_user
    ):
        """相手デッキ名が欠けている場合"""
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "My Deck,,勝利,RANK,10,,,表,先攻,2023-06-15 10:00:00,\n"
        )

        result = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )

        assert result["created"] == 0
        assert len(result["errors"]) == 1
        assert "相手デッキ" in result["errors"][0]

    def test_import_missing_played_date(self, csv_service, db_session, test_user):
        """対戦日時が欠けている場合"""
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "My Deck,Opponent Deck,勝利,RANK,10,,,表,先攻,,\n"
        )

        result = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )

        assert result["created"] == 0
        assert len(result["errors"]) == 1
        assert "対戦日時" in result["errors"][0]

    def test_import_invalid_date_format(self, csv_service, db_session, test_user):
        """不正な日時フォーマット"""
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "My Deck,Opponent Deck,勝利,RANK,10,,,表,先攻,invalid-date,\n"
        )

        result = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )

        assert result["created"] == 0
        assert len(result["errors"]) == 1
        assert "日時の形式が不正" in result["errors"][0]

    def test_import_alternative_date_format(self, csv_service, db_session, test_user):
        """別の日時フォーマット（YYYY/MM/DD HH:MM）"""
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "My Deck,Opponent Deck,勝利,RANK,10,,,表,先攻,2023/06/15 10:00,\n"
        )

        result = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )

        assert result["created"] == 1
        assert result["skipped"] == 0
        assert len(result["errors"]) == 0

    def test_import_duplicate_duel_skipped(self, csv_service, db_session, test_user):
        """重複デュエルがスキップされる"""
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "Dup Deck,Dup Opponent,勝利,RANK,10,,,表,先攻,2023-06-15 10:00:00,\n"
        )

        # 1回目
        result1 = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )
        assert result1["created"] == 1

        # 2回目（重複）
        result2 = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )
        assert result2["created"] == 0
        assert result2["skipped"] == 1

    def test_import_with_rate_mode(self, csv_service, db_session, test_user):
        """RATEモードでレート値を含むインポート"""
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "Rate Deck,Rate Opponent,勝利,RATE,,1500,,表,先攻,2023-06-15 10:00:00,\n"
        )

        result = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )

        assert result["created"] == 1

        # レート値が正しく保存されているか確認
        duel = db_session.query(Duel).filter(Duel.user_id == test_user.id).first()
        assert duel.game_mode == "RATE"
        assert duel.rate_value == 1500

    def test_import_with_dc_mode(self, csv_service, db_session, test_user):
        """DCモードでDC値を含むインポート"""
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "DC Deck,DC Opponent,敗北,DC,,,500,裏,後攻,2023-06-15 10:00:00,\n"
        )

        result = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )

        assert result["created"] == 1

        duel = db_session.query(Duel).filter(Duel.user_id == test_user.id).first()
        assert duel.game_mode == "DC"
        assert duel.dc_value == 500
        assert duel.is_win is False
        assert duel.won_coin_toss is False
        assert duel.is_going_first is False

    def test_import_with_rank_name(self, csv_service, db_session, test_user):
        """ランク名でのインポート"""
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "Rank Deck,Rank Opponent,勝利,RANK,マスター1,,,表,先攻,2023-06-15 10:00:00,\n"
        )

        result = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )

        assert result["created"] == 1

        duel = db_session.query(Duel).filter(Duel.user_id == test_user.id).first()
        assert duel.rank == 32  # マスター1 = 32

    def test_import_multiple_rows(self, csv_service, db_session, test_user):
        """複数行のインポート"""
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "Deck A,Opponent A,勝利,RANK,10,,,表,先攻,2023-06-15 10:00:00,Note A\n"
            "Deck B,Opponent B,敗北,RANK,9,,,裏,後攻,2023-06-15 11:00:00,Note B\n"
            "Deck C,Opponent C,勝利,RATE,,1500,,表,先攻,2023-06-15 12:00:00,Note C\n"
        )

        result = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )

        assert result["created"] == 3
        assert result["skipped"] == 0
        assert len(result["errors"]) == 0

    def test_import_partial_errors(self, csv_service, db_session, test_user):
        """一部エラーがあっても他は成功する"""
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "Good Deck,Good Opponent,勝利,RANK,10,,,表,先攻,2023-06-15 10:00:00,\n"
            ",Missing Deck,勝利,RANK,10,,,表,先攻,2023-06-15 11:00:00,\n"
            "Good Deck 2,Good Opponent 2,勝利,RANK,10,,,表,先攻,2023-06-15 12:00:00,\n"
        )

        result = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )

        assert result["created"] == 2
        assert len(result["errors"]) == 1

    def test_import_empty_csv(self, csv_service, db_session, test_user):
        """空のCSV（ヘッダーのみ）"""
        csv_content = "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"

        result = csv_service.import_duels_from_csv(
            db_session, test_user.id, csv_content
        )

        assert result["created"] == 0
        assert result["skipped"] == 0
        assert len(result["errors"]) == 0


class TestCSVRoundTrip:
    """エクスポート→インポートの往復テスト"""

    def test_export_import_roundtrip(
        self, csv_service, db_session, test_user, sample_duels
    ):
        """エクスポートしたCSVを再インポートできる"""
        # エクスポート
        exported = csv_service.export_duels_to_csv(db_session, test_user.id)

        # 既存データを削除
        db_session.query(Duel).filter(Duel.user_id == test_user.id).delete()
        db_session.query(Deck).filter(Deck.user_id == test_user.id).delete()
        db_session.commit()

        # 再インポート
        result = csv_service.import_duels_from_csv(db_session, test_user.id, exported)

        assert result["created"] == 1
        assert len(result["errors"]) == 0

        # データが復元されていることを確認
        duel = db_session.query(Duel).filter(Duel.user_id == test_user.id).first()
        assert duel is not None
        assert duel.deck.name == "Test My Deck"
        assert duel.opponent_deck.name == "Test Opponent Deck"
        assert duel.notes == "Test note"
