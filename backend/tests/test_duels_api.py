"""
デュエルAPIエンドポイントの統合テスト
"""

from datetime import datetime, timezone
from io import BytesIO

from fastapi import status


class TestDuelCRUDEndpoints:
    """デュエルCRUD APIエンドポイントのテスト"""

    def _create_test_decks(self, client):
        """テスト用のデッキを作成するヘルパー"""
        my_deck_response = client.post(
            "/decks/",
            json={"name": "Test My Deck", "is_opponent": False},
        )
        opponent_deck_response = client.post(
            "/decks/",
            json={"name": "Test Opponent Deck", "is_opponent": True},
        )
        return my_deck_response.json()["id"], opponent_deck_response.json()["id"]

    def test_create_duel(self, authenticated_client):
        """デュエル作成エンドポイントのテスト"""
        my_deck_id, opponent_deck_id = self._create_test_decks(authenticated_client)

        response = authenticated_client.post(
            "/duels/",
            json={
                "deck_id": my_deck_id,
                "opponent_deck_id": opponent_deck_id,
                "is_win": True,
                "game_mode": "RANK",
                "rank": 10,
                "won_coin_toss": True,
                "is_going_first": True,
                "played_date": datetime.now(timezone.utc).isoformat(),
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["deck_id"] == my_deck_id
        assert data["opponent_deck_id"] == opponent_deck_id
        assert data["is_win"] is True
        assert data["game_mode"] == "RANK"
        assert data["rank"] == 10

    def test_create_duel_with_rate(self, authenticated_client):
        """RATEモードでのデュエル作成テスト"""
        my_deck_id, opponent_deck_id = self._create_test_decks(authenticated_client)

        response = authenticated_client.post(
            "/duels/",
            json={
                "deck_id": my_deck_id,
                "opponent_deck_id": opponent_deck_id,
                "is_win": False,
                "game_mode": "RATE",
                "rate_value": 1500.5,
                "won_coin_toss": False,
                "is_going_first": False,
                "played_date": datetime.now(timezone.utc).isoformat(),
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["game_mode"] == "RATE"
        assert data["rate_value"] == 1500.5

    def test_create_duel_with_dc(self, authenticated_client):
        """DCモードでのデュエル作成テスト"""
        my_deck_id, opponent_deck_id = self._create_test_decks(authenticated_client)

        response = authenticated_client.post(
            "/duels/",
            json={
                "deck_id": my_deck_id,
                "opponent_deck_id": opponent_deck_id,
                "is_win": True,
                "game_mode": "DC",
                "dc_value": 5000,
                "won_coin_toss": True,
                "is_going_first": True,
                "played_date": datetime.now(timezone.utc).isoformat(),
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["game_mode"] == "DC"
        assert data["dc_value"] == 5000

    def test_list_duels(self, authenticated_client):
        """デュエル一覧取得エンドポイントのテスト"""
        my_deck_id, opponent_deck_id = self._create_test_decks(authenticated_client)

        # 複数のデュエルを作成
        for i in range(3):
            authenticated_client.post(
                "/duels/",
                json={
                    "deck_id": my_deck_id,
                    "opponent_deck_id": opponent_deck_id,
                    "is_win": i % 2 == 0,
                    "game_mode": "RANK",
                    "rank": 10 + i,
                    "won_coin_toss": True,
                    "is_going_first": True,
                    "played_date": datetime.now(timezone.utc).isoformat(),
                },
            )

        response = authenticated_client.get("/duels/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 3

    def test_get_duel_by_id(self, authenticated_client):
        """デュエル取得エンドポイントのテスト"""
        my_deck_id, opponent_deck_id = self._create_test_decks(authenticated_client)

        create_response = authenticated_client.post(
            "/duels/",
            json={
                "deck_id": my_deck_id,
                "opponent_deck_id": opponent_deck_id,
                "is_win": True,
                "game_mode": "RANK",
                "rank": 10,
                "won_coin_toss": True,
                "is_going_first": True,
                "played_date": datetime.now(timezone.utc).isoformat(),
                "notes": "Test note",
            },
        )
        duel_id = create_response.json()["id"]

        response = authenticated_client.get(f"/duels/{duel_id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == duel_id
        assert data["notes"] == "Test note"

    def test_update_duel(self, authenticated_client):
        """デュエル更新エンドポイントのテスト"""
        my_deck_id, opponent_deck_id = self._create_test_decks(authenticated_client)

        create_response = authenticated_client.post(
            "/duels/",
            json={
                "deck_id": my_deck_id,
                "opponent_deck_id": opponent_deck_id,
                "is_win": True,
                "game_mode": "RANK",
                "rank": 10,
                "won_coin_toss": True,
                "is_going_first": True,
                "played_date": datetime.now(timezone.utc).isoformat(),
            },
        )
        duel_id = create_response.json()["id"]

        response = authenticated_client.put(
            f"/duels/{duel_id}",
            json={
                "is_win": False,
                "rank": 15,
                "notes": "Updated note",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["is_win"] is False
        assert data["rank"] == 15
        assert data["notes"] == "Updated note"

    def test_delete_duel(self, authenticated_client):
        """デュエル削除エンドポイントのテスト"""
        my_deck_id, opponent_deck_id = self._create_test_decks(authenticated_client)

        create_response = authenticated_client.post(
            "/duels/",
            json={
                "deck_id": my_deck_id,
                "opponent_deck_id": opponent_deck_id,
                "is_win": True,
                "game_mode": "RANK",
                "rank": 10,
                "won_coin_toss": True,
                "is_going_first": True,
                "played_date": datetime.now(timezone.utc).isoformat(),
            },
        )
        duel_id = create_response.json()["id"]

        response = authenticated_client.delete(f"/duels/{duel_id}")

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # 削除されたことを確認
        get_response = authenticated_client.get(f"/duels/{duel_id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND


class TestDuelFilterEndpoints:
    """デュエルフィルタリング機能のテスト"""

    def _create_test_duels(self, client):
        """テスト用のデュエルを複数作成するヘルパー"""
        my_deck_response = client.post(
            "/decks/",
            json={"name": "Filter Test Deck", "is_opponent": False},
        )
        opponent_deck_response = client.post(
            "/decks/",
            json={"name": "Filter Opponent Deck", "is_opponent": True},
        )
        my_deck_id = my_deck_response.json()["id"]
        opponent_deck_id = opponent_deck_response.json()["id"]

        # RANKモードのデュエル
        client.post(
            "/duels/",
            json={
                "deck_id": my_deck_id,
                "opponent_deck_id": opponent_deck_id,
                "is_win": True,
                "game_mode": "RANK",
                "rank": 10,
                "won_coin_toss": True,
                "is_going_first": True,
                "played_date": "2023-01-15T10:00:00Z",
            },
        )

        # RATEモードのデュエル
        client.post(
            "/duels/",
            json={
                "deck_id": my_deck_id,
                "opponent_deck_id": opponent_deck_id,
                "is_win": False,
                "game_mode": "RATE",
                "rate_value": 1500.0,
                "won_coin_toss": False,
                "is_going_first": False,
                "played_date": "2023-02-15T10:00:00Z",
            },
        )

        return my_deck_id, opponent_deck_id

    def test_filter_by_game_mode(self, authenticated_client):
        """ゲームモードでフィルタリング"""
        self._create_test_duels(authenticated_client)

        response = authenticated_client.get("/duels/?game_mode=RANK")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["game_mode"] == "RANK"

    def test_filter_by_deck_id(self, authenticated_client):
        """デッキIDでフィルタリング"""
        my_deck_id, _ = self._create_test_duels(authenticated_client)

        response = authenticated_client.get(f"/duels/?deck_id={my_deck_id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
        for duel in data:
            assert duel["deck_id"] == my_deck_id

    def test_filter_by_year_month(self, authenticated_client):
        """年月でフィルタリング"""
        self._create_test_duels(authenticated_client)

        response = authenticated_client.get("/duels/?year=2023&month=1")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert "2023-01" in data[0]["played_date"]

    def test_filter_by_date_range(self, authenticated_client):
        """日付範囲でフィルタリング"""
        self._create_test_duels(authenticated_client)

        response = authenticated_client.get(
            "/duels/?start_date=2023-02-01T00:00:00Z&end_date=2023-02-28T23:59:59Z"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["game_mode"] == "RATE"


class TestDuelCSVEndpoints:
    """CSV入出力エンドポイントのテスト"""

    def _create_test_duel(self, client):
        """テスト用デュエルを作成するヘルパー"""
        my_deck_response = client.post(
            "/decks/",
            json={"name": "CSV Test Deck", "is_opponent": False},
        )
        opponent_deck_response = client.post(
            "/decks/",
            json={"name": "CSV Opponent Deck", "is_opponent": True},
        )
        my_deck_id = my_deck_response.json()["id"]
        opponent_deck_id = opponent_deck_response.json()["id"]

        client.post(
            "/duels/",
            json={
                "deck_id": my_deck_id,
                "opponent_deck_id": opponent_deck_id,
                "is_win": True,
                "game_mode": "RANK",
                "rank": 10,
                "won_coin_toss": True,
                "is_going_first": True,
                "played_date": "2023-01-15T10:00:00Z",
                "notes": "Test note",
            },
        )

        return my_deck_id, opponent_deck_id

    def test_export_csv(self, authenticated_client):
        """CSVエクスポートのテスト"""
        self._create_test_duel(authenticated_client)

        response = authenticated_client.get("/duels/export/csv")

        assert response.status_code == status.HTTP_200_OK
        assert "text/csv" in response.headers["content-type"]
        assert "attachment" in response.headers["content-disposition"]

        content = response.content.decode("utf-8")
        assert "使用デッキ" in content
        assert "相手デッキ" in content
        assert "CSV Test Deck" in content
        assert "CSV Opponent Deck" in content

    def test_export_csv_with_filters(self, authenticated_client):
        """フィルター付きCSVエクスポートのテスト"""
        self._create_test_duel(authenticated_client)

        response = authenticated_client.get(
            "/duels/export/csv?year=2023&month=1&game_mode=RANK"
        )

        assert response.status_code == status.HTTP_200_OK
        content = response.content.decode("utf-8")
        assert "RANK" in content

    def test_export_csv_with_columns(self, authenticated_client):
        """カラム指定付きCSVエクスポートのテスト"""
        self._create_test_duel(authenticated_client)

        # カラム名は内部名で指定（deck_name, opponent_deck_name, result）
        response = authenticated_client.get(
            "/duels/export/csv?columns=deck_name,opponent_deck_name,result"
        )

        assert response.status_code == status.HTTP_200_OK
        content = response.content.decode("utf-8")
        # 日本語ヘッダーが出力されることを確認
        assert "使用デッキ" in content
        assert "相手デッキ" in content
        assert "結果" in content
        # 指定しなかったカラムが含まれないことを確認
        assert "メモ" not in content

    def test_import_csv(self, authenticated_client):
        """CSVインポートのテスト"""
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "Import Deck,Import Opponent,勝利,RANK,10,,,表,先攻,2023-03-15 10:00:00,Imported\n"
        )

        files = {"file": ("test.csv", BytesIO(csv_content.encode("utf-8")), "text/csv")}
        response = authenticated_client.post("/duels/import/csv", files=files)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["created"] >= 1
        assert data["message"] == "CSV file imported successfully"

    def test_import_csv_invalid_file_type(self, authenticated_client):
        """不正なファイル形式でのインポートテスト"""
        files = {"file": ("test.txt", BytesIO(b"test content"), "text/plain")}
        response = authenticated_client.post("/duels/import/csv", files=files)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_import_csv_invalid_encoding(self, authenticated_client):
        """不正なエンコーディングでのインポートテスト"""
        # Shift-JISでエンコードされたコンテンツ（UTF-8で不正）
        invalid_content = "使用デッキ,相手デッキ\n".encode("shift-jis")

        files = {"file": ("test.csv", BytesIO(invalid_content), "text/csv")}
        response = authenticated_client.post("/duels/import/csv", files=files)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestDuelStatsEndpoints:
    """統計関連エンドポイントのテスト"""

    def _create_test_duels_for_stats(self, client):
        """統計用テストデュエルを作成"""
        my_deck_response = client.post(
            "/decks/",
            json={"name": "Stats Deck", "is_opponent": False},
        )
        opponent_deck_response = client.post(
            "/decks/",
            json={"name": "Stats Opponent", "is_opponent": True},
        )
        my_deck_id = my_deck_response.json()["id"]
        opponent_deck_id = opponent_deck_response.json()["id"]

        # 勝ち3回、負け1回
        for i, is_win in enumerate([True, True, True, False]):
            client.post(
                "/duels/",
                json={
                    "deck_id": my_deck_id,
                    "opponent_deck_id": opponent_deck_id,
                    "is_win": is_win,
                    "game_mode": "RANK",
                    "rank": 10 + i,
                    "won_coin_toss": True,
                    "is_going_first": True,
                    "played_date": datetime.now(timezone.utc).isoformat(),
                },
            )

        return my_deck_id, opponent_deck_id

    def test_get_win_rate(self, authenticated_client):
        """勝率取得エンドポイントのテスト"""
        self._create_test_duels_for_stats(authenticated_client)

        response = authenticated_client.get("/duels/stats/win-rate")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "win_rate" in data
        assert "percentage" in data
        assert data["win_rate"] == 0.75  # 3勝1敗
        assert data["percentage"] == 75.0

    def test_get_win_rate_by_deck(self, authenticated_client):
        """デッキ別勝率取得エンドポイントのテスト"""
        my_deck_id, _ = self._create_test_duels_for_stats(authenticated_client)

        response = authenticated_client.get(
            f"/duels/stats/win-rate?deck_id={my_deck_id}"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["win_rate"] == 0.75

    def test_get_latest_values(self, authenticated_client):
        """最新値取得エンドポイントのテスト"""
        my_deck_response = authenticated_client.post(
            "/decks/",
            json={"name": "Latest Test Deck", "is_opponent": False},
        )
        opponent_deck_response = authenticated_client.post(
            "/decks/",
            json={"name": "Latest Opponent", "is_opponent": True},
        )
        my_deck_id = my_deck_response.json()["id"]
        opponent_deck_id = opponent_deck_response.json()["id"]

        # RANKモードのデュエル
        authenticated_client.post(
            "/duels/",
            json={
                "deck_id": my_deck_id,
                "opponent_deck_id": opponent_deck_id,
                "is_win": True,
                "game_mode": "RANK",
                "rank": 15,
                "won_coin_toss": True,
                "is_going_first": True,
                "played_date": datetime.now(timezone.utc).isoformat(),
            },
        )

        # RATEモードのデュエル
        authenticated_client.post(
            "/duels/",
            json={
                "deck_id": my_deck_id,
                "opponent_deck_id": opponent_deck_id,
                "is_win": False,
                "game_mode": "RATE",
                "rate_value": 1700.5,
                "won_coin_toss": False,
                "is_going_first": False,
                "played_date": datetime.now(timezone.utc).isoformat(),
            },
        )

        response = authenticated_client.get("/duels/latest-values/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "RANK" in data
        assert data["RANK"]["value"] == 15
        assert "RATE" in data
        assert data["RATE"]["value"] == 1700.5


class TestDuelErrorCases:
    """デュエルAPIのエラーケーステスト"""

    def test_create_duel_unauthorized(self, client):
        """認証なしでのデュエル作成テスト"""
        response = client.post(
            "/duels/",
            json={
                "deck_id": 1,
                "opponent_deck_id": 2,
                "is_win": True,
                "game_mode": "RANK",
                "rank": 10,
                "won_coin_toss": True,
                "is_going_first": True,
                "played_date": datetime.now(timezone.utc).isoformat(),
            },
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_nonexistent_duel(self, authenticated_client):
        """存在しないデュエルの取得テスト"""
        response = authenticated_client.get("/duels/99999")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_nonexistent_duel(self, authenticated_client):
        """存在しないデュエルの更新テスト"""
        response = authenticated_client.put(
            "/duels/99999",
            json={"is_win": False},
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_nonexistent_duel(self, authenticated_client):
        """存在しないデュエルの削除テスト"""
        response = authenticated_client.delete("/duels/99999")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_duel_with_invalid_deck(self, authenticated_client):
        """存在しないデッキでのデュエル作成テスト"""
        response = authenticated_client.post(
            "/duels/",
            json={
                "deck_id": 99999,
                "opponent_deck_id": 99998,
                "is_win": True,
                "game_mode": "RANK",
                "rank": 10,
                "won_coin_toss": True,
                "is_going_first": True,
                "played_date": datetime.now(timezone.utc).isoformat(),
            },
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
