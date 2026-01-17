#!/bin/bash
# スプリント前事前チェック（Preflight）
# Usage: ./parallel-dev-preflight.sh <config_file> [--skip-tests]
#
# スプリント開始前に必要な準備を自動実行:
# 1. 設定ファイルの検証
# 2. ステータスディレクトリの初期化
# 3. developブランチの最新化
# 4. 依存関係のインストール
# 5. テスト実行（--skip-testsで省略可能）
# 6. 共有ボードの初期化

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="$(dirname "$PROJECT_ROOT")"
STATUS_DIR="$WORK_DIR/.parallel-dev-status"
CONFIG_FILE="${1:-}"
SKIP_TESTS="${2:-}"

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

# ヘッダー表示
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         スプリント前 Preflight チェック                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 引数チェック
if [ -z "$CONFIG_FILE" ]; then
    log_error "設定ファイルを指定してください"
    echo ""
    echo "使用方法:"
    echo "  $0 scripts/parallel-tasks/sprint-XX.conf"
    echo "  $0 scripts/parallel-tasks/sprint-XX.conf --skip-tests"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    log_error "設定ファイルが見つかりません: $CONFIG_FILE"
    exit 1
fi

# Sprint番号を抽出
SPRINT_NAME=$(basename "$CONFIG_FILE" .conf)
log_info "Sprint: $SPRINT_NAME"
log_info "設定ファイル: $CONFIG_FILE"

# tasksファイル確認
TASKS_FILE="${CONFIG_FILE%.conf}.tasks"
if [ ! -f "$TASKS_FILE" ]; then
    log_warn "タスクファイルが見つかりません: $TASKS_FILE"
    log_warn "ワーカー起動前に作成してください"
else
    log_success "タスクファイル: $TASKS_FILE"
fi

#==============================================================================
log_step "1/6 設定ファイルの検証"
#==============================================================================

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

if [ ${#WORKERS[@]} -eq 0 ]; then
    log_error "有効なワーカー定義がありません"
    exit 1
fi

log_success "ワーカー数: ${#WORKERS[@]}"
for w in "${WORKERS[@]}"; do
    echo "    - $w: ${BRANCHES[$w]} (${ISSUES[$w]})"
done

# ブランチ名の重複チェック
declare -A BRANCH_CHECK=()
for w in "${WORKERS[@]}"; do
    branch="${BRANCHES[$w]}"
    if [ -n "${BRANCH_CHECK[$branch]:-}" ]; then
        log_error "ブランチ名が重複: $branch (${BRANCH_CHECK[$branch]} と $w)"
        exit 1
    fi
    BRANCH_CHECK["$branch"]="$w"
done
log_success "ブランチ名の重複なし"

#==============================================================================
log_step "2/6 ステータスディレクトリの初期化"
#==============================================================================

mkdir -p "$STATUS_DIR/reviews"
log_success "ディレクトリ作成: $STATUS_DIR"

# alerts.log初期化
cat > "$STATUS_DIR/alerts.log" << EOF
# $SPRINT_NAME Alerts Log
# 開始: $(date '+%Y-%m-%d %H:%M:%S')
# ワーカー: ${WORKERS[*]}
EOF
log_success "alerts.log 初期化"

# 共有ボード初期化
cat > "$STATUS_DIR/shared-board.md" << EOF
# 共有ボード - $SPRINT_NAME

ワーカー間の情報共有用ボードです。

## 使い方
- 問題報告、依頼、情報共有を記載
- 定期的にこのファイルを確認
- 詳細は \`.claude/agents/shared-board-guide.md\` を参照

## ワーカー一覧
$(for w in "${WORKERS[@]}"; do echo "- **$w**: ${BRANCHES[$w]} (${ISSUES[$w]})"; done)

---
EOF
log_success "shared-board.md 初期化"

# レビュー済みハッシュ初期化
> "$STATUS_DIR/reviewed.txt"
log_success "reviewed.txt 初期化"

# 古いレビューファイルをクリア
rm -f "$STATUS_DIR/reviews/"*.txt 2>/dev/null || true
log_success "reviews/ クリア"

#==============================================================================
log_step "3/6 developブランチの最新化"
#==============================================================================

cd "$PROJECT_ROOT"

# 未コミットの変更チェック
if [ -n "$(git status --porcelain)" ]; then
    log_warn "未コミットの変更があります"
    git status --short
    echo ""
    read -p "続行しますか？ (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log_error "中断しました"
        exit 1
    fi
fi

# developブランチに切り替え
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    log_info "現在のブランチ: $CURRENT_BRANCH → develop に切り替え"
    git checkout develop
fi
log_success "developブランチにチェックアウト"

# リモートから最新を取得
if git pull origin develop 2>/dev/null; then
    log_success "リモートから最新を取得"
else
    log_warn "リモートからのpull失敗（オフライン環境？）"
fi

# 既存のworktreeとブランチをチェック
log_info "既存のworktree/ブランチを確認..."
CONFLICT=false
for w in "${WORKERS[@]}"; do
    branch="${BRANCHES[$w]}"
    worktree_path="$WORK_DIR/duel-log-app-$w"

    if [ -d "$worktree_path" ]; then
        log_warn "Worktree既存: $worktree_path"
        CONFLICT=true
    fi

    if git show-ref --verify --quiet "refs/heads/$branch"; then
        log_warn "ブランチ既存: $branch"
        CONFLICT=true
    fi
done

if [ "$CONFLICT" = true ]; then
    echo ""
    log_warn "既存のworktree/ブランチがあります"
    echo "クリーンアップコマンド:"
    echo "  ./scripts/parallel-dev-cleanup.sh $CONFIG_FILE"
    echo ""
    read -p "このまま続行しますか？ (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log_error "中断しました。クリーンアップ後に再実行してください。"
        exit 1
    fi
fi

#==============================================================================
log_step "4/6 依存関係のインストール"
#==============================================================================

# バックエンド
log_info "バックエンド依存関係..."
cd "$PROJECT_ROOT/backend"
if uv sync 2>&1 | tail -3; then
    log_success "バックエンド依存関係インストール完了"
else
    log_error "バックエンド依存関係インストール失敗"
    exit 1
fi

# フロントエンド
log_info "フロントエンド依存関係..."
cd "$PROJECT_ROOT/frontend"
if npm ci --silent 2>&1 | tail -3; then
    log_success "フロントエンド依存関係インストール完了"
else
    log_error "フロントエンド依存関係インストール失敗"
    exit 1
fi

#==============================================================================
log_step "5/6 テスト実行"
#==============================================================================

if [ "$SKIP_TESTS" = "--skip-tests" ]; then
    log_warn "テストをスキップしました（--skip-tests）"
else
    # バックエンドテスト
    log_info "バックエンドテスト実行中..."
    cd "$PROJECT_ROOT/backend"
    if TEST_DATABASE_URL="sqlite:///./test.db" uv run pytest -x -q --tb=no 2>&1; then
        log_success "バックエンドテスト: PASS"
    else
        log_error "バックエンドテスト: FAIL"
        echo ""
        log_error "テストが失敗しました。修正後に再実行してください。"
        echo "詳細: cd backend && TEST_DATABASE_URL=\"sqlite:///./test.db\" uv run pytest -v"
        exit 1
    fi

    # フロントエンドテスト
    log_info "フロントエンドテスト実行中..."
    cd "$PROJECT_ROOT/frontend"
    if npm run test:unit -- --run 2>&1 | tail -5; then
        log_success "フロントエンドテスト: PASS"
    else
        log_error "フロントエンドテスト: FAIL"
        echo ""
        log_error "テストが失敗しました。修正後に再実行してください。"
        echo "詳細: cd frontend && npm run test:unit"
        exit 1
    fi

    # ビルド確認
    log_info "フロントエンドビルド確認中..."
    cd "$PROJECT_ROOT/frontend"
    if npm run build 2>&1 | tail -3; then
        log_success "フロントエンドビルド: PASS"
    else
        log_error "フロントエンドビルド: FAIL"
        exit 1
    fi
fi

#==============================================================================
log_step "6/6 最終確認"
#==============================================================================

cd "$PROJECT_ROOT"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Preflight チェック完了                              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Sprint: $SPRINT_NAME"
echo "ワーカー: ${#WORKERS[@]}名"
echo ""
echo "ステータス:"
echo "  ✓ 設定ファイル検証済み"
echo "  ✓ ステータスディレクトリ初期化済み"
echo "  ✓ developブランチ最新"
echo "  ✓ 依存関係インストール済み"
if [ "$SKIP_TESTS" = "--skip-tests" ]; then
    echo "  ⚠ テストはスキップ"
else
    echo "  ✓ 全テストパス"
fi
echo ""
echo -e "${CYAN}次のステップ:${NC}"
echo ""
echo "  1. セットアップ実行:"
echo "     ./scripts/parallel-dev-setup.sh $CONFIG_FILE"
echo ""
echo "  2. セッションにアタッチ:"
echo "     tmux attach -t duel-team"
echo ""
echo "  3. ワーカー起動:"
echo "     ./scripts/parallel-dev-start.sh ${CONFIG_FILE%.conf}"
echo ""
echo "  4. 監視役起動（Pane 0で）:"
echo "     ./scripts/parallel-dev-monitor.sh --loop"
echo ""
