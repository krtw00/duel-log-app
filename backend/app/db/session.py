from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from ..core.config import settings

# DATABASE_URLをpsycopg3用に変換
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
elif database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)

# 接続引数の設定
connect_args = {}
if "sqlite" in database_url:
    # SQLiteの場合はcheck_same_threadのみ
    connect_args = {"check_same_thread": False}
elif "sslmode=require" in database_url or settings.ENVIRONMENT == "production":
    # NeonDBなど、SSL必須の場合
    # sslmodeパラメータはURLに含まれているので、追加の設定は不要
    # ただし、接続タイムアウトを設定
    connect_args = {
        "connect_timeout": 10,
    }

# DBエンジンの作成
engine_args = {
    "echo": settings.DATABASE_ECHO,
    "future": True,
    "connect_args": connect_args,
}

if "sqlite" not in database_url:
    engine_args.update(
        {
            "pool_pre_ping": True,
            "pool_size": 20,
            "max_overflow": 0,
            "pool_recycle": 3600,
        }
    )

engine = create_engine(database_url, **engine_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
