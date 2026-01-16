"""
/me APIエンドポイントの統合テスト
（ユーザープロフィール、エクスポート/インポート、アカウント削除）
"""

from datetime import datetime, timezone
from io import BytesIO

from fastapi import status


class TestMeProfileEndpoints:
    """/me プロフィールエンドポイントのテスト"""

    def test_get_my_profile(self, authenticated_client, test_user):
        """プロフィール取得エンドポイントのテスト"""
        response = authenticated_client.get("/me")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert "passwordhash" not in data  # パスワードハッシュは返されない

    def test_get_my_profile_unauthorized(self, client):
        """認証なしでのプロフィール取得テスト"""
        response = client.get("/me")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_my_profile_username(self, authenticated_client):
        """ユーザー名更新のテスト"""
        response = authenticated_client.put(
            "/me",
            json={"username": "newusername"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == "newusername"

    def test_update_my_profile_email(self, authenticated_client):
        """メールアドレス更新のテスト"""
        response = authenticated_client.put(
            "/me",
            json={"email": "newemail@example.com"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == "newemail@example.com"

    def test_update_my_profile_streamer_mode(self, authenticated_client):
        """配信者モード更新のテスト"""
        response = authenticated_client.put(
            "/me",
            json={"streamer_mode": True},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["streamer_mode"] is True

    def test_update_my_profile_theme_preference(self, authenticated_client):
        """テーマ設定更新のテスト"""
        response = authenticated_client.put(
            "/me",
            json={"theme_preference": "light"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["theme_preference"] == "light"


class TestMeExportEndpoints:
    """/me エクスポート機能のテスト"""

    def _create_test_data(self, client):
        """テスト用データを作成"""
        # デッキ作成
        my_deck_response = client.post(
            "/decks/",
            json={"name": "Export Test Deck", "is_opponent": False},
        )
        opponent_deck_response = client.post(
            "/decks/",
            json={"name": "Export Opponent Deck", "is_opponent": True},
        )
        my_deck_id = my_deck_response.json()["id"]
        opponent_deck_id = opponent_deck_response.json()["id"]

        # デュエル作成
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
                "played_date": datetime.now(timezone.utc).isoformat(),
                "notes": "Export test note",
            },
        )

        return my_deck_id, opponent_deck_id

    def test_export_my_data(self, authenticated_client):
        """データエクスポートのテスト"""
        self._create_test_data(authenticated_client)

        response = authenticated_client.get("/me/export")

        assert response.status_code == status.HTTP_200_OK
        assert "text/csv" in response.headers["content-type"]
        assert "attachment" in response.headers["content-disposition"]

        content = response.content.decode("utf-8")
        assert "使用デッキ" in content
        assert "Export Test Deck" in content
        assert "Export Opponent Deck" in content
        assert "Export test note" in content

    def test_export_my_data_empty(self, authenticated_client):
        """データがない場合のエクスポートテスト"""
        response = authenticated_client.get("/me/export")

        assert response.status_code == status.HTTP_200_OK
        # ヘッダーのみ出力される
        content = response.content.decode("utf-8")
        assert "使用デッキ" in content

    def test_export_my_data_unauthorized(self, client):
        """認証なしでのエクスポートテスト"""
        response = client.get("/me/export")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestMeImportEndpoints:
    """/me インポート機能のテスト"""

    def test_import_my_data(self, authenticated_client):
        """データインポートのテスト"""
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "Import Deck,Import Opponent,勝利,RANK,10,,,表,先攻,2023-03-15 10:00:00,Imported note\n"
        )

        response = authenticated_client.post(
            "/me/import",
            files={"file": csv_content.encode("utf-8")},
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["created"] >= 1

        # インポートされたデータを確認
        duels_response = authenticated_client.get("/duels/")
        assert duels_response.status_code == status.HTTP_200_OK
        duels = duels_response.json()
        assert len(duels) >= 1

    def test_import_replaces_existing_data(self, authenticated_client):
        """インポート時に既存データが削除されることをテスト"""
        # 既存データを作成
        my_deck_response = authenticated_client.post(
            "/decks/",
            json={"name": "Existing Deck", "is_opponent": False},
        )
        opponent_deck_response = authenticated_client.post(
            "/decks/",
            json={"name": "Existing Opponent", "is_opponent": True},
        )
        my_deck_id = my_deck_response.json()["id"]
        opponent_deck_id = opponent_deck_response.json()["id"]

        authenticated_client.post(
            "/duels/",
            json={
                "deck_id": my_deck_id,
                "opponent_deck_id": opponent_deck_id,
                "is_win": True,
                "game_mode": "RANK",
                "rank": 5,
                "won_coin_toss": True,
                "is_going_first": True,
                "played_date": datetime.now(timezone.utc).isoformat(),
            },
        )

        # 新しいデータをインポート
        csv_content = (
            "使用デッキ,相手デッキ,結果,ゲームモード,ランク,レート,DC値,コイン,先攻/後攻,対戦日時,メモ\n"
            "New Deck,New Opponent,敗北,RATE,,1500,,裏,後攻,2023-04-15 10:00:00,New note\n"
        )

        response = authenticated_client.post(
            "/me/import",
            files={"file": csv_content.encode("utf-8")},
        )

        assert response.status_code == status.HTTP_201_CREATED

        # 古いデータが削除され、新しいデータのみ残っていることを確認
        duels_response = authenticated_client.get("/duels/")
        duels = duels_response.json()
        assert len(duels) == 1
        assert duels[0]["game_mode"] == "RATE"

    def test_import_invalid_encoding(self, authenticated_client):
        """不正なエンコーディングでのインポートテスト"""
        # Shift-JISでエンコードされたコンテンツ
        invalid_content = "使用デッキ,相手デッキ\n".encode("shift-jis")

        response = authenticated_client.post(
            "/me/import",
            files={"file": invalid_content},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_import_unauthorized(self, client):
        """認証なしでのインポートテスト"""
        csv_content = "使用デッキ,相手デッキ\nTest,Test\n"

        response = client.post(
            "/me/import",
            files={"file": csv_content.encode("utf-8")},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestMeDeleteEndpoints:
    """/me 削除機能のテスト"""

    def test_delete_my_account(self, authenticated_client, test_user, db_session):
        """アカウント削除のテスト"""
        # 事前にデータを作成
        my_deck_response = authenticated_client.post(
            "/decks/",
            json={"name": "Delete Test Deck", "is_opponent": False},
        )
        opponent_deck_response = authenticated_client.post(
            "/decks/",
            json={"name": "Delete Opponent Deck", "is_opponent": True},
        )
        my_deck_id = my_deck_response.json()["id"]
        opponent_deck_id = opponent_deck_response.json()["id"]

        authenticated_client.post(
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

        response = authenticated_client.delete("/me")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "削除" in data["message"]

        # ユーザーが削除されていることを確認
        from app.models.user import User

        deleted_user = db_session.query(User).filter(User.id == test_user.id).first()
        assert deleted_user is None

    def test_delete_my_account_unauthorized(self, client):
        """認証なしでのアカウント削除テスト"""
        response = client.delete("/me")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestMeExportImportRoundTrip:
    """エクスポート→インポートの往復テスト"""

    def test_export_import_roundtrip(self, authenticated_client):
        """エクスポートしたデータを再インポートできることをテスト"""
        # データを作成
        my_deck_response = authenticated_client.post(
            "/decks/",
            json={"name": "Roundtrip Deck", "is_opponent": False},
        )
        opponent_deck_response = authenticated_client.post(
            "/decks/",
            json={"name": "Roundtrip Opponent", "is_opponent": True},
        )
        my_deck_id = my_deck_response.json()["id"]
        opponent_deck_id = opponent_deck_response.json()["id"]

        authenticated_client.post(
            "/duels/",
            json={
                "deck_id": my_deck_id,
                "opponent_deck_id": opponent_deck_id,
                "is_win": True,
                "game_mode": "RANK",
                "rank": 10,
                "won_coin_toss": True,
                "is_going_first": True,
                "played_date": "2023-05-15T10:00:00Z",
                "notes": "Roundtrip test",
            },
        )

        # エクスポート
        export_response = authenticated_client.get("/me/export")
        assert export_response.status_code == status.HTTP_200_OK
        csv_content = export_response.content

        # インポート（既存データは削除される）
        import_response = authenticated_client.post(
            "/me/import",
            files={"file": csv_content},
        )
        assert import_response.status_code == status.HTTP_201_CREATED

        # データが正しく復元されていることを確認
        duels_response = authenticated_client.get("/duels/")
        duels = duels_response.json()
        assert len(duels) == 1
        assert duels[0]["notes"] == "Roundtrip test"

        # デッキも復元されていることを確認
        decks_response = authenticated_client.get("/decks/")
        decks = decks_response.json()
        deck_names = [d["name"] for d in decks]
        assert "Roundtrip Deck" in deck_names
        assert "Roundtrip Opponent" in deck_names
