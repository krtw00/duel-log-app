#!/bin/bash
# PM用進捗ダッシュボード（動的設定対応）

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="$(dirname "$PROJECT_ROOT")"
STATUS_DIR="$WORK_DIR/.parallel-dev-status"
CONFIG_FILE="$STATUS_DIR/current.conf"
SESSION=$(cat "$STATUS_DIR/session.name" 2>/dev/null || echo "duel-team")

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ ! -f "$CONFIG_FILE" ]; then
    echo "設定ファイルがありません: $CONFIG_FILE"
    echo "先に parallel-dev-setup.sh を実行してください"
    exit 1
fi

# ワーカー情報をパース
declare -a WORKERS=()
declare -A BRANCHES=()
declare -A ISSUES=()

while IFS=':' read -r worker branch issues || [ -n "$worker" ]; do
    [[ -z "$worker" || "$worker" =~ ^# ]] && continue
    WORKERS+=("$worker")
    BRANCHES["$worker"]="$branch"
    ISSUES["$worker"]="$issues"
done < "$CONFIG_FILE"

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           並列開発 進捗ダッシュボード                       ║"
echo "║           $(date '+%Y-%m-%d %H:%M:%S')                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd "$PROJECT_ROOT"

# 各ワーカーの状態表示
for i in "${!WORKERS[@]}"; do
    w="${WORKERS[$i]}"
    branch="${BRANCHES[$w]}"
    issues="${ISSUES[$w]}"
    pane=$((i + 1))

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "【${CYAN}$w${NC}】 $branch ($issues) ${BLUE}[Ctrl+b q → $pane]${NC}"

    # ステータスファイル確認
    if [ -f "$STATUS_DIR/$w.status" ]; then
        status=$(head -1 "$STATUS_DIR/$w.status")
        if [[ "$status" == COMPLETED* ]]; then
            echo -e "  ステータス: ${GREEN}$status${NC}"
        elif [[ "$status" == ERROR* ]]; then
            echo -e "  ステータス: ${RED}$status${NC}"
        else
            echo -e "  ステータス: ${YELLOW}$status${NC}"
        fi
        # 追加情報があれば表示
        if [ $(wc -l < "$STATUS_DIR/$w.status") -gt 1 ]; then
            tail -n +2 "$STATUS_DIR/$w.status" | sed 's/^/    /'
        fi
    else
        echo -e "  ステータス: ${YELLOW}⏳ 作業中${NC}"
    fi

    # 最新コミット
    echo ""
    echo "  📝 最新コミット:"
    git log "$branch" --oneline -2 2>/dev/null | sed 's/^/    /' || echo "    (コミットなし)"

    # developとの差分
    ahead=$(git rev-list --count develop.."$branch" 2>/dev/null || echo "0")
    behind=$(git rev-list --count "$branch"..develop 2>/dev/null || echo "0")
    echo "  📊 develop比較: +$ahead / -$behind"
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${CYAN}操作コマンド:${NC}"
echo "  tmux attach -t $SESSION           # セッションにアタッチ"
echo ""
echo -e "${CYAN}ペイン操作 (tmux内で):${NC}"
echo "  Ctrl+b q                          # ペイン番号表示"
echo "  Ctrl+b 矢印                       # ペイン移動"
echo "  Ctrl+b z                          # ペイン最大化/復帰"
echo ""
echo -e "${CYAN}統合:${NC}"
echo "  ./scripts/parallel-dev-integrate.sh --status  # 状態確認"
echo "  ./scripts/parallel-dev-integrate.sh <worker>  # マージ"
echo "  ./scripts/parallel-dev-integrate.sh --test    # テスト"
echo ""
