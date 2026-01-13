#!/bin/bash
# ========================================
# バックエンド開発サーバー起動スクリプト
# ローカルSupabaseに接続します
# ========================================

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

# 色付き出力
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting backend development server...${NC}"

# ローカルSupabaseが起動しているか確認
if ! supabase status --project-id duel-log-app > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Local Supabase is not running.${NC}"
    echo "Run 'supabase start' first, or use 'scripts/dev-all.sh'"
fi

# 環境変数を設定してバックエンドを起動
cd "$BACKEND_DIR"

export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55322/postgres"
export SUPABASE_URL="http://127.0.0.1:55321"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
export SUPABASE_JWT_SECRET="super-secret-jwt-token-with-at-least-32-characters-long"
export SECRET_KEY="hrD0GEww5vtDXQoj/UxNHBXtH+SjgXeOJUNbrIX/l+Y="
export ENVIRONMENT="development"
export FRONTEND_URL="http://localhost:5173"

echo -e "${GREEN}Environment: development${NC}"
echo -e "${GREEN}Database: Local Supabase (port 55322)${NC}"
echo -e "${GREEN}API URL: http://127.0.0.1:8000${NC}"
echo ""

# Dockerで起動（Python 3.11を使用）
docker run --rm -it \
    --network host \
    -v "$BACKEND_DIR:/app" \
    -w /app \
    -e DATABASE_URL \
    -e SUPABASE_URL \
    -e SUPABASE_ANON_KEY \
    -e SUPABASE_JWT_SECRET \
    -e SECRET_KEY \
    -e ENVIRONMENT \
    -e FRONTEND_URL \
    python:3.11-slim \
    bash -c "pip install -q -r requirements.txt && python start.py"
