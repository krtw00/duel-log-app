"""
OBS統計API のテスト
"""

from fastapi import status


def test_get_obs_statistics_unauthorized(client):
    """未認証でOBS統計取得を試みる"""
    response = client.get("/statistics/obs")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_obs_statistics_recent_success(authenticated_client):
    """直近N戦のOBS統計情報の取得が成功する"""
    response = authenticated_client.get(
        "/statistics/obs",
        params={"period_type": "recent", "limit": 30},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # 統計情報の必須フィールドを確認
    assert "total_duels" in data
    assert "win_rate" in data
    assert isinstance(data["total_duels"], int)
    assert isinstance(data["win_rate"], (int, float))


def test_get_obs_statistics_monthly_success(authenticated_client):
    """月間のOBS統計情報の取得が成功する"""
    response = authenticated_client.get(
        "/statistics/obs",
        params={"period_type": "monthly", "year": 2025, "month": 10},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # 統計情報の必須フィールドを確認
    assert "total_duels" in data
    assert "win_rate" in data


def test_get_obs_statistics_all_time_success(authenticated_client):
    """全期間のOBS統計情報の取得が成功する"""
    response = authenticated_client.get(
        "/statistics/obs",
        params={"period_type": "all"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # 統計情報の必須フィールドを確認
    assert "total_duels" in data
    assert "win_rate" in data


def test_get_obs_statistics_with_game_mode(authenticated_client):
    """ゲームモードフィルタ付きでOBS統計を取得"""
    response = authenticated_client.get(
        "/statistics/obs",
        params={"period_type": "recent", "limit": 30, "game_mode": "RANK"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # 統計情報を確認
    assert "total_duels" in data
    assert "win_rate" in data


def test_get_obs_statistics_monthly_without_year_month(authenticated_client):
    """年月を指定せずに月間統計を取得（デフォルトで現在の年月）"""
    response = authenticated_client.get(
        "/statistics/obs",
        params={"period_type": "monthly"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # 現在の年月のデータが返される
    assert "total_duels" in data
    assert "win_rate" in data


def test_get_obs_statistics_limit_validation(authenticated_client):
    """limit パラメータのバリデーション"""
    # limit が範囲外（101）
    response = authenticated_client.get(
        "/statistics/obs",
        params={"period_type": "recent", "limit": 101},
    )
    # バリデーションエラー
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # limit が範囲外（0）
    response = authenticated_client.get(
        "/statistics/obs",
        params={"period_type": "recent", "limit": 0},
    )
    # バリデーションエラー
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_get_obs_statistics_default_period_type(authenticated_client):
    """period_type のデフォルト値（recent）"""
    response = authenticated_client.get("/statistics/obs")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # デフォルトで直近の統計が返される
    assert "total_duels" in data
    assert "win_rate" in data


def test_get_obs_statistics_with_all_game_modes(authenticated_client):
    """全てのゲームモードでOBS統計を取得できる"""
    game_modes = ["RANK", "RATE", "EVENT", "DC"]

    for game_mode in game_modes:
        response = authenticated_client.get(
            "/statistics/obs",
            params={"period_type": "recent", "limit": 30, "game_mode": game_mode},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_duels" in data
        assert "win_rate" in data


def test_get_obs_statistics_response_structure(authenticated_client):
    """OBS統計のレスポンス構造を確認"""
    response = authenticated_client.get(
        "/statistics/obs",
        params={"period_type": "recent", "limit": 30},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # 基本的な統計フィールド
    expected_fields = [
        "total_duels",
        "win_rate",
    ]

    for field in expected_fields:
        assert field in data, f"Expected field '{field}' not found in response"

    # 勝率は0から1の範囲
    if data["total_duels"] > 0:
        assert 0 <= data["win_rate"] <= 1, "win_rate should be between 0 and 1"


def test_get_obs_statistics_with_rank_rate_dc_fields(authenticated_client):
    """OBS統計レスポンスにcurrent_rank、current_rate、current_dcが含まれることを確認"""
    response = authenticated_client.get(
        "/statistics/obs",
        params={"period_type": "recent", "limit": 30},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # current_rank、current_rate、current_dcがレスポンスに含まれることを確認
    # これらのフィールドはオプショナルだが、APIレスポンスには常に含まれるべき
    assert "current_rank" in data, "current_rank field should exist in response"
    assert "current_rate" in data, "current_rate field should exist in response"
    assert "current_dc" in data, "current_dc field should exist in response"

    # フィールドが存在する場合、型を確認（Noneの場合は型チェックをスキップ）
    if data["current_rank"] is not None:
        assert isinstance(data["current_rank"], (int, str)), "current_rank should be int or string"
    if data["current_rate"] is not None:
        assert isinstance(data["current_rate"], (int, float)), "current_rate should be int or float"
    if data["current_dc"] is not None:
        assert isinstance(data["current_dc"], (int, float)), "current_dc should be int or float"
