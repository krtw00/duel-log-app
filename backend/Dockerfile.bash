FROM python:3.11-slim

WORKDIR /app

# システム依存関係のインストール（PostgreSQLクライアントを含む）
RUN apt-get update && \
    apt-get install -y gcc libpq-dev postgresql-client dos2unix && \
    rm -rf /var/lib/apt/lists/*

# Pythonパッケージのインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードのコピー
COPY ./app ./app
COPY alembic.ini .
COPY alembic ./alembic

# 待機スクリプトのコピーと実行権限付与
COPY wait-for-db.sh .
RUN dos2unix wait-for-db.sh && chmod +x wait-for-db.sh

# コンテナ起動時にデータベース待機 → マイグレーション → Uvicorn起動
CMD ["./wait-for-db.sh", "db", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
