from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..core.config import settings
from app.models import Base  # 正しいBaseをインポート

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,  # configから値を取得
    future=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ここでBaseを再定義しない

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
