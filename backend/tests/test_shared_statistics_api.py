from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi import status


class TestSharedStatisticsEndpoints:
    @pytest.fixture
    def mock_statistics_service_data(self):
        """統計サービスが返すダミーデータをモックするフィクスチャ"""
        with patch(
            "app.services.statistics_service.statistics_service.get_deck_distribution_monthly"
        ) as mock_get_deck_distribution_monthly:
            mock_get_deck_distribution_monthly.return_value = [
                {"deck_name": "Test Opponent Deck", "count": 10, "percentage": 100.0}
            ]
            yield

    @pytest.fixture
    def mock_statistics_service_no_data(self):
        """統計サービスがデータなしを返すダミーデータをモックするフィクスチャ"""
        with patch(
            "app.services.statistics_service.statistics_service.get_deck_distribution_monthly"
        ) as mock_get_deck_distribution_monthly:
            mock_get_deck_distribution_monthly.return_value = []
            yield


@pytest.fixture
def mock_statistics_service(mocker):
    """各サービスメソッドをモック"""
    mocker.patch(
        "app.api.routers.shared_statistics.general_stats_service.get_overall_stats",
        return_value={"total_duels": 10, "win_rate": 0.5},
    )
    mocker.patch(
        "app.api.routers.shared_statistics.deck_distribution_service.get_deck_distribution_monthly",
        return_value=[{"deck_name": "Test Deck", "count": 10, "percentage": 100}],
    )
    mocker.patch(
        "app.api.routers.shared_statistics.deck_distribution_service.get_deck_distribution_recent",
        return_value=[],
    )
    mocker.patch(
        "app.api.routers.shared_statistics.matchup_service.get_matchup_chart",
        return_value=[],
    )

    def test_create_shared_statistics_link_success(
        self, authenticated_client, mock_statistics_service_data
    ):
        """共有リンクの作成成功テスト"""
        current_year = datetime.now(timezone.utc).year
        current_month = datetime.now(timezone.utc).month
        response = authenticated_client.post(
            "/shared-statistics/",
            json={"year": current_year, "month": current_month, "game_mode": "RANK"},
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "share_id" in data
        assert data["year"] == current_year
        assert data["month"] == current_month
        assert data["game_mode"] == "RANK"
        assert data["expires_at"] is None

    def test_create_shared_statistics_link_with_expiration(
        self, authenticated_client, mock_statistics_service_data
    ):
        """有効期限付き共有リンクの作成テスト"""
        current_year = datetime.now(timezone.utc).year
        current_month = datetime.now(timezone.utc).month
        # YYYY-MM-DD 形式で有効期限を設定
        expires_date_str = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        response = authenticated_client.post(
            "/shared-statistics/",
            json={
                "year": current_year,
                "month": current_month,
                "game_mode": "RATE",
                "expires_at": expires_date_str,
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "share_id" in data
        assert data["expires_at"] is not None
        # 期待されるISOフォーマットの文字列（UTCの深夜）
        expected_expires_at_iso = (
            datetime.strptime(expires_date_str, "%Y-%m-%d")
            .replace(tzinfo=timezone.utc)
            .isoformat()
            .replace("+00:00", "Z")
        )
        assert data["expires_at"] == expected_expires_at_iso

    def test_create_shared_statistics_link_no_data(
        self, authenticated_client, mock_statistics_service_no_data
    ):
        """統計データがない場合の共有リンク作成テスト"""
        current_year = datetime.now(timezone.utc).year
        current_month = datetime.now(timezone.utc).month
        response = authenticated_client.post(
            "/shared-statistics/",
            json={"year": current_year, "month": current_month, "game_mode": "EVENT"},
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert (
            "指定された年月とゲームモードの統計データが見つかりません"
            in response.json()["message"]
        )

    def test_get_shared_statistics_success(
        self, authenticated_client, mock_statistics_service
    ):
        """共有統計情報の取得成功テスト"""
        # まず共有リンクを作成
        response = authenticated_client.post(
            "/shared-statistics/",
            json={"year": 2023, "month": 10, "game_mode": "RANK"},
        )
        assert response.status_code == status.HTTP_201_CREATED
        share_id = response.json()["share_id"]

        # 共有リンク経由で統計情報を取得
        response = authenticated_client.get(f"/shared-statistics/{share_id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "DASHBOARD" in data
        assert "STATISTICS" in data
        assert data["DASHBOARD"]["overall_stats"]["total_duels"] == 10

    def test_get_shared_statistics_expired(
        self, authenticated_client, mock_statistics_service
    ):
        """期限切れの共有統計データの取得テスト"""
        # 過去の有効期限で共有リンクを作成
        expires_date = datetime.now(timezone.utc) - timedelta(days=1)
        create_response = authenticated_client.post(
            "/shared-statistics/",
            json={
                "year": 2023,
                "month": 10,
                "game_mode": "RANK",
                "expires_at": expires_date.isoformat(),
            },
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        share_id = create_response.json()["share_id"]

        # 期限切れのリンクにアクセス
        response = authenticated_client.get(f"/shared-statistics/{share_id}")
        assert response.status_code == status.HTTP_410_GONE
        assert "この共有リンクは期限切れです" in response.json()["message"]

    def test_get_shared_statistics_nonexistent(self, client):
        """存在しない共有統計データの取得テスト"""
        response = client.get("/shared-statistics/nonexistent_share_id")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "共有リンクが見つかりません" in response.json()["message"]

    def test_delete_shared_statistics_link_success(
        self, authenticated_client, mock_statistics_service_data
    ):
        """共有リンクの削除成功テスト"""
        current_year = datetime.now(timezone.utc).year
        current_month = datetime.now(timezone.utc).month
        create_response = authenticated_client.post(
            "/shared-statistics/",
            json={"year": current_year, "month": current_month, "game_mode": "DC"},
        )
        share_id = create_response.json()["share_id"]

        response = authenticated_client.delete(f"/shared-statistics/{share_id}")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # 削除されたことを確認
        get_response = authenticated_client.get(f"/shared-statistics/{share_id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_shared_statistics_link_nonexistent(self, authenticated_client):
        """存在しない共有リンクの削除テスト"""
        _response = authenticated_client.delete(
            "/shared-statistics/nonexistent_share_id"
        )
        assert _response.status_code == status.HTTP_404_NOT_FOUND
        assert (
            "共有リンクが見つからないか、削除する権限がありません"
            in _response.json()["message"]
        )

    def test_delete_shared_statistics_link_unauthorized_user(
        self, authenticated_client, client, _mock_statistics_service_data
    ):
        """別ユーザーによる共有リンク削除テスト"""
        current_year = datetime.now(timezone.utc).year
        current_month = datetime.now(timezone.utc).month
        create_response = authenticated_client.post(
            "/shared-statistics/",
            json={"year": current_year, "month": current_month, "game_mode": "RANK"},
        )
        share_id = create_response.json()["share_id"]

        # 別のクライアント（ユーザー）で削除を試みる
        response = client.delete(f"/shared-statistics/{share_id}")
        assert (
            response.status_code == status.HTTP_401_UNAUTHORIZED
        )  # 認証されていないため

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
