#!/bin/bash
# ========================================
# ローカルSupabase起動スクリプト
# ========================================

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 色付き出力
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

cd "$PROJECT_ROOT"

# すでに起動しているか確認
if npx supabase status --project-id duel-log-app > /dev/null 2>&1; then
    echo -e "${YELLOW}Local Supabase is already running.${NC}"
    npx supabase status
    exit 0
fi

echo -e "${GREEN}Starting local Supabase...${NC}"
npx supabase start

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Local Supabase URLs${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "Studio:   ${GREEN}http://127.0.0.1:55323${NC}"
echo -e "API:      ${GREEN}http://127.0.0.1:55321${NC}"
echo -e "Database: ${GREEN}postgresql://postgres:postgres@127.0.0.1:55322/postgres${NC}"
echo -e "Mailpit:  ${GREEN}http://127.0.0.1:55324${NC}"
echo -e "${CYAN}========================================${NC}"
