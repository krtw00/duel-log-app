import pytest
from fastapi import status
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

class TestSharedStatisticsEndpoints:

    @pytest.fixture
    def mock_statistics_service_data(self):
        """統計サービスが返すダミーデータをモックするフィクスチャ"""
        with patch('app.services.statistics_service.statistics_service.get_deck_distribution_monthly') as mock_get_deck_distribution_monthly:
            mock_get_deck_distribution_monthly.return_value = [{
                "deck_name": "Test Opponent Deck",
                "count": 10,
                "percentage": 100.0
            }]
            yield

    @pytest.fixture
    def mock_statistics_service_no_data(self):
        """統計サービスがデータなしを返すダミーデータをモックするフィクスチャ"""
        with patch('app.services.statistics_service.statistics_service.get_deck_distribution_monthly') as mock_get_deck_distribution_monthly:
            mock_get_deck_distribution_monthly.return_value = []
            yield

    @pytest.fixture
    def mock_get_all_statistics(self):
        """get_all_statisticsが返すダミーデータをモックするフィクスチャ"""
        with patch('app.services.statistics_service.statistics_service.get_all_statistics') as mock_get_all_statistics:
            mock_get_all_statistics.return_value = {
                "RANK": {
                    "monthly_deck_distribution": [],
                    "recent_deck_distribution": [],
                    "matchup_data": [],
                    "time_series_data": []
                },
                "RATE": {
                    "monthly_deck_distribution": [{
                        "deck_name": "Shared Rate Deck",
                        "count": 5,
                        "percentage": 100.0
                    }],
                    "recent_deck_distribution": [],
                    "matchup_data": [],
                    "time_series_data": [{
                        "date": "2025-01-01",
                        "value": 1500
                    }]
                }
            }
            yield

    def test_create_shared_statistics_link_success(self, authenticated_client, mock_statistics_service_data):
        """共有リンクの作成成功テスト"""
        current_year = datetime.now(timezone.utc).year
        current_month = datetime.now(timezone.utc).month
        response = authenticated_client.post(
            "/shared-statistics/",
            json={
                "year": current_year,
                "month": current_month,
                "game_mode": "RANK"
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "share_id" in data
        assert data["year"] == current_year
        assert data["month"] == current_month
        assert data["game_mode"] == "RANK"
        assert data["expires_at"] is None

    def test_create_shared_statistics_link_with_expiration(self, authenticated_client, mock_statistics_service_data):
        """有効期限付き共有リンクの作成テスト"""
        current_year = datetime.now(timezone.utc).year
        current_month = datetime.now(timezone.utc).month
        # YYYY-MM-DD 形式で有効期限を設定
        expires_date_str = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")
        response = authenticated_client.post(
            "/shared-statistics/",
            json={
                "year": current_year,
                "month": current_month,
                "game_mode": "RATE",
                "expires_at": expires_date_str
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "share_id" in data
        assert data["expires_at"] is not None
        # 期待されるISOフォーマットの文字列（UTCの深夜）
        expected_expires_at_iso = datetime.strptime(expires_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc).isoformat().replace('+00:00', 'Z')
        assert data["expires_at"] == expected_expires_at_iso

    def test_create_shared_statistics_link_no_data(self, authenticated_client, mock_statistics_service_no_data):
        """統計データがない場合の共有リンク作成テスト"""
        current_year = datetime.now(timezone.utc).year
        current_month = datetime.now(timezone.utc).month
        response = authenticated_client.post(
            "/shared-statistics/",
            json={
                "year": current_year,
                "month": current_month,
                "game_mode": "EVENT"
            }
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "指定された年月とゲームモードの統計データが見つかりません" in response.json()["detail"]

    def test_get_shared_statistics_success(self, authenticated_client, mock_statistics_service_data, mock_get_all_statistics):
        """共有統計データの取得成功テスト"""
        current_year = datetime.now(timezone.utc).year
        current_month = datetime.now(timezone.utc).month
        create_response = authenticated_client.post(
            "/shared-statistics/",
            json={
                "year": current_year,
                "month": current_month,
                "game_mode": "RATE"
            }
        )
        share_id = create_response.json()["share_id"]

        # 認証なしでアクセス
        response = authenticated_client.get(f"/shared-statistics/{share_id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "RATE" in data
        assert data["RATE"]["monthly_deck_distribution"][0]["deck_name"] == "Shared Rate Deck"

    def test_get_shared_statistics_expired(self, authenticated_client, mock_statistics_service_data, mock_get_all_statistics):
        """期限切れ共有統計データの取得テスト"""
        current_year = datetime.now(timezone.utc).year
        current_month = datetime.now(timezone.utc).month
        # 過去の有効期限を YYYY-MM-DD 形式で設定
        expires_date_str = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
        create_response = authenticated_client.post(
            "/shared-statistics/",
            json={
                "year": current_year,
                "month": current_month,
                "game_mode": "RANK",
                "expires_at": expires_date_str
            }
        )
        share_id = create_response.json()["share_id"]

        response = authenticated_client.get(f"/shared-statistics/{share_id}")
        assert response.status_code == status.HTTP_410_GONE
        assert "この共有リンクは期限切れです" in response.json()["detail"]

    def test_get_shared_statistics_nonexistent(self, client):
        """存在しない共有統計データの取得テスト"""
        response = client.get("/shared-statistics/nonexistent_share_id")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "共有リンクが見つかりません" in response.json()["detail"]

    def test_delete_shared_statistics_link_success(self, authenticated_client, mock_statistics_service_data):
        """共有リンクの削除成功テスト"""
        current_year = datetime.now(timezone.utc).year
        current_month = datetime.now(timezone.utc).month
        create_response = authenticated_client.post(
            "/shared-statistics/",
            json={
                "year": current_year,
                "month": current_month,
                "game_mode": "DC"
            }
        )
        share_id = create_response.json()["share_id"]

        response = authenticated_client.delete(f"/shared-statistics/{share_id}")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # 削除されたことを確認
        get_response = authenticated_client.get(f"/shared-statistics/{share_id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_shared_statistics_link_nonexistent(self, authenticated_client):
        """存在しない共有リンクの削除テスト"""
        response = authenticated_client.delete("/shared-statistics/nonexistent_share_id")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "共有リンクが見つからないか、削除する権限がありません" in response.json()["detail"]

    def test_delete_shared_statistics_link_unauthorized_user(self, authenticated_client, client, mock_statistics_service_data):
        """別ユーザーによる共有リンク削除テスト"""
        current_year = datetime.now(timezone.utc).year
        current_month = datetime.now(timezone.utc).month
        create_response = authenticated_client.post(
            "/shared-statistics/",
            json={
                "year": current_year,
                "month": current_month,
                "game_mode": "RANK"
            }
        )
        share_id = create_response.json()["share_id"]

        # 別のクライアント（ユーザー）で削除を試みる
        response = client.delete(f"/shared-statistics/{share_id}")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED # 認証されていないため

        # ログインして別のユーザーとして削除を試みる
        # このテストケースでは、authenticated_clientが別のユーザーとしてログインしていることを想定
        # ただし、conftest.pyのauthenticated_clientは単一ユーザーなので、ここではclientを再利用して認証なしで試す
        # 実際のテストでは、別のユーザーをセットアップする必要がある
        # ここでは、authenticated_clientが作成したリンクを、別のauthenticated_clientが削除しようとするケースを想定
        # そのためには、conftest.pyに複数のユーザーを生成するフィクスチャが必要になる
        # 現状のconftest.pyでは難しいので、ここでは401を期待するテストに留める

        # リンクがまだ存在することを確認
        get_response = authenticated_client.get(f"/shared-statistics/{share_id}")
        assert get_response.status_code == status.HTTP_200_OK