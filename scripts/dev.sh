#!/bin/bash
# ========================================
# 開発環境一括起動スクリプト
# Supabase + Backend + Frontend を起動
# ========================================

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# 色付き出力
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# クリーンアップ関数
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"

    # バックエンドコンテナを停止
    if [ ! -z "$BACKEND_CONTAINER" ]; then
        docker stop "$BACKEND_CONTAINER" 2>/dev/null || true
    fi

    # フロントエンドプロセスを停止
    if [ ! -z "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi

    echo -e "${GREEN}All services stopped.${NC}"
    echo -e "${YELLOW}Note: Supabase is still running. Run './scripts/dev-stop.sh' to stop it.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Duel Log App - Development Server${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 1. ローカルSupabaseを起動
echo -e "${GREEN}[1/3] Starting Supabase...${NC}"
cd "$PROJECT_ROOT"

if supabase status --project-id duel-log-app > /dev/null 2>&1; then
    echo -e "${YELLOW}      Supabase is already running.${NC}"
else
    supabase start
fi

echo ""

# 2. バックエンドを起動（バックグラウンド）
echo -e "${GREEN}[2/3] Starting Backend...${NC}"

export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55322/postgres"
export SUPABASE_URL="http://127.0.0.1:55321"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
export SUPABASE_JWT_SECRET="super-secret-jwt-token-with-at-least-32-characters-long"
export SECRET_KEY="hrD0GEww5vtDXQoj/UxNHBXtH+SjgXeOJUNbrIX/l+Y="
export ENVIRONMENT="development"
export FRONTEND_URL="http://localhost:5173"

# バックエンドをDockerでバックグラウンド起動
BACKEND_CONTAINER=$(docker run -d --rm \
    --name duellog-backend-dev \
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
    bash -c "pip install -q -r requirements.txt && python start.py")

echo -e "${YELLOW}      Waiting for backend to start...${NC}"
sleep 5

# バックエンドのヘルスチェック
for i in {1..30}; do
    if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}      Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}      Backend failed to start. Check logs with: docker logs duellog-backend-dev${NC}"
        cleanup
        exit 1
    fi
    sleep 2
done

echo ""

# 3. フロントエンドを起動（フォアグラウンド）
echo -e "${GREEN}[3/3] Starting Frontend...${NC}"
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  All services are running!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "  Frontend:        ${GREEN}http://localhost:5173${NC}"
echo -e "  Backend API:     ${GREEN}http://127.0.0.1:8000${NC}"
echo -e "  Supabase Studio: ${GREEN}http://127.0.0.1:55323${NC}"
echo -e "  Mailpit:         ${GREEN}http://127.0.0.1:55324${NC}"
echo ""
echo -e "${YELLOW}  Press Ctrl+C to stop all services${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

# フロントエンドプロセスを待機
wait $FRONTEND_PID
