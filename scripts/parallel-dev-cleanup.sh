#!/bin/bash
# 並列開発環境のクリーンアップ（動的設定対応）
# Usage: ./parallel-dev-cleanup.sh [--force]
#   --force: 確認なしで削除

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
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           並列開発環境クリーンアップ                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 設定ファイルがなければ基本的なクリーンアップのみ
if [ ! -f "$CONFIG_FILE" ]; then
    log_warn "設定ファイルがありません"
    log_info "tmuxセッションの終了のみ実行します..."
    tmux kill-session -t "$SESSION" 2>/dev/null && log_success "セッション終了" || log_warn "セッションなし"
    exit 0
fi

# ワーカー情報をパース
declare -a WORKERS=()
declare -A BRANCHES=()

while IFS=':' read -r worker branch issues || [ -n "$worker" ]; do
    [[ -z "$worker" || "$worker" =~ ^# ]] && continue
    WORKERS+=("$worker")
    BRANCHES["$worker"]="$branch"
done < "$CONFIG_FILE"

# 確認
if [ "$1" != "--force" ]; then
    echo "以下のリソースを削除します:"
    echo ""
    echo "  tmuxセッション: $SESSION"
    for w in "${WORKERS[@]}"; do
        echo "  Worktree: $WORK_DIR/duel-log-app-$w"
        echo "  ブランチ: ${BRANCHES[$w]} (マージ済みの場合のみ)"
    done
    echo ""
    echo -n "続行しますか？ (y/n): "
    read -r answer
    if [[ "$answer" != "y" ]]; then
        echo "キャンセルしました"
        exit 0
    fi
fi

# 1. tmuxセッション終了
log_info "tmuxセッション終了..."
if tmux kill-session -t "$SESSION" 2>/dev/null; then
    log_success "セッション $SESSION を終了"
else
    log_warn "セッション $SESSION: なし"
fi

# 2. Worktree削除
log_info "Worktree削除..."
for w in "${WORKERS[@]}"; do
    worktree_path="$WORK_DIR/duel-log-app-$w"
    if [ -d "$worktree_path" ]; then
        if git -C "$PROJECT_ROOT" worktree remove "$worktree_path" --force 2>/dev/null; then
            log_success "$worktree_path を削除"
        else
            log_warn "$worktree_path: 削除失敗（手動で確認してください）"
        fi
    else
        log_warn "$worktree_path: 存在しない"
    fi
done

# 3. ブランチ削除（マージ済みのみ）
log_info "マージ済みブランチ削除..."
cd "$PROJECT_ROOT"
for w in "${WORKERS[@]}"; do
    branch="${BRANCHES[$w]}"
    if git branch -d "$branch" 2>/dev/null; then
        log_success "$branch を削除"
    else
        log_warn "$branch: 未マージまたは存在しない"
    fi
done

# 4. ステータスファイル削除
log_info "ステータスファイル削除..."
rm -f "$STATUS_DIR"/*.status 2>/dev/null || true
rm -f "$STATUS_DIR/current.conf" 2>/dev/null || true
rm -f "$STATUS_DIR/session.name" 2>/dev/null || true
log_success "完了"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           クリーンアップ完了                               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "残存リソース確認:"
git worktree list
echo ""
tmux list-sessions 2>/dev/null || echo "tmuxセッションなし"
