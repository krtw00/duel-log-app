#!/bin/bash
# 並列開発環境セットアップ（汎用版）
# Usage: ./parallel-dev-setup.sh [config_file]
#   config_file: タスク定義ファイル（デフォルト: scripts/parallel-tasks/default.conf）
#
# 設定ファイル形式（1行1ワーカー）:
#   worker_name:branch_name:issue_numbers
# 例:
#   backend:fix/datetime-aware:#299,#316
#   frontend:fix/i18n-hardcoded:#318
#   tester:test/admin-permissions:#315,#297

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="$(dirname "$PROJECT_ROOT")"
STATUS_DIR="$WORK_DIR/.parallel-dev-status"
SESSION="duel-team"
CONFIG_FILE="${1:-$PROJECT_ROOT/scripts/parallel-tasks/default.conf}"

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           並列開発環境セットアップ                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 設定ファイル確認
if [ ! -f "$CONFIG_FILE" ]; then
    log_error "設定ファイルが見つかりません: $CONFIG_FILE"
    echo ""
    echo "使用方法:"
    echo "  1. 設定ファイルを作成:"
    echo "     mkdir -p $PROJECT_ROOT/scripts/parallel-tasks"
    echo "     cat > $PROJECT_ROOT/scripts/parallel-tasks/default.conf << 'EOF'"
    echo "     backend:fix/datetime-aware:#299,#316"
    echo "     frontend:fix/i18n-hardcoded:#318"
    echo "     tester:test/admin-permissions:#315,#297"
    echo "     EOF"
    echo ""
    echo "  2. スクリプトを実行:"
    echo "     $0"
    exit 1
fi

log_info "設定ファイル: $CONFIG_FILE"

# ワーカー情報をパース
declare -a WORKERS=()
declare -A BRANCHES=()
declare -A ISSUES=()

while IFS=':' read -r worker branch issues || [ -n "$worker" ]; do
    # 空行・コメント行スキップ
    [[ -z "$worker" || "$worker" =~ ^# ]] && continue

    WORKERS+=("$worker")
    BRANCHES["$worker"]="$branch"
    ISSUES["$worker"]="$issues"
done < "$CONFIG_FILE"

if [ ${#WORKERS[@]} -eq 0 ]; then
    log_error "有効なワーカー定義がありません"
    exit 1
fi

WORKER_COUNT=${#WORKERS[@]}
log_info "ワーカー数: $WORKER_COUNT"
for w in "${WORKERS[@]}"; do
    echo "  - $w: ${BRANCHES[$w]} (${ISSUES[$w]})"
done
echo ""

# 0. ステータスディレクトリ作成
log_info "ステータスディレクトリ初期化..."
mkdir -p "$STATUS_DIR"
rm -f "$STATUS_DIR"/*.status 2>/dev/null || true
log_success "完了"

# 1. ブランチ作成
log_info "ブランチ作成..."
cd "$PROJECT_ROOT"
git checkout develop
git pull origin develop 2>/dev/null || log_warn "リモートからのpull失敗（オフライン？）"

for w in "${WORKERS[@]}"; do
    branch="${BRANCHES[$w]}"
    if git show-ref --verify --quiet "refs/heads/$branch"; then
        log_warn "$branch は既存"
    else
        git branch "$branch"
        log_success "$branch を作成"
    fi
done
echo ""

# 2. Worktree作成（オプション: --no-worktreeでスキップ可能）
# ワーカー自身がWorktreeを作成する方式を推奨
if [[ "${2:-}" == "--no-worktree" ]]; then
    log_info "Worktree作成をスキップ（ワーカーが自分で作成）"
    WORKER_CREATES_WORKTREE=true
else
    log_info "Worktree作成..."
    cd "$WORK_DIR"

    for w in "${WORKERS[@]}"; do
        branch="${BRANCHES[$w]}"
        worktree_path="$WORK_DIR/duel-log-app-$w"

        if [ -d "$worktree_path" ]; then
            log_warn "$worktree_path は既存"
        else
            git -C "$PROJECT_ROOT" worktree add "$worktree_path" "$branch"
            log_success "$worktree_path を作成"
        fi

        # .claude/agents と .claude/rules のシンボリックリンクを作成
        # （Worktreeでもメインリポジトリのエージェント定義・ルールを参照できるように）
        mkdir -p "$worktree_path/.claude"
        if [ ! -e "$worktree_path/.claude/agents" ]; then
            ln -s "$PROJECT_ROOT/.claude/agents" "$worktree_path/.claude/agents"
        fi
        if [ ! -e "$worktree_path/.claude/rules" ]; then
            ln -s "$PROJECT_ROOT/.claude/rules" "$worktree_path/.claude/rules"
        fi
    done
    log_success ".claude/agents, .claude/rules のシンボリックリンクを作成"
    WORKER_CREATES_WORKTREE=false
fi
echo ""

# 3. tmuxセッション作成（1画面にペイン分割）
log_info "tmuxセッション作成（1画面ペイン分割）..."
tmux kill-session -t "$SESSION" 2>/dev/null && log_warn "既存セッション $SESSION を終了"

# セッション作成（PMペイン = pane 0）
tmux new-session -d -s "$SESSION" -c "$PROJECT_ROOT"

# レイアウト計算: PM + ワーカー数
TOTAL_PANES=$((WORKER_COUNT + 1))

# ペイン分割戦略:
# - 2-3: 縦2分割後、必要に応じて横分割
# - 4-6: 2行×(2-3)列
# - 7+:  3行×n列

if [ $TOTAL_PANES -le 2 ]; then
    # PM | Worker1
    tmux split-window -t "$SESSION:0" -h -c "$WORK_DIR/duel-log-app-${WORKERS[0]}"
elif [ $TOTAL_PANES -le 4 ]; then
    # 2x2 グリッド
    # PM      | Worker1
    # Worker2 | Worker3
    tmux split-window -t "$SESSION:0" -h -c "$WORK_DIR/duel-log-app-${WORKERS[0]}"
    tmux split-window -t "$SESSION:0.0" -v -c "$WORK_DIR/duel-log-app-${WORKERS[1]}"
    if [ $WORKER_COUNT -ge 3 ]; then
        tmux split-window -t "$SESSION:0.1" -v -c "$WORK_DIR/duel-log-app-${WORKERS[2]}"
    fi
elif [ $TOTAL_PANES -le 6 ]; then
    # 2x3 グリッド
    # PM      | Worker1 | Worker2
    # Worker3 | Worker4 | Worker5
    tmux split-window -t "$SESSION:0" -h -c "$WORK_DIR/duel-log-app-${WORKERS[0]}"
    tmux split-window -t "$SESSION:0.1" -h -c "$WORK_DIR/duel-log-app-${WORKERS[1]}"
    tmux split-window -t "$SESSION:0.0" -v -c "$WORK_DIR/duel-log-app-${WORKERS[2]}"
    if [ $WORKER_COUNT -ge 4 ]; then
        tmux split-window -t "$SESSION:0.2" -v -c "$WORK_DIR/duel-log-app-${WORKERS[3]}"
    fi
    if [ $WORKER_COUNT -ge 5 ]; then
        tmux split-window -t "$SESSION:0.4" -v -c "$WORK_DIR/duel-log-app-${WORKERS[4]}"
    fi
else
    # 汎用: まず縦に分割し、その後横に分割
    # 上段: PM + Workers (半分)
    # 下段: Workers (残り)
    half=$((WORKER_COUNT / 2))

    # 上下分割
    tmux split-window -t "$SESSION:0" -v

    # 上段にワーカー追加
    for ((i=0; i<half && i<${#WORKERS[@]}; i++)); do
        tmux split-window -t "$SESSION:0.0" -h -c "$WORK_DIR/duel-log-app-${WORKERS[$i]}"
    done

    # 下段にワーカー追加
    pane_idx=$((half + 1))
    for ((i=half; i<${#WORKERS[@]}; i++)); do
        if [ $i -eq $half ]; then
            # 最初の下段ペインは既存のペインを使う
            tmux send-keys -t "$SESSION:0.$pane_idx" "cd $WORK_DIR/duel-log-app-${WORKERS[$i]}" Enter
        else
            tmux split-window -t "$SESSION:0.$pane_idx" -h -c "$WORK_DIR/duel-log-app-${WORKERS[$i]}"
        fi
    done
fi

# レイアウト均等化
tmux select-layout -t "$SESSION:0" tiled

# Codexレビューワーペインを追加（最後のペインとして）
SENIOR_ENG_LOG_FILE="$STATUS_DIR/codex-review.log"
touch "$SENIOR_ENG_LOG_FILE"
tmux split-window -t "$SESSION:0" -v -l 10 -c "$PROJECT_ROOT"
SENIOR_ENG_PANE=$((WORKER_COUNT + 1))

# 再度レイアウト調整
tmux select-layout -t "$SESSION:0" tiled

# 監視役ペインを選択
tmux select-pane -t "$SESSION:0.0"

# 各ペインにタイトル表示
tmux send-keys -t "$SESSION:0.0" "echo '=== 監視役（Pane 0）===' && pwd" Enter

for i in "${!WORKERS[@]}"; do
    pane=$((i + 1))
    w="${WORKERS[$i]}"
    tmux send-keys -t "$SESSION:0.$pane" "echo '=== $w: ${BRANCHES[$w]} ===' && pwd" Enter 2>/dev/null || true
done

# シニアエンジニアペイン: Claude Codeを起動
tmux send-keys -t "$SESSION:0.$SENIOR_ENG_PANE" "echo '=== シニアエンジニア（Pane $SENIOR_ENG_PANE）===' && cd $PROJECT_ROOT && claude" Enter

log_success "セッション $SESSION を作成"
log_info "Codexレビューワーペイン: Pane $SENIOR_ENG_PANE"
echo ""

# 4. 完了
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           セットアップ完了                                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "レイアウト: 1画面 $((TOTAL_PANES + 1)) ペイン分割"
echo "  [0] 監視役 - $PROJECT_ROOT"
for i in "${!WORKERS[@]}"; do
    w="${WORKERS[$w]}"
    echo "  [$((i+1))] $w - ${BRANCHES[$w]} (${ISSUES[$w]})"
done
echo "  [$SENIOR_ENG_PANE] Codexレビューワー（Claude Code）"
echo ""
echo "次のステップ:"
echo "  1. セッションにアタッチ:"
echo "     tmux attach -t $SESSION"
echo ""
echo "  2. ワーカーにタスクを送信:"
echo "     ./scripts/parallel-dev-start.sh"
echo ""
echo "ペイン操作:"
echo "  Ctrl+b q      → ペイン番号表示"
echo "  Ctrl+b 矢印   → 矢印方向のペインへ移動"
echo "  Ctrl+b z      → ペイン最大化/復帰"
echo "  Ctrl+b :resize-pane -Z  → 同上"
echo ""

# 設定情報をステータスディレクトリに保存
cp "$CONFIG_FILE" "$STATUS_DIR/current.conf"
echo "$SESSION" > "$STATUS_DIR/session.name"
