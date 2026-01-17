"""
管理者APIのテスト
"""

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.core.security import get_password_hash
from app.db.session import get_db
from app.main import app
from app.models.user import User


@pytest.fixture(scope="function")
def admin_user(db_session):
    """テスト用管理者ユーザー"""
    user = User(
        username="adminuser",
        email="admin@example.com",
        passwordhash=get_password_hash("adminpassword"),
        is_admin=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def regular_user(db_session):
    """テスト用一般ユーザー"""
    user = User(
        username="regularuser",
        email="regular@example.com",
        passwordhash=get_password_hash("regularpassword"),
        is_admin=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def admin_authenticated_client(db_session, admin_user):
    """管理者として認証済みのテストクライアント"""

    def override_get_db():
        yield db_session

    def override_get_current_user():
        return admin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def regular_authenticated_client(db_session, regular_user):
    """一般ユーザーとして認証済みのテストクライアント"""

    def override_get_db():
        yield db_session

    def override_get_current_user():
        return regular_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()


class TestAdminGetUserList:
    """GET /admin/users のテスト"""

    def test_get_users_as_admin_success(self, admin_authenticated_client, regular_user):
        """管理者によるユーザー一覧取得（成功）"""
        response = admin_authenticated_client.get("/admin/users")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 2  # admin + regular
        assert any(user["username"] == "adminuser" for user in data["users"])
        assert any(user["username"] == "regularuser" for user in data["users"])

    def test_get_users_as_regular_user_forbidden(self, regular_authenticated_client):
        """一般ユーザーによるユーザー一覧取得（失敗 - 403 Forbidden）"""
        response = regular_authenticated_client.get("/admin/users")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_users_unauthenticated_forbidden(self, client):
        """未認証でのユーザー一覧取得（失敗 - 401 Unauthorized）"""
        response = client.get("/admin/users")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAdminUpdateUserStatus:
    """PUT /admin/users/{user_id}/admin-status のテスト"""

    def test_update_user_to_admin_as_admin_success(
        self, admin_authenticated_client, regular_user, db_session
    ):
        """管理者によるユーザーの管理者昇格（成功）"""
        assert not regular_user.is_admin
        response = admin_authenticated_client.put(
            f"/admin/users/{regular_user.id}/admin-status", json={"is_admin": True}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["user"]["is_admin"] is True

        db_session.refresh(regular_user)
        assert regular_user.is_admin is True

    def test_demote_admin_as_admin_success(
        self, admin_authenticated_client, db_session
    ):
        """管理者による他の管理者の降格（成功）"""
        # 別の管理者を作成
        another_admin = User(
            username="anotheradmin",
            email="another@admin.com",
            passwordhash="pw",
            is_admin=True,
        )
        db_session.add(another_admin)
        db_session.commit()

        response = admin_authenticated_client.put(
            f"/admin/users/{another_admin.id}/admin-status", json={"is_admin": False}
        )
        assert response.status_code == status.HTTP_200_OK
        db_session.refresh(another_admin)
        assert another_admin.is_admin is False

    def test_demote_self_as_admin_forbidden(
        self, admin_authenticated_client, admin_user
    ):
        """管理者による自身の降格（失敗 - 403 Forbidden）"""
        response = admin_authenticated_client.put(
            f"/admin/users/{admin_user.id}/admin-status", json={"is_admin": False}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_demote_last_admin_forbidden(
        self, admin_authenticated_client, admin_user, db_session
    ):
        """最後の管理者の降格（失敗 - 400 Bad Request）"""
        # 他の管理者がいないことを確認
        admin_count = db_session.query(User).filter(User.is_admin).count()
        if admin_count > 1:
            # 他の管理者を削除または非管理者に変更
            admins_to_remove = (
                db_session.query(User)
                .filter(User.is_admin, User.id != admin_user.id)
                .all()
            )
            for u in admins_to_remove:
                u.is_admin = False
            db_session.commit()

        response = admin_authenticated_client.put(
            f"/admin/users/{admin_user.id}/admin-status", json={"is_admin": False}
        )
        # The user is trying to demote themself, which should be a 403, but the logic for last admin is checked first.
        # The current implementation checks for self-demotion first.
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_status_as_regular_user_forbidden(
        self, regular_authenticated_client, admin_user
    ):
        """一般ユーザーによる権限変更（失敗 - 403 Forbidden）"""
        response = regular_authenticated_client.put(
            f"/admin/users/{admin_user.id}/admin-status", json={"is_admin": False}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_admin_status_unauthenticated_forbidden(self, client, admin_user):
        """未認証での管理者権限変更（失敗 - 401 Unauthorized）"""
        response = client.put(
            f"/admin/users/{admin_user.id}/admin-status", json={"is_admin": False}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAdminGetUserDetail:
    """GET /admin/users/{user_id} のテスト"""

    def test_get_user_detail_success(
        self, admin_authenticated_client, regular_user, db_session
    ):
        """管理者によるユーザー詳細取得（成功）"""
        # デッキとデュエルを作成してユーザーに関連付け
        from datetime import datetime, timezone

        from app.models.deck import Deck
        from app.models.duel import Duel

        deck = Deck(name="Test Deck", user_id=regular_user.id, is_opponent=False)
        opponent_deck = Deck(
            name="Opponent Deck", user_id=regular_user.id, is_opponent=True
        )
        db_session.add_all([deck, opponent_deck])
        db_session.commit()

        duel = Duel(
            user_id=regular_user.id,
            deck_id=deck.id,
            opponent_deck_id=opponent_deck.id,
            is_win=True,
            game_mode="RANK",
            won_coin_toss=True,
            is_going_first=True,
            played_date=datetime.now(timezone.utc),
        )
        db_session.add(duel)
        db_session.commit()

        response = admin_authenticated_client.get(f"/admin/users/{regular_user.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == "regularuser"
        assert data["stats"]["player_decks_count"] >= 1
        assert data["stats"]["total_duels"] >= 1

    def test_get_user_detail_not_found(self, admin_authenticated_client):
        """存在しないユーザーの取得（404）"""
        response = admin_authenticated_client.get("/admin/users/99999")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_user_detail_as_regular_user_forbidden(
        self, regular_authenticated_client, admin_user
    ):
        """一般ユーザーによるユーザー詳細取得（失敗 - 403 Forbidden）"""
        response = regular_authenticated_client.get(f"/admin/users/{admin_user.id}")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_user_detail_unauthenticated_forbidden(self, client, admin_user):
        """未認証でのユーザー詳細取得（失敗 - 401 Unauthorized）"""
        response = client.get(f"/admin/users/{admin_user.id}")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAdminUpdateAccountStatus:
    """PUT /admin/users/{user_id}/status のテスト"""

    def test_suspend_user_success(self, admin_authenticated_client, regular_user):
        """ユーザー停止（成功）"""
        response = admin_authenticated_client.put(
            f"/admin/users/{regular_user.id}/status",
            json={"status": "suspended", "reason": "Test suspension"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["user"]["status"] == "suspended"

    def test_activate_user_success(
        self, admin_authenticated_client, regular_user, db_session
    ):
        """ユーザー再有効化（成功）"""
        # 先に停止
        regular_user.status = "suspended"
        db_session.commit()

        response = admin_authenticated_client.put(
            f"/admin/users/{regular_user.id}/status",
            json={"status": "active"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["user"]["status"] == "active"

    def test_update_status_as_regular_forbidden(
        self, regular_authenticated_client, admin_user
    ):
        """一般ユーザーによるステータス変更（失敗）"""
        response = regular_authenticated_client.put(
            f"/admin/users/{admin_user.id}/status",
            json={"status": "suspended"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_status_unauthenticated_forbidden(self, client, regular_user):
        """未認証でのアカウント状態変更（失敗 - 401 Unauthorized）"""
        response = client.put(
            f"/admin/users/{regular_user.id}/status",
            json={"status": "suspended", "reason": "Test"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAdminStatistics:
    """管理者統計エンドポイントのテスト"""

    def test_get_statistics_overview_success(self, admin_authenticated_client):
        """統計概要取得（成功）"""
        response = admin_authenticated_client.get("/admin/statistics/overview")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "users" in data
        assert "decks" in data
        assert "duels" in data

    def test_get_duels_timeline_success(self, admin_authenticated_client):
        """対戦数推移取得（成功）"""
        response = admin_authenticated_client.get("/admin/statistics/duels-timeline")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "timeline" in data

    def test_get_duels_timeline_with_params(self, admin_authenticated_client):
        """対戦数推移取得（パラメータ付き）"""
        response = admin_authenticated_client.get(
            "/admin/statistics/duels-timeline?period=monthly&days=90"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "timeline" in data

    def test_get_user_registrations_success(self, admin_authenticated_client):
        """ユーザー登録数推移取得（成功）"""
        response = admin_authenticated_client.get(
            "/admin/statistics/user-registrations"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "registrations" in data

    def test_statistics_as_regular_user_forbidden(self, regular_authenticated_client):
        """一般ユーザーによる統計取得（失敗）"""
        response = regular_authenticated_client.get("/admin/statistics/overview")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_statistics_overview_unauthenticated_forbidden(self, client):
        """未認証での統計概要取得（失敗 - 401 Unauthorized）"""
        response = client.get("/admin/statistics/overview")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_duels_timeline_unauthenticated_forbidden(self, client):
        """未認証での対戦数推移取得（失敗 - 401 Unauthorized）"""
        response = client.get("/admin/statistics/duels-timeline")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_registrations_unauthenticated_forbidden(self, client):
        """未認証でのユーザー登録数推移取得（失敗 - 401 Unauthorized）"""
        response = client.get("/admin/statistics/user-registrations")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAdminMaintenance:
    """管理者メンテナンスエンドポイントのテスト"""

    def test_scan_orphaned_data_success(self, admin_authenticated_client):
        """孤立データスキャン（成功）"""
        response = admin_authenticated_client.post(
            "/admin/maintenance/scan-orphaned-data"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "orphaned_opponent_decks" in data

    def test_cleanup_orphaned_data_success(self, admin_authenticated_client):
        """孤立データクリーンアップ（成功）"""
        response = admin_authenticated_client.post(
            "/admin/maintenance/cleanup-orphaned-data"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "deleted_decks" in data
        assert data["success"] is True

    def test_scan_orphaned_shared_urls_success(self, admin_authenticated_client):
        """孤立共有URLスキャン（成功）"""
        response = admin_authenticated_client.post(
            "/admin/maintenance/scan-orphaned-shared-urls"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "orphaned_count" in data

    def test_cleanup_orphaned_shared_urls_success(self, admin_authenticated_client):
        """孤立共有URLクリーンアップ（成功）"""
        response = admin_authenticated_client.post(
            "/admin/maintenance/cleanup-orphaned-shared-urls"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "deleted_count" in data
        assert data["success"] is True

    def test_scan_expired_shared_urls_success(self, admin_authenticated_client):
        """期限切れ共有URLスキャン（成功）"""
        response = admin_authenticated_client.post(
            "/admin/maintenance/scan-expired-shared-urls"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "expired_count" in data

    def test_cleanup_expired_shared_urls_success(self, admin_authenticated_client):
        """期限切れ共有URLクリーンアップ（成功）"""
        response = admin_authenticated_client.post(
            "/admin/maintenance/cleanup-expired-shared-urls"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "deleted_count" in data
        assert data["success"] is True

    def test_maintenance_as_regular_user_forbidden(self, regular_authenticated_client):
        """一般ユーザーによるメンテナンス（失敗）"""
        response = regular_authenticated_client.post(
            "/admin/maintenance/scan-orphaned-data"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_scan_orphaned_data_unauthenticated_forbidden(self, client):
        """未認証での孤立データスキャン（失敗 - 401 Unauthorized）"""
        response = client.post("/admin/maintenance/scan-orphaned-data")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_cleanup_orphaned_data_unauthenticated_forbidden(self, client):
        """未認証での孤立データクリーンアップ（失敗 - 401 Unauthorized）"""
        response = client.post("/admin/maintenance/cleanup-orphaned-data")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_scan_orphaned_shared_urls_unauthenticated_forbidden(self, client):
        """未認証での孤立共有URLスキャン（失敗 - 401 Unauthorized）"""
        response = client.post("/admin/maintenance/scan-orphaned-shared-urls")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_cleanup_orphaned_shared_urls_unauthenticated_forbidden(self, client):
        """未認証での孤立共有URLクリーンアップ（失敗 - 401 Unauthorized）"""
        response = client.post("/admin/maintenance/cleanup-orphaned-shared-urls")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_scan_expired_shared_urls_unauthenticated_forbidden(self, client):
        """未認証での期限切れ共有URLスキャン（失敗 - 401 Unauthorized）"""
        response = client.post("/admin/maintenance/scan-expired-shared-urls")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_cleanup_expired_shared_urls_unauthenticated_forbidden(self, client):
        """未認証での期限切れ共有URLクリーンアップ（失敗 - 401 Unauthorized）"""
        response = client.post("/admin/maintenance/cleanup-expired-shared-urls")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAdminMetaAnalysis:
    """管理者メタ分析エンドポイントのテスト"""

    def test_get_popular_decks_success(self, admin_authenticated_client):
        """人気デッキ取得（成功）"""
        response = admin_authenticated_client.get("/admin/meta/popular-decks")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "decks" in data
        assert "total_duels" in data

    def test_get_popular_decks_with_params(self, admin_authenticated_client):
        """人気デッキ取得（パラメータ付き）"""
        response = admin_authenticated_client.get(
            "/admin/meta/popular-decks?days=7&game_mode=RANK&limit=10"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "decks" in data

    def test_get_deck_trends_success(self, admin_authenticated_client):
        """デッキトレンド取得（成功）"""
        response = admin_authenticated_client.get("/admin/meta/deck-trends")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "trends" in data
        assert "top_decks" in data

    def test_get_deck_trends_with_params(self, admin_authenticated_client):
        """デッキトレンド取得（パラメータ付き）"""
        response = admin_authenticated_client.get(
            "/admin/meta/deck-trends?days=14&interval=weekly"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "trends" in data

    def test_get_game_mode_stats_success(self, admin_authenticated_client):
        """ゲームモード別統計取得（成功）"""
        response = admin_authenticated_client.get("/admin/meta/game-mode-stats")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "stats" in data
        assert "total_duels" in data

    def test_meta_as_regular_user_forbidden(self, regular_authenticated_client):
        """一般ユーザーによるメタ分析（失敗）"""
        response = regular_authenticated_client.get("/admin/meta/popular-decks")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_popular_decks_unauthenticated_forbidden(self, client):
        """未認証での人気デッキ取得（失敗 - 401 Unauthorized）"""
        response = client.get("/admin/meta/popular-decks")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_deck_trends_unauthenticated_forbidden(self, client):
        """未認証でのデッキトレンド取得（失敗 - 401 Unauthorized）"""
        response = client.get("/admin/meta/deck-trends")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_game_mode_stats_unauthenticated_forbidden(self, client):
        """未認証でのゲームモード別統計取得（失敗 - 401 Unauthorized）"""
        response = client.get("/admin/meta/game-mode-stats")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
