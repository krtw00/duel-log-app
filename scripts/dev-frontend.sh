#!/bin/bash
# ========================================
# フロントエンド開発サーバー起動スクリプト
# ローカルSupabaseに接続します
# ========================================

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# 色付き出力
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Starting frontend development server...${NC}"
echo -e "${GREEN}URL: http://localhost:5173${NC}"
echo ""

cd "$FRONTEND_DIR"

# .env.local が設定されていれば自動的に読み込まれる
npm run dev
