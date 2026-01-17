#!/bin/bash
# 監視役スクリプト
# 役割: YES/NO自動承認、躓き検出、PMへの報告
# 使い方: ./scripts/parallel-dev-monitor.sh [--loop]

SESSION="duel-team"
STATUS_DIR="/home/iguchi/work/.parallel-dev-status"
STUCK_THRESHOLD=300  # 5分（秒）

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# 前回の状態を保存（躓き検出用）
declare -A LAST_CONTENT
declare -A LAST_CHANGE_TIME
declare -A STUCK_REPORTED

# 初期化
init_tracking() {
    local now=$(date +%s)
    for i in 1 2 3 4 5 6; do
        LAST_CONTENT[$i]=""
        LAST_CHANGE_TIME[$i]=$now
        STUCK_REPORTED[$i]=0
    done
}

# 自動承認処理
auto_approve() {
    local pane=$1
    local content=$2
    local approved=0

    # 編集承認待ち
    if echo "$content" | grep -q "accept edits on"; then
        tmux send-keys -t "$SESSION:0.$pane" Enter
        log_action $pane "編集承認" "Enter送信"
        ((approved++))
    fi

    # Yes/No選択（「2」で全セッション許可）
    if echo "$content" | grep -qE "❯ [12]\. Yes"; then
        tmux send-keys -t "$SESSION:0.$pane" '2'
        log_action $pane "許可選択" "'2'送信"
        ((approved++))
    fi

    # Bashコマンド実行許可
    if echo "$content" | grep -q "Do you want to run"; then
        tmux send-keys -t "$SESSION:0.$pane" '2'
        log_action $pane "コマンド許可" "'2'送信"
        ((approved++))
    fi

    return $approved
}

# 躓き検出
detect_stuck() {
    local pane=$1
    local content=$2
    local now=$(date +%s)
    local stuck=0

    # エラーメッセージ検出
    if echo "$content" | grep -qiE "(ERROR|error:|failed|exception|traceback)"; then
        if [ "${STUCK_REPORTED[$pane]}" -eq 0 ]; then
            notify_pm $pane "エラー検出" "$content"
            STUCK_REPORTED[$pane]=1
        fi
        stuck=1
    fi

    # 内容が変化したかチェック
    local content_hash=$(echo "$content" | md5sum | cut -d' ' -f1)
    local last_hash=$(echo "${LAST_CONTENT[$pane]}" | md5sum | cut -d' ' -f1)

    if [ "$content_hash" != "$last_hash" ]; then
        # 変化あり - タイムスタンプ更新
        LAST_CONTENT[$pane]="$content"
        LAST_CHANGE_TIME[$pane]=$now
        STUCK_REPORTED[$pane]=0
    else
        # 変化なし - 長時間チェック
        local elapsed=$((now - LAST_CHANGE_TIME[$pane]))
        if [ $elapsed -gt $STUCK_THRESHOLD ]; then
            if [ "${STUCK_REPORTED[$pane]}" -eq 0 ]; then
                notify_pm $pane "無応答検出" "$(($elapsed / 60))分以上変化なし"
                STUCK_REPORTED[$pane]=1
            fi
            stuck=1
        fi
    fi

    return $stuck
}

# PMへの通知
notify_pm() {
    local pane=$1
    local issue=$2
    local detail=$3

    echo -e "${RED}[警告]${NC} Pane $pane: $issue"
    echo -e "  詳細: $(echo "$detail" | head -c 100)..."

    # ステータスファイルに記録
    mkdir -p "$STATUS_DIR"
    echo "$(date '+%H:%M:%S') Pane $pane: $issue" >> "$STATUS_DIR/alerts.log"
}

# アクションログ
log_action() {
    local pane=$1
    local action=$2
    local detail=$3

    echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} Pane $pane: $action → $detail"
}

# ステータス表示
show_status() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  監視ステータス $(date '+%H:%M:%S')${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    for i in 1 2 3 4 5 6; do
        content=$(tmux capture-pane -t "$SESSION:0.$i" -p 2>/dev/null | tail -15)

        # ワーカー名を取得
        worker=$(sed -n "${i}p" "$STATUS_DIR/current.conf" 2>/dev/null | cut -d: -f1)
        [ -z "$worker" ] && worker="Worker $i"

        # 状態判定
        if echo "$content" | grep -qE "(COMPLETED|完了|コミット完了)"; then
            status="${GREEN}完了${NC}"
        elif echo "$content" | grep -qE "(ERROR|error|failed|Failed)"; then
            status="${RED}エラー${NC}"
        elif echo "$content" | grep -q "accept edits on"; then
            status="${YELLOW}承認待ち${NC}"
        elif echo "$content" | grep -qE "❯ [12]\. Yes"; then
            status="${YELLOW}選択待ち${NC}"
        elif echo "$content" | grep -q "Do you want to run"; then
            status="${YELLOW}実行許可待ち${NC}"
        elif echo "$content" | grep -qE "(thinking|Searching|Reading|Writing|Honking|Cogitating)"; then
            status="${BLUE}作業中${NC}"
        else
            status="${BLUE}処理中${NC}"
        fi

        # 現在のタスク抽出
        task=$(echo "$content" | grep -oE "(✻|✢|✽|●|·) [^…]+…?" | tail -1 | head -c 50)

        echo -e "[Pane $i] ${CYAN}$worker${NC}: $status"
        [ -n "$task" ] && echo -e "         $task"
    done
    echo ""
}

# メインループ
main_loop() {
    init_tracking

    while true; do
        clear
        show_status

        for i in 1 2 3 4 5 6; do
            content=$(tmux capture-pane -t "$SESSION:0.$i" -p 2>/dev/null)

            # 自動承認
            auto_approve $i "$content"

            # 躓き検出
            detect_stuck $i "$content"
        done

        sleep 5
    done
}

# ワンショット実行
one_shot() {
    show_status

    for i in 1 2 3 4 5 6; do
        content=$(tmux capture-pane -t "$SESSION:0.$i" -p 2>/dev/null)
        auto_approve $i "$content"
    done
}

# メイン
case "${1:-}" in
    --loop)
        echo -e "${MAGENTA}監視役起動${NC} (Ctrl+C で停止)"
        echo "役割: YES/NO自動承認、躓き検出、PMへの報告"
        echo ""
        main_loop
        ;;
    --once|*)
        one_shot
        ;;
esac
