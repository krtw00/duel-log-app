"""
テスト用の共通フィクスチャ
"""

import os

# Supabase設定をテスト用にモック（settingsインポート前に設定）
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only-32chars")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret-for-testing-only-32chars")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.deps import get_current_user, get_obs_overlay_user
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import get_db
from app.main import app
from app.models import Base
from app.models.user import User

# テスト用データベースURL
# Base は app.models から正しくインポートされています
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", settings.DATABASE_URL)

SQLALCHEMY_DATABASE_URL = TEST_DATABASE_URL

# DATABASE_URLをpsycopg3用に変換（PostgreSQLの場合）
if SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg://", 1
    )
elif SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgres://", "postgresql+psycopg://", 1
    )

# connect_argsはSQLiteの場合のみ設定
connect_args = {}
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """テスト用データベースセッション"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """テスト用クライアント"""

    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db_session):
    """テスト用ユーザー"""
    user = User(
        username="testuser",
        email="test@example.com",
        passwordhash=get_password_hash("testpassword"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def authenticated_client(db_session, test_user):
    """認証済みのテストクライアントを生成するフィクスチャ"""

    # データベースの依存性注入をオーバーライド
    def override_get_db():
        yield db_session

    # 認証をバイパスして常にtest_userを返す
    def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_obs_overlay_user] = override_get_current_user

    # TestClientを作成
    with TestClient(app) as client:
        yield client

    # 後処理
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_deck(db_session, test_user):
    """テスト用デッキ（プレイヤーデッキ）"""
    from app.models.deck import Deck

    deck = Deck(
        user_id=test_user.id,
        name="Test Deck",
        is_opponent=False,
    )
    db_session.add(deck)
    db_session.commit()
    db_session.refresh(deck)
    return deck


@pytest.fixture(scope="function")
def test_opponent_deck(db_session, test_user):
    """テスト用デッキ（相手デッキ）"""
    from app.models.deck import Deck

    deck = Deck(
        user_id=test_user.id,
        name="Test Opponent Deck",
        is_opponent=True,
    )
    db_session.add(deck)
    db_session.commit()
    db_session.refresh(deck)
    return deck


@pytest.fixture(scope="function")
def sample_duel_data():
    """テスト用の対戦データ"""
    from datetime import datetime, timezone

    return {
        "played_date": datetime.now(timezone.utc),
    }
