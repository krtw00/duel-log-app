#!/bin/bash
# 各ワーカーにClaude Codeを起動してタスクを送信
# Usage: ./parallel-dev-start.sh [config_file]
#
# 設定ファイルと同名の.tasksファイルからタスク指示を読み込み
# 例: scripts/parallel-tasks/default.conf → scripts/parallel-tasks/default.tasks

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="$(dirname "$PROJECT_ROOT")"
STATUS_DIR="$WORK_DIR/.parallel-dev-status"
AGENTS_DIR="$PROJECT_ROOT/.claude/agents"

# 設定ファイル読み込み
CONFIG_FILE="${1:-$STATUS_DIR/current.conf}"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "設定ファイルが見つかりません: $CONFIG_FILE"
    echo "先に parallel-dev-setup.sh を実行してください"
    exit 1
fi

# タスクファイル
TASKS_FILE="${CONFIG_FILE%.conf}.tasks"
if [ ! -f "$TASKS_FILE" ]; then
    echo "タスクファイルが見つかりません: $TASKS_FILE"
    echo ""
    echo "タスクファイルを作成してください:"
    echo "  各セクションは [worker_name] で始まります"
    echo ""
    echo "例:"
    echo "  [backend]"
    echo "  あなたはバックエンド開発者です。"
    echo "  Issue #XXX を対応してください..."
    echo ""
    exit 1
fi

# セッション名読み込み
SESSION=$(cat "$STATUS_DIR/session.name" 2>/dev/null || echo "duel-team")

# ワーカー情報をパース
declare -a WORKERS=()
while IFS=':' read -r worker branch issues || [ -n "$worker" ]; do
    [[ -z "$worker" || "$worker" =~ ^# ]] && continue
    WORKERS+=("$worker")
done < "$CONFIG_FILE"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           ワーカーにタスクを送信                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# タスクファイルをパース
current_worker=""
declare -A TASKS=()

while IFS= read -r line || [ -n "$line" ]; do
    if [[ "$line" =~ ^\[([a-zA-Z0-9_-]+)\]$ ]]; then
        current_worker="${BASH_REMATCH[1]}"
        TASKS["$current_worker"]=""
    elif [ -n "$current_worker" ]; then
        TASKS["$current_worker"]+="$line"$'\n'
    fi
done < "$TASKS_FILE"

# エージェント定義を検出して内容を取得する関数
get_agent_content() {
    local task_content="$1"
    local agent_file=""

    # タスク内容からエージェント定義ファイルを検出
    if echo "$task_content" | grep -q "parallel-worker-backend.md"; then
        agent_file="$AGENTS_DIR/parallel-worker-backend.md"
    elif echo "$task_content" | grep -q "parallel-worker-frontend.md"; then
        agent_file="$AGENTS_DIR/parallel-worker-frontend.md"
    elif echo "$task_content" | grep -q "parallel-worker-test-doc.md"; then
        agent_file="$AGENTS_DIR/parallel-worker-test-doc.md"
    fi

    if [ -n "$agent_file" ] && [ -f "$agent_file" ]; then
        echo "--- エージェント定義（必ず遵守すること） ---"
        cat "$agent_file"
        echo ""
        echo "--- タスク指示 ---"
    fi
}

# 各ワーカーにタスク送信（ペインベース）
for i in "${!WORKERS[@]}"; do
    w="${WORKERS[$i]}"
    pane=$((i + 1))  # ペイン0は監視役

    if [ -z "${TASKS[$w]}" ]; then
        echo "[pane $pane: $w] タスク定義がありません、スキップ"
        continue
    fi

    echo "[pane $pane: $w] Claude起動中..."

    # Claude Codeを起動
    tmux send-keys -t "$SESSION:0.$pane" 'claude --model sonnet' Enter
    sleep 3

    # エージェント定義を取得
    agent_content=$(get_agent_content "${TASKS[$w]}")

    # タスクを組み立て（エージェント定義 + タスク内容）
    if [ -n "$agent_content" ]; then
        full_task="$agent_content"$'\n'"${TASKS[$w]}"
        echo "[pane $pane: $w] エージェント定義を埋め込み"
    else
        full_task="${TASKS[$w]}"
    fi

    # タスクを一時ファイルに保存
    task_file="$STATUS_DIR/task-$w.txt"
    echo "$full_task" > "$task_file"

    # tmux load-buffer + paste-buffer で長文を安全に送信
    tmux load-buffer -b "task-$w" "$task_file"
    tmux paste-buffer -b "task-$w" -t "$SESSION:0.$pane"

    # Claude Codeがタスクを処理開始するまで少し待ってからEnter送信
    sleep 2
    tmux send-keys -t "$SESSION:0.$pane" Enter

    echo "[pane $pane: $w] タスク送信完了"
    echo ""

    # 初期ステータス設定
    echo "STARTED: $(date '+%Y-%m-%d %H:%M:%S')" > "$STATUS_DIR/$w.status"
done

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           全ワーカーにタスク送信完了                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "進捗確認:"
echo "  ./scripts/parallel-dev-dashboard.sh"
echo ""
echo "セッションにアタッチ:"
echo "  tmux attach -t $SESSION"
echo ""
echo "ペイン操作:"
echo "  Ctrl+b q      → ペイン番号表示 (0=PM)"
echo "  Ctrl+b 矢印   → 矢印方向のペインへ移動"
echo "  Ctrl+b z      → 選択ペイン最大化/復帰"
