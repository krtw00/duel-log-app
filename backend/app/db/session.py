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

engine = create_engine(
    database_url, echo=settings.DATABASE_ECHO, future=True  # configから値を取得
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ここでBaseを再定義しない


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
