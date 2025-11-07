FROM python:3.14-slim

WORKDIR /app

# Set PYTHONPATH to include the current directory, making 'app' discoverable
ENV PYTHONPATH=/app

# システム依存関係のインストール（PostgreSQLクライアントを含む）
RUN apt-get update && \
    apt-get install -y gcc libpq-dev postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# Pythonパッケージのインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードのコピー
COPY ./app ./app
COPY alembic.ini .
COPY alembic ./alembic
COPY start.py .

# 起動スクリプトに実行権限付与
RUN chmod +x start.py

# コンテナ起動時にPythonスクリプトを実行
CMD ["python", "start.py"]
