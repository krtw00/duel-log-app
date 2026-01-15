#!/bin/bash
# AI Debate Script - Claude Code から Codex と Gemini を呼び出して壁打ちさせる
# Usage: ./scripts/ai-debate.sh "質問やトピック"
# Options:
#   -r, --rounds N    議論ラウンド数 (default: 1)
#   -g, --gemini-model MODEL  Geminiモデル指定 (default: google/gemini-2.5-flash)
#   -c, --codex-model MODEL   Codexモデル指定 (default: gpt-5.1-codex-max)
#   -o, --output FILE 結果をファイルに保存

set -e

# デフォルト設定
ROUNDS=1
GEMINI_MODEL="google/gemini-2.5-flash"
CODEX_MODEL="gpt-5.1-codex-max"
OUTPUT_FILE=""
TIMEOUT=120

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 引数解析
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--rounds)
            ROUNDS="$2"
            shift 2
            ;;
        -g|--gemini-model)
            GEMINI_MODEL="$2"
            shift 2
            ;;
        -c|--codex-model)
            CODEX_MODEL="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS] \"質問やトピック\""
            echo ""
            echo "Options:"
            echo "  -r, --rounds N          議論ラウンド数 (default: 1)"
            echo "  -g, --gemini-model M    Geminiモデル (default: google/gemini-2.5-flash)"
            echo "  -c, --codex-model M     Codexモデル (default: gpt-5.1-codex-max)"
            echo "  -o, --output FILE       結果をファイルに保存"
            echo "  -t, --timeout SEC       タイムアウト秒数 (default: 120)"
            echo "  -h, --help              このヘルプを表示"
            exit 0
            ;;
        *)
            PROMPT="$1"
            shift
            ;;
    esac
done

if [ -z "$PROMPT" ]; then
    echo -e "${RED}Error: 質問やトピックを指定してください${NC}"
    echo "Usage: $0 \"質問やトピック\""
    exit 1
fi

# 一時ファイル
GEMINI_OUT=$(mktemp)
CODEX_OUT=$(mktemp)
trap "rm -f $GEMINI_OUT $CODEX_OUT" EXIT

# ヘッダー表示
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    AI Debate Session                          ║${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC} Gemini: ${YELLOW}$GEMINI_MODEL${NC}"
echo -e "${CYAN}║${NC} Codex:  ${YELLOW}$CODEX_MODEL${NC}"
echo -e "${CYAN}║${NC} Rounds: ${YELLOW}$ROUNDS${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

current_prompt="$PROMPT"
all_output=""

for round in $(seq 1 $ROUNDS); do
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}                        Round $round / $ROUNDS${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}📝 Prompt:${NC}"
    echo "$current_prompt"
    echo ""

    # 並列実行
    echo -e "${CYAN}⏳ Querying AI models in parallel...${NC}"

    (timeout $TIMEOUT opencode run --model "$GEMINI_MODEL" "$current_prompt" > "$GEMINI_OUT" 2>&1 || echo "Error or timeout" > "$GEMINI_OUT") &
    GEMINI_PID=$!

    (timeout $TIMEOUT codex exec "$current_prompt" 2>&1 | grep -v "^OpenAI Codex\|^--------\|^workdir:\|^model:\|^provider:\|^approval:\|^sandbox:\|^reasoning\|^session id:\|^mcp\|^tokens used\|^[0-9,]*$\|ERROR\|^thinking$\|^user$\|^codex$" | sed '/^$/d' | awk '!seen[$0]++' > "$CODEX_OUT" || echo "Error or timeout" > "$CODEX_OUT") &
    CODEX_PID=$!

    wait $GEMINI_PID
    wait $CODEX_PID

    GEMINI_RESPONSE=$(cat "$GEMINI_OUT")
    CODEX_RESPONSE=$(cat "$CODEX_OUT")

    # Gemini の回答表示
    echo ""
    echo -e "${GREEN}┌──────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${GREEN}│  🤖 Gemini ($GEMINI_MODEL)${NC}"
    echo -e "${GREEN}└──────────────────────────────────────────────────────────────┘${NC}"
    echo "$GEMINI_RESPONSE"

    # Codex の回答表示
    echo ""
    echo -e "${RED}┌──────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${RED}│  🧠 Codex ($CODEX_MODEL)${NC}"
    echo -e "${RED}└──────────────────────────────────────────────────────────────┘${NC}"
    echo "$CODEX_RESPONSE"

    # 結果を蓄積
    all_output+="
=== Round $round ===
Prompt: $current_prompt

--- Gemini ---
$GEMINI_RESPONSE

--- Codex ---
$CODEX_RESPONSE
"

    # 次のラウンドのプロンプト生成（複数ラウンドの場合）
    if [ $round -lt $ROUNDS ]; then
        current_prompt="Previous discussion:

Gemini said:
$GEMINI_RESPONSE

Codex said:
$CODEX_RESPONSE

Based on these responses, please provide your perspective, identify points of agreement/disagreement, and add any insights the other AI might have missed. Be concise."
    fi
done

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    Session Complete                           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"

# ファイル出力
if [ -n "$OUTPUT_FILE" ]; then
    echo "$all_output" > "$OUTPUT_FILE"
    echo -e "${GREEN}Results saved to: $OUTPUT_FILE${NC}"
fi
