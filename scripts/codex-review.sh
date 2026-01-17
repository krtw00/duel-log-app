#!/bin/bash
# Codexによるコードレビュー（読み取り専用）
# 使い方: ./scripts/codex-review.sh <worktree_path> <issue_number>

set -e

WORKTREE_PATH="${1:-.}"
ISSUE_NUMBER="${2:-unknown}"
STATUS_DIR="/home/iguchi/work/.parallel-dev-status"
REVIEW_DIR="$STATUS_DIR/reviews"

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

mkdir -p "$REVIEW_DIR"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  Codexレビュー開始: Issue #$ISSUE_NUMBER${NC}"
echo -e "${CYAN}  対象: $WORKTREE_PATH${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$WORKTREE_PATH"

# 最新コミットの差分を取得
DIFF=$(git diff HEAD~1 2>/dev/null || git diff HEAD)
COMMIT_MSG=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "No commit")

if [ -z "$DIFF" ]; then
    echo -e "${YELLOW}差分がありません。スキップします。${NC}"
    exit 0
fi

# レビュー結果ファイル
REVIEW_FILE="$REVIEW_DIR/review-issue-$ISSUE_NUMBER-$(date +%Y%m%d-%H%M%S).md"

# Codexにレビューを依頼（読み取り専用モード）
echo -e "${YELLOW}Codexでレビュー中...${NC}"

REVIEW_PROMPT="あなたはコードレビュアーです。以下の変更をレビューしてください。

## レビュー観点
1. **セキュリティ**: SQLインジェクション、XSS、認証・認可の問題、機密情報の露出
2. **動作の正確性**: ロジックエラー、エッジケース、エラーハンドリング
3. **コード品質**: 可読性、保守性、パフォーマンス

## 重要
- コードの修正は行わないでください（読み取り専用）
- 問題点を具体的に指摘してください
- 問題がない場合は「問題なし」と明記してください

## コミットメッセージ
$COMMIT_MSG

## 変更内容
\`\`\`diff
$DIFF
\`\`\`

## 出力形式
### レビュー結果: [OK / 要修正]

#### セキュリティ
- [問題点または「問題なし」]

#### 動作の正確性
- [問題点または「問題なし」]

#### コード品質
- [問題点または「問題なし」]

#### 総評
[総合的な評価]
"

# Codex実行（--quietで余計な出力を抑制）
REVIEW_RESULT=$(echo "$REVIEW_PROMPT" | codex --quiet 2>/dev/null || echo "Codex実行エラー")

# 結果をファイルに保存
cat > "$REVIEW_FILE" << EOF
# Codexレビュー結果

- **Issue**: #$ISSUE_NUMBER
- **日時**: $(date '+%Y-%m-%d %H:%M:%S')
- **コミット**: $COMMIT_MSG
- **パス**: $WORKTREE_PATH

---

$REVIEW_RESULT
EOF

echo -e "${GREEN}レビュー結果を保存: $REVIEW_FILE${NC}"

# 結果を解析
if echo "$REVIEW_RESULT" | grep -qiE "(レビュー結果:.*OK|問題なし.*問題なし.*問題なし)"; then
    echo -e "${GREEN}✓ レビューOK${NC}"
    echo "OK" > "$STATUS_DIR/review-status-$ISSUE_NUMBER"
    exit 0
else
    echo -e "${RED}✗ 要修正${NC}"
    echo "NEEDS_FIX" > "$STATUS_DIR/review-status-$ISSUE_NUMBER"

    # 問題点を抽出して表示
    echo ""
    echo -e "${YELLOW}問題点:${NC}"
    echo "$REVIEW_RESULT" | grep -E "^-|^####" | head -20

    exit 1
fi
