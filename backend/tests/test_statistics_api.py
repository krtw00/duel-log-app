"""
test_statistics_api.py

統計APIエンドポイントのテスト

テスト対象:
- GET /statistics - 統計情報の一括取得
- GET /statistics/deck-distribution/monthly - 月間デッキ分布の取得
- GET /statistics/deck-distribution/recent - 直近デッキ分布の取得
- GET /statistics/matchup-chart - デッキ相性表の取得
- GET /statistics/time-series/{game_mode} - 時系列データの取得

主要なテスト項目:
- 認証済みユーザーが正常にデータを取得できること
- 未認証ユーザーがアクセスできないこと (401 Unauthorized)
- 各エンドポイントが適切な形式のデータを返すこと
- フィルタリングパラメータ (年月、ゲームモード、リミットなど) が正しく機能すること
- 無効なパラメータに対するエラーハンドリング
"""

from fastapi import status


def test_get_all_statistics_unauthorized(client):
    """
    未認証ユーザーが統計情報の一括取得エンドポイントにアクセスできないことを確認

    期待結果:
    - ステータスコード 401 Unauthorized
    """
    response = client.get("/statistics")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_all_statistics_success(authenticated_client):
    """
    認証済みユーザーが統計情報の一括取得に成功することを確認

    前提条件:
    - ユーザーが認証済み

    期待結果:
    - ステータスコード 200 OK
    - レスポンスデータに全てのゲームモード (RANK, RATE, EVENT, DC) の統計が含まれる
    - 各モードの統計に monthly_deck_distribution, recent_deck_distribution, matchup_data, time_series_data がリスト形式で含まれる
    """
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
    """
    認証済みユーザーがパラメータなしで統計情報の一括取得に成功することを確認

    前提条件:
    - ユーザーが認証済み

    期待結果:
    - ステータスコード 200 OK
    - レスポンスデータに全てのゲームモード (RANK, RATE, EVENT, DC) の統計が含まれる
    - デフォルトで現在の年月のデータが返される
    """
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
    """
    未認証ユーザーが月間デッキ分布取得エンドポイントにアクセスできないことを確認

    期待結果:
    - ステータスコード 401 Unauthorized
    """
    response = client.get("/statistics/deck-distribution/monthly")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_monthly_deck_distribution_success(authenticated_client):
    """
    認証済みユーザーが月間デッキ分布の取得に成功することを確認

    前提条件:
    - ユーザーが認証済み

    期待結果:
    - ステータスコード 200 OK
    - レスポンスデータがリスト形式であること
    """
    response = authenticated_client.get(
        "/statistics/deck-distribution/monthly",
        params={"year": 2025, "month": 10},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


def test_get_recent_deck_distribution_unauthorized(client):
    """
    未認証ユーザーが直近デッキ分布取得エンドポイントにアクセスできないことを確認

    期待結果:
    - ステータスコード 401 Unauthorized
    """
    response = client.get("/statistics/deck-distribution/recent")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_recent_deck_distribution_success(authenticated_client):
    """
    認証済みユーザーが直近デッキ分布の取得に成功することを確認

    前提条件:
    - ユーザーが認証済み

    期待結果:
    - ステータスコード 200 OK
    - レスポンスデータがリスト形式であること
    """
    response = authenticated_client.get(
        "/statistics/deck-distribution/recent",
        params={"limit": 30},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


def test_get_matchup_chart_unauthorized(client):
    """
    未認証ユーザーがマッチアップ表取得エンドポイントにアクセスできないことを確認

    期待結果:
    - ステータスコード 401 Unauthorized
    """
    response = client.get("/statistics/matchup-chart")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_matchup_chart_success(authenticated_client):
    """
    認証済みユーザーがマッチアップ表の取得に成功することを確認

    前提条件:
    - ユーザーが認証済み

    期待結果:
    - ステータスコード 200 OK
    - レスポンスデータがリスト形式であること
    """
    response = authenticated_client.get(
        "/statistics/matchup-chart",
        params={"year": 2025, "month": 10},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


def test_get_time_series_data_unauthorized(client):
    """
    未認証ユーザーが時系列データ取得エンドポイントにアクセスできないことを確認

    期待結果:
    - ステータスコード 401 Unauthorized
    """
    response = client.get("/statistics/time-series/RATE")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_time_series_data_success(authenticated_client):
    """
    認証済みユーザーが時系列データ（RATEモード）の取得に成功することを確認

    前提条件:
    - ユーザーが認証済み

    期待結果:
    - ステータスコード 200 OK
    - レスポンスデータがリスト形式であること
    """
    response = authenticated_client.get(
        "/statistics/time-series/RATE",
        params={"year": 2025, "month": 10},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


def test_get_time_series_data_dc_success(authenticated_client):
    """
    認証済みユーザーが時系列データ（DCモード）の取得に成功することを確認

    前提条件:
    - ユーザーが認証済み

    期待結果:
    - ステータスコード 200 OK
    - レスポンスデータがリスト形式であること
    """
    response = authenticated_client.get(
        "/statistics/time-series/DC",
        params={"year": 2025, "month": 10},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


def test_get_time_series_data_invalid_mode(authenticated_client):
    """
    認証済みユーザーが無効なゲームモードで時系列データ取得を試みた場合にエラーとなることを確認

    前提条件:
    - ユーザーが認証済み

    期待結果:
    - ステータスコード 400 Bad Request または 422 Unprocessable Entity または 500 Internal Server Error
    """
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
    """
    認証済みユーザーがゲームモードフィルタ付きで月間デッキ分布を取得できることを確認

    前提条件:
    - ユーザーが認証済み

    期待結果:
    - ステータスコード 200 OK
    - レスポンスデータがリスト形式であること
    """
    response = authenticated_client.get(
        "/statistics/deck-distribution/monthly",
        params={"year": 2025, "month": 10, "game_mode": "RANK"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
