#!/bin/bash

# Duel Log App データインポートスクリプト
# エクスポートされたCSVファイルをデータベースにインポートします
#
# 使い方:
#   export DATABASE_URL="postgresql://user:password@host:port/database"
#   ./scripts/import-production-data.sh data-exports/backup_YYYYMMDD_HHMMSS

set -e  # エラーが発生したら即座に終了

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Duel Log App データインポートスクリプト ===${NC}"
echo ""

# 引数のチェック
if [ $# -ne 1 ]; then
  echo -e "${RED}エラー: バックアップディレクトリを指定してください${NC}"
  echo ""
  echo "使い方:"
  echo "  export DATABASE_URL=\"postgresql://user:password@host:port/database\""
  echo "  ./scripts/import-production-data.sh data-exports/backup_YYYYMMDD_HHMMSS"
  exit 1
fi

BACKUP_DIR="$1"

# バックアップディレクトリの存在確認
if [ ! -d "$BACKUP_DIR" ]; then
  echo -e "${RED}エラー: バックアップディレクトリが見つかりません: $BACKUP_DIR${NC}"
  exit 1
fi

# 環境変数のチェック
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}エラー: DATABASE_URL 環境変数が設定されていません${NC}"
  echo ""
  echo "使い方:"
  echo "  export DATABASE_URL=\"postgresql://user:password@host:port/database\""
  echo "  ./scripts/import-production-data.sh $BACKUP_DIR"
  exit 1
fi

# プロジェクトルートに移動
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo -e "${YELLOW}バックアップディレクトリ: $BACKUP_DIR${NC}"
echo ""

# psqlが利用可能かチェック
if ! command -v psql &> /dev/null; then
  echo -e "${RED}エラー: psql コマンドが見つかりません${NC}"
  echo "PostgreSQLクライアントをインストールしてください:"
  echo "  macOS: brew install postgresql"
  echo "  Ubuntu: sudo apt-get install postgresql-client"
  echo "  Windows: https://www.postgresql.org/download/windows/"
  exit 1
fi

# データベース接続テスト
echo -e "${YELLOW}データベース接続をテスト中...${NC}"
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
  echo -e "${RED}エラー: データベースに接続できません${NC}"
  echo "DATABASE_URL を確認してください"
  exit 1
fi
echo -e "${GREEN}✓ 接続成功${NC}"
echo ""

# metadata.jsonの確認
METADATA_FILE="$BACKUP_DIR/metadata.json"
if [ ! -f "$METADATA_FILE" ]; then
  echo -e "${YELLOW}警告: metadata.json が見つかりません${NC}"
  echo "バックアップの整合性を確認できませんが、続行します。"
else
  echo -e "${YELLOW}メタデータを確認中...${NC}"
  if command -v jq &> /dev/null; then
    EXPORT_DATE=$(jq -r '.export_date' "$METADATA_FILE")
    echo "  エクスポート日時: $EXPORT_DATE"
    echo ""
  fi
fi

# 確認プロンプト
echo -e "${YELLOW}警告: このスクリプトはデータベースにデータをインポートします${NC}"
echo ""
echo "データベース: $DATABASE_URL"
echo ""
read -p "続行しますか？ (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "インポートをキャンセルしました"
  exit 0
fi
echo ""

# テーブルの順序（外部キー制約を考慮）
# users -> decks -> duels -> shared_statistics
TABLES=("users" "decks" "duels" "shared_statistics")

# 既存データの削除確認
echo -e "${YELLOW}既存データの処理${NC}"
echo ""
read -p "既存データを削除しますか？ (yes/no): " DELETE_EXISTING

if [ "$DELETE_EXISTING" = "yes" ]; then
  echo -e "${YELLOW}既存データを削除中...${NC}"

  # 外部キー制約を考慮して逆順で削除
  for TABLE in "shared_statistics" "duels" "decks" "users"; do
    COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM $TABLE;" | xargs)
    if [ "$COUNT" -gt 0 ]; then
      echo "  $TABLE: $COUNT 件を削除"
      psql "$DATABASE_URL" -c "TRUNCATE TABLE $TABLE CASCADE;" > /dev/null
    fi
  done

  echo -e "${GREEN}✓ 既存データを削除しました${NC}"
  echo ""
else
  echo -e "${YELLOW}既存データを保持します（データの重複に注意してください）${NC}"
  echo ""
fi

# テーブルごとにインポート
for TABLE in "${TABLES[@]}"; do
  CSV_FILE="$BACKUP_DIR/$TABLE.csv"

  if [ ! -f "$CSV_FILE" ]; then
    echo -e "${YELLOW}警告: $CSV_FILE が見つかりません。スキップします。${NC}"
    continue
  fi

  echo -e "${YELLOW}$TABLE テーブルをインポート中...${NC}"

  # CSVファイルの行数を取得（ヘッダーを除く）
  LINE_COUNT=$(($(wc -l < "$CSV_FILE") - 1))
  echo "  インポート件数: $LINE_COUNT"

  # インポート実行
  # ヘッダー行をスキップしてインポート
  psql "$DATABASE_URL" -c "\COPY $TABLE FROM '$CSV_FILE' WITH (FORMAT CSV, HEADER true, ENCODING 'UTF8');" 2>&1

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $TABLE.csv をインポートしました${NC}"
  else
    echo -e "${RED}エラー: $TABLE のインポートに失敗しました${NC}"
    exit 1
  fi
  echo ""
done

# インポート後のデータ件数確認
echo -e "${GREEN}=== インポート完了 ===${NC}"
echo ""
echo "インポート後のデータ件数:"

for TABLE in "${TABLES[@]}"; do
  COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM $TABLE;" | xargs)
  echo "  $TABLE: $COUNT 件"
done
echo ""

# シーケンスのリセット（主キーの自動採番を正しく設定）
echo -e "${YELLOW}シーケンスをリセット中...${NC}"

# 各テーブルのシーケンスを現在の最大ID+1に設定
psql "$DATABASE_URL" <<EOF > /dev/null 2>&1
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1), true);
SELECT setval('decks_id_seq', COALESCE((SELECT MAX(id) FROM decks), 1), true);
SELECT setval('duels_id_seq', COALESCE((SELECT MAX(id) FROM duels), 1), true);
SELECT setval('shared_statistics_id_seq', COALESCE((SELECT MAX(id) FROM shared_statistics), 1), true);
EOF

echo -e "${GREEN}✓ シーケンスをリセットしました${NC}"
echo ""

# 外部キー制約の確認
echo -e "${YELLOW}外部キー制約を確認中...${NC}"

CONSTRAINT_ERRORS=$(psql "$DATABASE_URL" -t <<EOF
SELECT
  'decks.user_id' AS fk,
  COUNT(*) AS invalid_count
FROM decks d
LEFT JOIN users u ON d.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT
  'duels.user_id' AS fk,
  COUNT(*) AS invalid_count
FROM duels d
LEFT JOIN users u ON d.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT
  'duels.deck_id' AS fk,
  COUNT(*) AS invalid_count
FROM duels d
LEFT JOIN decks dk ON d.deck_id = dk.id
WHERE dk.id IS NULL

UNION ALL

SELECT
  'duels.opponent_deck_id' AS fk,
  COUNT(*) AS invalid_count
FROM duels d
LEFT JOIN decks dk ON d.opponent_deck_id = dk.id
WHERE dk.id IS NULL

UNION ALL

SELECT
  'shared_statistics.user_id' AS fk,
  COUNT(*) AS invalid_count
FROM shared_statistics s
LEFT JOIN users u ON s.user_id = u.id
WHERE u.id IS NULL;
EOF
)

HAS_ERRORS=0
while IFS='|' read -r FK_NAME INVALID_COUNT; do
  FK_NAME=$(echo "$FK_NAME" | xargs)
  INVALID_COUNT=$(echo "$INVALID_COUNT" | xargs)

  if [ "$INVALID_COUNT" -gt 0 ]; then
    echo -e "${RED}エラー: $FK_NAME に無効な参照が $INVALID_COUNT 件あります${NC}"
    HAS_ERRORS=1
  fi
done <<< "$CONSTRAINT_ERRORS"

if [ $HAS_ERRORS -eq 0 ]; then
  echo -e "${GREEN}✓ 外部キー制約の確認完了（問題なし）${NC}"
else
  echo -e "${YELLOW}警告: 外部キー制約のエラーがあります。データを確認してください。${NC}"
fi
echo ""

# 完了メッセージ
echo -e "${GREEN}インポートが正常に完了しました！${NC}"
echo ""
echo "次のステップ:"
echo "  1. アプリケーションにログインしてデータを確認"
echo "  2. 統計情報が正しく表示されることを確認"
echo "  3. 新規ユーザー登録が動作することを確認"
