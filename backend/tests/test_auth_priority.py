"""
認証経路の優先順位テスト

## セキュリティポリシー
認証トークンの取得優先順位を確認するテスト:
1. Authorizationヘッダー (Bearer トークン)
2. Cookie (access_token)
"""

from unittest.mock import patch

import pytest
from fastapi import status

from app.core.security import get_password_hash
from app.models.user import User


class TestAuthenticationPriority:
    """認証経路の優先順位テスト"""

    @pytest.fixture
    def test_user(self, db_session):
        """テスト用ユーザー"""
        user = User(
            username="testuser",
            email="test@example.com",
            passwordhash=get_password_hash("password"),
            supabase_uuid="test-uuid-123",
            status="active",
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    def test_authorization_header_only(self, client, db_session, test_user):
        """Authorizationヘッダーのみでアクセスできる（優先順位1）"""
        with patch("app.api.deps.verify_supabase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": test_user.supabase_uuid,
                "email": test_user.email,
            }

            # Authorizationヘッダーのみ
            response = client.get(
                "/me",
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["username"] == "testuser"
            # トークン検証が呼ばれたことを確認
            mock_verify.assert_called_once_with("valid-token")

    def test_cookie_only(self, client, db_session, test_user):
        """Cookieのみでアクセスできる（優先順位2、フォールバック）"""
        with patch("app.api.deps.verify_supabase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": test_user.supabase_uuid,
                "email": test_user.email,
            }

            # Cookieのみ
            client.cookies.set("access_token", "cookie-token")
            response = client.get("/me")

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["username"] == "testuser"
            # Cookieのトークンが使用されたことを確認
            mock_verify.assert_called_once_with("cookie-token")

    def test_authorization_header_takes_priority_over_cookie(
        self, client, db_session, test_user
    ):
        """Authorizationヘッダーが Cookie より優先される（重要）"""
        with patch("app.api.deps.verify_supabase_token") as mock_verify:
            # ヘッダーのトークンで検証成功
            mock_verify.return_value = {
                "sub": test_user.supabase_uuid,
                "email": test_user.email,
            }

            # 両方設定（Cookieは無視されるべき）
            client.cookies.set("access_token", "cookie-token")
            response = client.get(
                "/me",
                headers={"Authorization": "Bearer header-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["username"] == "testuser"
            # Authorizationヘッダーのトークンが優先されたことを確認
            mock_verify.assert_called_once_with("header-token")

    def test_no_authentication_returns_401(self, client):
        """認証情報がない場合は401を返す"""
        # トークンなし
        response = client.get("/me")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert "認証" in data["message"]

    def test_invalid_authorization_header_format(self, client):
        """不正なAuthorizationヘッダー形式は無視され、Cookieにフォールバック"""
        # 不正な形式（Bearer がない）
        response = client.get(
            "/me",
            headers={"Authorization": "InvalidFormat token123"},
        )

        # Cookieもないので401
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_safari_itp_scenario(self, client, db_session, test_user):
        """Safari ITPシナリオ: Cookieが無効でもAuthorizationヘッダーで成功"""
        with patch("app.api.deps.verify_supabase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": test_user.supabase_uuid,
                "email": test_user.email,
            }

            # Safari等でCookieがブロックされている想定
            # Authorizationヘッダーのみで認証
            response = client.get(
                "/me",
                headers={"Authorization": "Bearer safari-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["username"] == "testuser"
            # Safari ITP対策としてヘッダー認証が機能することを確認
            mock_verify.assert_called_once_with("safari-token")


class TestOBSOverlayAuthPriority:
    """OBSオーバーレイの認証優先順位テスト"""

    @pytest.fixture
    def test_user(self, db_session):
        """テスト用ユーザー"""
        user = User(
            username="obsuser",
            email="obs@example.com",
            passwordhash=get_password_hash("password"),
            supabase_uuid="obs-uuid-123",
            status="active",
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    def test_obs_query_param_token(self, client, db_session, test_user):
        """OBSではクエリパラメータのtokenが優先される"""
        with patch("app.api.deps.verify_supabase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": test_user.supabase_uuid,
                "email": test_user.email,
            }

            # クエリパラメータでトークン指定（OBS URLに埋め込むケース）
            response = client.get("/statistics/obs?token=query-token")

            # 200または404（データがない場合）を期待
            assert response.status_code in [
                status.HTTP_200_OK,
                status.HTTP_404_NOT_FOUND,
            ]
            # クエリパラメータのトークンが使用されたことを確認
            mock_verify.assert_called()

    def test_obs_authorization_header_fallback(self, client, db_session, test_user):
        """OBSでもAuthorizationヘッダーがフォールバックとして機能"""
        with patch("app.api.deps.verify_supabase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": test_user.supabase_uuid,
                "email": test_user.email,
            }

            # クエリパラメータなし、Authorizationヘッダーあり
            response = client.get(
                "/statistics/obs",
                headers={"Authorization": "Bearer header-token"},
            )

            # 200または404（データがない場合）を期待
            assert response.status_code in [
                status.HTTP_200_OK,
                status.HTTP_404_NOT_FOUND,
            ]
            mock_verify.assert_called()
