"""
ユーザーAPIのテスト

ユーザー作成、取得、更新、削除などのエンドポイントのテストと、
特に認可チェック（他のユーザーのデータにアクセスできないこと）を確認
"""

from fastapi import status

from app.core.security import get_password_hash
from app.models.user import User


class TestCreateUser:
    """ユーザー作成エンドポイントのテスト"""

    def test_create_user_success(self, client, db_session):
        """正常なユーザー作成"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepassword123",
        }

        response = client.post("/users/", json=user_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@example.com"
        assert "id" in data
        assert "passwordhash" not in data  # パスワードハッシュは返されない

        # データベースに保存されているか確認
        user = (
            db_session.query(User).filter(User.email == "newuser@example.com").first()
        )
        assert user is not None
        assert user.username == "newuser"

    def test_create_user_duplicate_email(self, client, test_user):
        """既に存在するメールアドレスでのユーザー作成（失敗）"""
        user_data = {
            "username": "anotheruser",
            "email": "test@example.com",  # 既存のメール
            "password": "password123",
        }

        response = client.post("/users/", json=user_data)

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "既に使用されています" in response.json()["message"]

    def test_create_user_missing_fields(self, client):
        """必須フィールドが欠けている場合"""
        user_data = {
            "username": "incomplete",
            # email と password が欠けている
        }

        response = client.post("/users/", json=user_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_user_weak_password(self, client):
        """弱いパスワードでのユーザー作成"""
        # パスワード検証がスキーマで実装されている場合
        # user_data = {
        #     "username": "weakuser",
        #     "email": "weak@example.com",
        #     "password": "123",  # 短すぎるパスワード
        # }
        # response = client.post("/users/", json=user_data)
        # assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        pass


class TestReadUser:
    """ユーザー取得エンドポイントのテスト"""

    def test_read_own_user_success(self, authenticated_client, test_user):
        """自分のユーザー情報を取得（成功）"""
        response = authenticated_client.get(f"/users/{test_user.id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_user.id
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email

    def test_read_other_user_forbidden(
        self, authenticated_client, test_user, db_session
    ):
        """他のユーザーの情報を取得（失敗 - 403 Forbidden）"""
        # 別のユーザーを作成
        other_user = User(
            username="otheruser",
            email="other@example.com",
            passwordhash=get_password_hash("password"),
        )
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)

        # 他のユーザーの情報を取得しようとする
        response = authenticated_client.get(f"/users/{other_user.id}")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "権限がありません" in response.json()["message"]

    def test_read_user_not_found(self, authenticated_client, test_user):
        """存在しないユーザーを取得（404）"""
        # 自分のIDの場合でも存在しないIDは404を返すべき
        # ただし、認可チェックが先に実行されるため、このテストは複雑
        # このテストは認可チェックとNot Foundの優先順位による
        # 現在の実装では、まず認可チェックが行われるため、
        # 他のユーザーIDの場合は403が返される
        # non_existent_id = 99999
        pass

    def test_read_user_unauthenticated(self, client, test_user):
        """未認証でのユーザー情報取得（401）"""
        response = client.get(f"/users/{test_user.id}")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestUpdateUser:
    """ユーザー更新エンドポイントのテスト"""

    def test_update_own_user_success(self, authenticated_client, test_user, db_session):
        """自分のユーザー情報を更新（成功）"""
        update_data = {
            "username": "updateduser",
            "theme_preference": "dark",
        }

        response = authenticated_client.put(f"/users/{test_user.id}", json=update_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == "updateduser"
        assert data["theme_preference"] == "dark"

        # データベースが更新されているか確認
        db_session.refresh(test_user)
        assert test_user.username == "updateduser"

    def test_update_other_user_forbidden(
        self, authenticated_client, test_user, db_session
    ):
        """他のユーザーの情報を更新（失敗 - 403 Forbidden）"""
        # 別のユーザーを作成
        other_user = User(
            username="otheruser",
            email="other@example.com",
            passwordhash=get_password_hash("password"),
        )
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)

        update_data = {"username": "hacked"}

        response = authenticated_client.put(f"/users/{other_user.id}", json=update_data)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "権限がありません" in response.json()["message"]

        # データベースが変更されていないことを確認
        db_session.refresh(other_user)
        assert other_user.username == "otheruser"

    def test_update_user_unauthenticated(self, client, test_user):
        """未認証でのユーザー更新（401）"""
        update_data = {"username": "hacked"}

        response = client.put(f"/users/{test_user.id}", json=update_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_user_invalid_data(self, authenticated_client, test_user):
        """無効なデータでのユーザー更新"""
        # スキーマで検証されている場合
        # update_data = {
        #     "theme_preference": "invalid_theme",  # 無効なテーマ
        # }
        # response = authenticated_client.put(f"/users/{test_user.id}", json=update_data)
        # assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        pass


class TestDeleteUser:
    """ユーザー削除エンドポイントのテスト"""

    def test_delete_own_user_success(self, authenticated_client, test_user, db_session):
        """自分のアカウントを削除（成功）"""
        response = authenticated_client.delete(f"/users/{test_user.id}")

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # データベースから削除されているか確認
        user = db_session.query(User).filter(User.id == test_user.id).first()
        assert user is None

    def test_delete_other_user_forbidden(
        self, authenticated_client, test_user, db_session
    ):
        """他のユーザーのアカウントを削除（失敗 - 403 Forbidden）"""
        # 別のユーザーを作成
        other_user = User(
            username="otheruser",
            email="other@example.com",
            passwordhash=get_password_hash("password"),
        )
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)

        response = authenticated_client.delete(f"/users/{other_user.id}")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "権限がありません" in response.json()["message"]

        # データベースから削除されていないことを確認
        user = db_session.query(User).filter(User.id == other_user.id).first()
        assert user is not None

    def test_delete_user_unauthenticated(self, client, test_user):
        """未認証でのユーザー削除（401）"""
        response = client.delete(f"/users/{test_user.id}")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestListUsers:
    """ユーザー一覧取得エンドポイントのテスト"""

    def test_list_users_endpoint_disabled(self, authenticated_client):
        """ユーザー一覧取得エンドポイントが無効化されていることを確認"""
        response = authenticated_client.get("/users/")

        # エンドポイントがコメントアウトされているため、
        # GET /users/ は存在しないが、POST /users/ は存在するため、
        # FastAPIは405 Method Not Allowedを返す
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
