#!/bin/bash
# PM用統合スクリプト
# ワーカーのブランチをdevelopにマージし、統合テストを実行
# Usage: ./parallel-dev-integrate.sh [worker_name|all]
#
# 操作:
#   ./parallel-dev-integrate.sh backend    # backendワーカーのブランチをマージ
#   ./parallel-dev-integrate.sh all        # 全ワーカーをマージ
#   ./parallel-dev-integrate.sh --test     # テストのみ実行
#   ./parallel-dev-integrate.sh --status   # 各ブランチの状態確認

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="$(dirname "$PROJECT_ROOT")"
STATUS_DIR="$WORK_DIR/.parallel-dev-status"

# 設定ファイル読み込み
CONFIG_FILE="$STATUS_DIR/current.conf"

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ワーカー情報をパース
load_workers() {
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "設定ファイルがありません: $CONFIG_FILE"
        exit 1
    fi

    declare -gA BRANCHES=()
    declare -gA ISSUES=()
    declare -ga WORKERS=()

    while IFS=':' read -r worker branch issues || [ -n "$worker" ]; do
        [[ -z "$worker" || "$worker" =~ ^# ]] && continue
        WORKERS+=("$worker")
        BRANCHES["$worker"]="$branch"
        ISSUES["$worker"]="$issues"
    done < "$CONFIG_FILE"
}

# ブランチの状態確認
show_status() {
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           ブランチ状態確認                                  ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""

    cd "$PROJECT_ROOT"
    git fetch origin 2>/dev/null || log_warn "リモートfetch失敗"

    for w in "${WORKERS[@]}"; do
        branch="${BRANCHES[$w]}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "【$w】 $branch (${ISSUES[$w]})"

        # コミット数
        ahead=$(git rev-list --count develop.."$branch" 2>/dev/null || echo "0")
        behind=$(git rev-list --count "$branch"..develop 2>/dev/null || echo "0")
        echo "  develop から: +$ahead commits, -$behind behind"

        # 最新コミット
        echo "  最新コミット:"
        git log "$branch" --oneline -3 2>/dev/null | sed 's/^/    /' || echo "    (なし)"

        # ステータスファイル
        if [ -f "$STATUS_DIR/$w.status" ]; then
            status=$(head -1 "$STATUS_DIR/$w.status")
            if [[ "$status" == COMPLETED* ]]; then
                echo -e "  ステータス: ${GREEN}$status${NC}"
            elif [[ "$status" == ERROR* ]]; then
                echo -e "  ステータス: ${RED}$status${NC}"
            else
                echo -e "  ステータス: ${YELLOW}$status${NC}"
            fi
        fi
        echo ""
    done
}

# 単一ワーカーのマージ
merge_worker() {
    local worker="$1"
    local branch="${BRANCHES[$worker]}"

    if [ -z "$branch" ]; then
        log_error "不明なワーカー: $worker"
        return 1
    fi

    log_info "[$worker] $branch をdevelopにマージ中..."

    cd "$PROJECT_ROOT"
    git checkout develop
    git pull origin develop 2>/dev/null || true

    # マージ実行
    if git merge "$branch" --no-ff -m "Merge branch '$branch' into develop

Issue: ${ISSUES[$worker]}
Worker: $worker"; then
        log_success "[$worker] マージ完了"
        return 0
    else
        log_error "[$worker] マージ失敗（コンフリクト？）"
        echo ""
        echo "コンフリクト解消後:"
        echo "  git add ."
        echo "  git commit"
        return 1
    fi
}

# テスト実行
run_tests() {
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           統合テスト実行                                   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""

    cd "$PROJECT_ROOT"
    git checkout develop

    log_info "Backend テスト..."
    cd "$PROJECT_ROOT/backend"
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    fi

    # ruff check
    log_info "ruff check..."
    if ruff check .; then
        log_success "ruff check passed"
    else
        log_error "ruff check failed"
    fi

    # pytest
    log_info "pytest..."
    if pytest --tb=short; then
        log_success "pytest passed"
    else
        log_error "pytest failed"
    fi

    cd "$PROJECT_ROOT"

    log_info "Frontend テスト..."
    cd "$PROJECT_ROOT/frontend"

    # TypeScript check
    log_info "TypeScript check..."
    if npm run typecheck 2>/dev/null || npx vue-tsc --noEmit; then
        log_success "TypeScript check passed"
    else
        log_error "TypeScript check failed"
    fi

    # ESLint
    log_info "ESLint..."
    if npm run lint; then
        log_success "ESLint passed"
    else
        log_error "ESLint failed"
    fi

    # Build
    log_info "Build..."
    if npm run build; then
        log_success "Build passed"
    else
        log_error "Build failed"
    fi

    cd "$PROJECT_ROOT"

    echo ""
    log_success "統合テスト完了"
}

# メイン
load_workers

case "${1:-}" in
    --status|-s)
        show_status
        ;;
    --test|-t)
        run_tests
        ;;
    all)
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║           全ワーカーをマージ                               ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""

        for w in "${WORKERS[@]}"; do
            merge_worker "$w" || true
        done

        echo ""
        log_info "テストを実行しますか？ (y/n)"
        read -r answer
        if [[ "$answer" == "y" ]]; then
            run_tests
        fi
        ;;
    "")
        echo "Usage: $0 [worker_name|all|--status|--test]"
        echo ""
        echo "Options:"
        echo "  worker_name  指定ワーカーのブランチをdevelopにマージ"
        echo "  all          全ワーカーをマージ"
        echo "  --status     各ブランチの状態確認"
        echo "  --test       テストのみ実行"
        echo ""
        echo "利用可能なワーカー:"
        for w in "${WORKERS[@]}"; do
            echo "  $w: ${BRANCHES[$w]} (${ISSUES[$w]})"
        done
        ;;
    *)
        merge_worker "$1"
        ;;
esac
