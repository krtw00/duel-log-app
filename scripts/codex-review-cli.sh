#!/bin/bash
# Codexレビュー（CLI版）
# Pane 7のClaude Codeにレビューリクエストを送信
# Usage: ./scripts/codex-review-cli.sh <worker_name> <branch_name> <issue_number>

set -e

WORKER_NAME="${1:-}"
BRANCH_NAME="${2:-}"
ISSUE_NUMBER="${3:-}"
SESSION="duel-team"
CODEX_PANE=7
STATUS_DIR="/home/iguchi/work/.parallel-dev-status"
WORK_DIR="/home/iguchi/work"

if [ -z "$WORKER_NAME" ] || [ -z "$BRANCH_NAME" ]; then
    echo "Usage: $0 <worker_name> <branch_name> [issue_number]"
    echo "Example: $0 cors fix/cors-strict 292"
    exit 1
fi

WORKTREE_PATH="$WORK_DIR/duel-log-app-$WORKER_NAME"

if [ ! -d "$WORKTREE_PATH" ]; then
    echo "Worktreeが見つかりません: $WORKTREE_PATH"
    exit 1
fi

# コミット情報を取得
cd "$WORKTREE_PATH"
COMMIT_HASH=$(git log -1 --pretty=format:"%h")
COMMIT_MSG=$(git log -1 --pretty=format:"%s")
DIFF=$(git diff develop..HEAD 2>/dev/null || git diff HEAD~1 2>/dev/null || echo "差分取得エラー")

# 差分が大きすぎる場合は要約
DIFF_LINES=$(echo "$DIFF" | wc -l)
if [ "$DIFF_LINES" -gt 200 ]; then
    DIFF=$(echo "$DIFF" | head -200)
    DIFF="$DIFF

... (差分が長いため省略、全${DIFF_LINES}行中200行を表示)"
fi

echo "=== Codexレビュー送信 ==="
echo "Worker: $WORKER_NAME"
echo "Branch: $BRANCH_NAME"
echo "Commit: $COMMIT_HASH - $COMMIT_MSG"
echo "Issue: #$ISSUE_NUMBER"
echo ""

# レビューリクエストを一時ファイルに保存
REVIEW_REQUEST=$(cat << EOF
以下のコミットをレビューしてください。

## レビュー情報
- **Worker**: $WORKER_NAME
- **ブランチ**: $BRANCH_NAME
- **コミット**: $COMMIT_HASH
- **メッセージ**: $COMMIT_MSG
- **Issue**: #$ISSUE_NUMBER

## レビュー観点
1. **セキュリティ**: SQLインジェクション、XSS、認証・認可の問題
2. **動作の正確性**: ロジックエラー、エッジケース、エラーハンドリング
3. **コード品質**: 可読性、保守性、パフォーマンス

## 変更内容
\`\`\`diff
$DIFF
\`\`\`

## 出力形式
以下の形式で回答してください:

### レビュー結果: [OK / 要修正]

#### セキュリティ
- [問題点または「問題なし」]

#### 動作の正確性
- [問題点または「問題なし」]

#### コード品質
- [問題点または「問題なし」]

#### 総評
[総合的な評価]
EOF
)

# 一時ファイルに保存
TEMP_FILE="$STATUS_DIR/review-request-$WORKER_NAME.txt"
echo "$REVIEW_REQUEST" > "$TEMP_FILE"

# Pane 7にレビューリクエストを送信
tmux load-buffer -b "review-$WORKER_NAME" "$TEMP_FILE"
tmux paste-buffer -b "review-$WORKER_NAME" -t "$SESSION:0.$CODEX_PANE"
sleep 1
tmux send-keys -t "$SESSION:0.$CODEX_PANE" Enter

echo "レビューリクエストを Pane $CODEX_PANE に送信しました"
echo "結果は Pane $CODEX_PANE で確認してください"

# ログに記録
echo "[$(date '+%H:%M:%S')] Codexレビュー送信: $WORKER_NAME ($BRANCH_NAME) #$ISSUE_NUMBER" >> "$STATUS_DIR/codex-review.log"
