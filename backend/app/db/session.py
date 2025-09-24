from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    echo=True,           # SQLログ出力
    future=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 依存関係で使用する関数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
