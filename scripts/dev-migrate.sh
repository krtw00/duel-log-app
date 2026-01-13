#!/bin/bash
# ========================================
# Alembicマイグレーション実行スクリプト
# ローカルSupabase DBに対して実行します
# ========================================

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

# 色付き出力
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 引数がなければ upgrade head
COMMAND="${1:-upgrade head}"

echo -e "${GREEN}Running Alembic migration: $COMMAND${NC}"
echo ""

# ローカルSupabaseが起動しているか確認
if ! supabase status --project-id duel-log-app > /dev/null 2>&1; then
    echo -e "${YELLOW}Error: Local Supabase is not running.${NC}"
    echo "Run 'scripts/dev-supabase.sh' first."
    exit 1
fi

cd "$BACKEND_DIR"

docker run --rm \
    --network host \
    -v "$BACKEND_DIR:/app" \
    -w /app \
    -e DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55322/postgres" \
    -e SUPABASE_URL="http://127.0.0.1:55321" \
    -e SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
    -e SUPABASE_JWT_SECRET="super-secret-jwt-token-with-at-least-32-characters-long" \
    -e SECRET_KEY="hrD0GEww5vtDXQoj/UxNHBXtH+SjgXeOJUNbrIX/l+Y=" \
    python:3.11-slim \
    bash -c "pip install -q alembic psycopg[binary] sqlalchemy pydantic-settings && alembic $COMMAND"

echo ""
echo -e "${GREEN}Migration completed.${NC}"
