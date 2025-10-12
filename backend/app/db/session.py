from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import Base  # 正しいBaseをインポート

from ..core.config import settings

# DATABASE_URLをpsycopg3用に変換
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
elif database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)

# NeonDB用のSSL設定
connect_args = {}
if "sslmode=require" in database_url or settings.ENVIRONMENT == "production":
    # NeonDBなど、SSL必須の場合
    # sslmodeパラメータはURLに含まれているので、追加の設定は不要
    # ただし、接続タイムアウトを設定
    connect_args = {
        "connect_timeout": 10,
    }

engine = create_engine(
    database_url,
    echo=settings.DATABASE_ECHO,  # configから値を取得
    future=True,
    connect_args=connect_args,
    pool_pre_ping=True,  # 接続前にpingして接続が生きているか確認
    pool_size=20,  # 接続プールサイズ
    max_overflow=0,  # 最大オーバーフロー
    pool_recycle=3600,  # 1時間ごとに接続をリサイクル（NeonDBの接続タイムアウト対策）
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
