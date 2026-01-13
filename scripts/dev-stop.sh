#!/bin/bash
# ========================================
# ローカルSupabase停止スクリプト
# ========================================

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 色付き出力
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$PROJECT_ROOT"

echo -e "${YELLOW}Stopping local Supabase...${NC}"
supabase stop

echo -e "${GREEN}Local Supabase stopped.${NC}"
