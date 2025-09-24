import os
from dotenv import load_dotenv

load_dotenv()  # .env を読み込む

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:password@db:5432/duellog")
