#!/bin/bash
# データベース接続待機とマイグレーション実行スクリプト

set -e

host="$1"
shift
cmd="$@"

echo "⏳ Waiting for database at $host..."

# データベースが起動するまで待機（最大60秒）
timeout=60
counter=0

until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$host" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>/dev/null; do
  counter=$((counter + 1))
  
  if [ $counter -gt $timeout ]; then
    echo "❌ Database connection timeout after ${timeout} seconds"
    exit 1
  fi
  
  echo "⏳ Waiting for database... (${counter}/${timeout})"
  sleep 1
done

echo "✅ Database is ready!"

# Alembicマイグレーション実行
echo "🔄 Running Alembic migrations..."
alembic upgrade head

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully!"
else
  echo "❌ Migration failed!"
  exit 1
fi

# Uvicornサーバー起動
echo "🚀 Starting Uvicorn server..."
exec $cmd
