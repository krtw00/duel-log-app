"""
ユーザーステータス（suspended/deleted）のアクセス制御テスト
"""

from unittest.mock import patch

import pytest
from fastapi import status

from app.core.security import get_password_hash
from app.models.user import User


class TestUserStatusAccessControl:
    """user.statusによるアクセス制御のテスト"""

    @pytest.fixture
    def active_user(self, db_session):
        """activeステータスのユーザー"""
        user = User(
            username="activeuser",
            email="active@example.com",
            passwordhash=get_password_hash("password"),
            supabase_uuid="active-uuid-123",
            status="active",
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def suspended_user(self, db_session):
        """suspendedステータスのユーザー"""
        user = User(
            username="suspendeduser",
            email="suspended@example.com",
            passwordhash=get_password_hash("password"),
            supabase_uuid="suspended-uuid-456",
            status="suspended",
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def deleted_user(self, db_session):
        """deletedステータスのユーザー"""
        user = User(
            username="deleteduser",
            email="deleted@example.com",
            passwordhash=get_password_hash("password"),
            supabase_uuid="deleted-uuid-789",
            status="deleted",
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    def test_active_user_can_access_api(self, client, db_session, active_user):
        """activeステータスのユーザーはAPIにアクセスできる"""
        # Supabase JWTトークンをモック
        with patch("app.api.deps.verify_supabase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": active_user.supabase_uuid,
                "email": active_user.email,
            }

            # /meエンドポイントにアクセス
            response = client.get(
                "/me",
                headers={"Authorization": "Bearer fake-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["username"] == "activeuser"

    def test_suspended_user_cannot_access_api(self, client, db_session, suspended_user):
        """suspendedステータスのユーザーはAPIアクセスで403を返す"""
        # Supabase JWTトークンをモック
        with patch("app.api.deps.verify_supabase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": suspended_user.supabase_uuid,
                "email": suspended_user.email,
            }

            # /meエンドポイントにアクセス
            response = client.get(
                "/me",
                headers={"Authorization": "Bearer fake-token"},
            )

            assert response.status_code == status.HTTP_403_FORBIDDEN
            data = response.json()
            assert "一時停止" in data["message"]

    def test_deleted_user_cannot_access_api(self, client, db_session, deleted_user):
        """deletedステータスのユーザーはAPIアクセスで403を返す"""
        # Supabase JWTトークンをモック
        with patch("app.api.deps.verify_supabase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": deleted_user.supabase_uuid,
                "email": deleted_user.email,
            }

            # /meエンドポイントにアクセス
            response = client.get(
                "/me",
                headers={"Authorization": "Bearer fake-token"},
            )

            assert response.status_code == status.HTTP_403_FORBIDDEN
            data = response.json()
            assert "削除" in data["message"]

    def test_suspended_user_cannot_access_duels_api(
        self, client, db_session, suspended_user
    ):
        """suspendedユーザーは他のエンドポイント（/duels）でも403を返す"""
        with patch("app.api.deps.verify_supabase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": suspended_user.supabase_uuid,
                "email": suspended_user.email,
            }

            # /duels/エンドポイントにアクセス
            response = client.get(
                "/duels/",
                headers={"Authorization": "Bearer fake-token"},
            )

            assert response.status_code == status.HTTP_403_FORBIDDEN
            data = response.json()
            assert "一時停止" in data["message"]

    def test_deleted_user_cannot_create_deck(self, client, db_session, deleted_user):
        """deletedユーザーはデッキ作成もできない"""
        with patch("app.api.deps.verify_supabase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": deleted_user.supabase_uuid,
                "email": deleted_user.email,
            }

            # /decks/エンドポイントにアクセス
            response = client.post(
                "/decks/",
                headers={"Authorization": "Bearer fake-token"},
                json={"name": "Test Deck", "is_opponent": False},
            )

            assert response.status_code == status.HTTP_403_FORBIDDEN
            data = response.json()
            assert "削除" in data["message"]


class TestOBSOverlayUserStatusAccessControl:
    """OBSオーバーレイのuser.statusアクセス制御テスト"""

    @pytest.fixture
    def active_user(self, db_session):
        """activeステータスのユーザー"""
        user = User(
            username="activeuser_obs",
            email="active_obs@example.com",
            passwordhash=get_password_hash("password"),
            supabase_uuid="active-obs-uuid-123",
            status="active",
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def suspended_user(self, db_session):
        """suspendedステータスのユーザー"""
        user = User(
            username="suspendeduser_obs",
            email="suspended_obs@example.com",
            passwordhash=get_password_hash("password"),
            supabase_uuid="suspended-obs-uuid-456",
            status="suspended",
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    def test_active_user_can_access_obs_overlay(self, client, db_session, active_user):
        """activeユーザーはOBSオーバーレイにアクセスできる"""
        with patch("app.api.deps.verify_supabase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": active_user.supabase_uuid,
                "email": active_user.email,
            }

            # OBSオーバーレイエンドポイントにアクセス
            response = client.get(
                "/statistics/obs",
                headers={"Authorization": "Bearer fake-token"},
            )

            # 200または404（データがない場合）を期待
            assert response.status_code in [
                status.HTTP_200_OK,
                status.HTTP_404_NOT_FOUND,
            ]

    def test_suspended_user_cannot_access_obs_overlay(
        self, client, db_session, suspended_user
    ):
        """suspendedユーザーはOBSオーバーレイで403を返す"""
        with patch("app.api.deps.verify_supabase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": suspended_user.supabase_uuid,
                "email": suspended_user.email,
            }

            # OBSオーバーレイエンドポイントにアクセス
            response = client.get(
                "/statistics/obs",
                headers={"Authorization": "Bearer fake-token"},
            )

            assert response.status_code == status.HTTP_403_FORBIDDEN
            data = response.json()
            assert "OBSオーバーレイ" in data["message"]
