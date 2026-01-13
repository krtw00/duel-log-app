# ========================================
# ビルドステージ：依存関係のコンパイル
# ========================================
FROM python:3.11-slim AS builder

WORKDIR /app

# ビルドツールのインストール
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# 依存関係のインストール（wheelとして保存）
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ========================================
# 実行ステージ：最小限の本番イメージ
# ========================================
FROM python:3.11-slim

WORKDIR /app

# PYTHONPATH設定
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# ランタイム依存関係のみインストール（gccは不要）
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libpq5 \
    postgresql-client && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# ビルドステージからPythonパッケージをコピー
COPY --from=builder /root/.local /root/.local

# PATHに.localを追加
ENV PATH=/root/.local/bin:$PATH

# アプリケーションコードのコピー（レイヤーキャッシュ最適化）
COPY alembic.ini .
COPY alembic ./alembic
COPY start.py .
COPY ./app ./app

# 起動スクリプトに実行権限付与
RUN chmod +x start.py

# コンテナ起動時にPythonスクリプトを実行
CMD ["python", "start.py"]
