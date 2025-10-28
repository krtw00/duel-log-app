"""
統計API のテスト
"""

from fastapi import status


def test_get_all_statistics_unauthorized(client):
    """未認証で統計取得を試みる"""
    response = client.get("/statistics")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_all_statistics_success(authenticated_client):
    """統計情報の一括取得が成功する"""
    response = authenticated_client.get(
        "/statistics",
        params={"year": 2025, "month": 10},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # 全ゲームモードのデータが含まれている
    assert "RANK" in data
    assert "RATE" in data
    assert "EVENT" in data
    assert "DC" in data

    # 各モードに必要なキーが含まれている
    for mode in ["RANK", "RATE", "EVENT", "DC"]:
        assert "monthly_deck_distribution" in data[mode]
        assert "recent_deck_distribution" in data[mode]
        assert "matchup_data" in data[mode]
        assert "time_series_data" in data[mode]

        # 各データがリスト形式
        assert isinstance(data[mode]["monthly_deck_distribution"], list)
        assert isinstance(data[mode]["recent_deck_distribution"], list)
        assert isinstance(data[mode]["matchup_data"], list)
        assert isinstance(data[mode]["time_series_data"], list)


def test_get_all_statistics_with_default_params(authenticated_client):
    """パラメータなしで統計情報を取得"""
    response = authenticated_client.get(
        "/statistics",
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # デフォルトで現在の年月のデータが返される
    assert "RANK" in data
    assert "RATE" in data
    assert "EVENT" in data
    assert "DC" in data


def test_get_monthly_deck_distribution_unauthorized(client):
    """未認証で月間デッキ分布取得を試みる"""
    response = client.get("/statistics/deck-distribution/monthly")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_monthly_deck_distribution_success(authenticated_client):
    """月間デッキ分布の取得が成功する"""
    response = authenticated_client.get(
        "/statistics/deck-distribution/monthly",
        params={"year": 2025, "month": 10},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


def test_get_recent_deck_distribution_unauthorized(client):
    """未認証で直近デッキ分布取得を試みる"""
    response = client.get("/statistics/deck-distribution/recent")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_recent_deck_distribution_success(authenticated_client):
    """直近デッキ分布の取得が成功する"""
    response = authenticated_client.get(
        "/statistics/deck-distribution/recent",
        params={"limit": 30},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


def test_get_matchup_chart_unauthorized(client):
    """未認証でマッチアップ表取得を試みる"""
    response = client.get("/statistics/matchup-chart")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_matchup_chart_success(authenticated_client):
    """マッチアップ表の取得が成功する"""
    response = authenticated_client.get(
        "/statistics/matchup-chart",
        params={"year": 2025, "month": 10},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


def test_get_time_series_data_unauthorized(client):
    """未認証で時系列データ取得を試みる"""
    response = client.get("/statistics/time-series/RATE")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_time_series_data_success(authenticated_client):
    """時系列データの取得が成功する（RATE）"""
    response = authenticated_client.get(
        "/statistics/time-series/RATE",
        params={"year": 2025, "month": 10},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


def test_get_time_series_data_dc_success(authenticated_client):
    """時系列データの取得が成功する（DC）"""
    response = authenticated_client.get(
        "/statistics/time-series/DC",
        params={"year": 2025, "month": 10},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


def test_get_time_series_data_invalid_mode(authenticated_client):
    """無効なゲームモードで時系列データ取得を試みる"""
    response = authenticated_client.get(
        "/statistics/time-series/INVALID",
        params={"year": 2025, "month": 10},
    )
    # ゲームモードのバリデーションエラー
    assert response.status_code in [
        status.HTTP_400_BAD_REQUEST,
        status.HTTP_422_UNPROCESSABLE_ENTITY,
        status.HTTP_500_INTERNAL_SERVER_ERROR,
    ]


def test_get_statistics_with_game_mode_filter(authenticated_client):
    """ゲームモードフィルタ付きで月間デッキ分布を取得"""
    response = authenticated_client.get(
        "/statistics/deck-distribution/monthly",
        params={"year": 2025, "month": 10, "game_mode": "RANK"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
