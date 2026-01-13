"""
認証APIのテスト

注意: メイン認証はSupabase Authに移行済み。
このファイルにはレガシー互換性とOBS連携のテストのみ残しています。
"""

from fastapi import status


class TestLogout:
    """ログアウトエンドポイントのテスト（レガシーCookieクリア用）"""

    def test_logout_success(self, client):
        """正常なログアウト"""
        response = client.post("/auth/logout")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Logout successful"

        # Cookieがクリアされているか確認
        cookies = response.cookies
        if "access_token" in cookies:
            assert cookies["access_token"] == ""


class TestOBSToken:
    """OBS専用トークンエンドポイントのテスト"""

    def test_get_obs_token_success(self, authenticated_client):
        """認証済みユーザーのOBSトークン取得"""
        response = authenticated_client.post("/auth/obs-token")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "obs_token" in data
        assert "expires_in" in data
        assert data["expires_in"] == 24 * 60 * 60  # 24時間
        assert data["scope"] == "obs_overlay"

    def test_get_obs_token_unauthenticated(self, client):
        """未認証ユーザーのOBSトークン取得（失敗）"""
        response = client.post("/auth/obs-token")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
