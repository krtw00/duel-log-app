#!/bin/bash

# Duel Log App データエクスポートスクリプト
# 本番環境のデータベースから全テーブルのデータをCSV形式でエクスポートします
#
# 使い方:
#   export DATABASE_URL="postgresql://user:password@host:port/database"
#   ./scripts/export-production-data.sh

set -e  # エラーが発生したら即座に終了

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Duel Log App データエクスポートスクリプト ===${NC}"
echo ""

# 環境変数のチェック
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}エラー: DATABASE_URL 環境変数が設定されていません${NC}"
  echo ""
  echo "使い方:"
  echo "  export DATABASE_URL=\"postgresql://user:password@host:port/database\""
  echo "  ./scripts/export-production-data.sh"
  exit 1
fi

# プロジェクトルートに移動
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# エクスポート先ディレクトリの作成
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_DIR="data-exports/backup_$TIMESTAMP"
mkdir -p "$EXPORT_DIR"

echo -e "${YELLOW}エクスポート先: $EXPORT_DIR${NC}"
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

# テーブルごとにエクスポート
TABLES=("users" "decks" "duels" "shared_statistics")

for TABLE in "${TABLES[@]}"; do
  echo -e "${YELLOW}$TABLE テーブルをエクスポート中...${NC}"

  # テーブルの存在確認
  TABLE_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='$TABLE');" | xargs)

  if [ "$TABLE_EXISTS" != "t" ]; then
    echo -e "${RED}警告: $TABLE テーブルが見つかりません。スキップします。${NC}"
    continue
  fi

  # データ件数を取得
  COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM $TABLE;" | xargs)
  echo "  件数: $COUNT"

  # CSVエクスポート
  psql "$DATABASE_URL" -c "\COPY (SELECT * FROM $TABLE) TO '$EXPORT_DIR/$TABLE.csv' WITH (FORMAT CSV, HEADER true, ENCODING 'UTF8');"

  echo -e "${GREEN}✓ $TABLE.csv を作成しました${NC}"
  echo ""
done

# メタデータを生成
echo -e "${YELLOW}メタデータを生成中...${NC}"

# 各テーブルの件数を取得
USERS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" | xargs)
DECKS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM decks;" | xargs)
DUELS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM duels;" | xargs)
SHARED_STATS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM shared_statistics;" | xargs)

# データベースバージョン情報を取得
DB_VERSION=$(psql "$DATABASE_URL" -t -c "SELECT version();" | xargs)

# Alembicリビジョンを取得（存在する場合）
ALEMBIC_REVISION=$(psql "$DATABASE_URL" -t -c "SELECT version_num FROM alembic_version LIMIT 1;" 2>/dev/null | xargs || echo "unknown")

# metadata.jsonを生成
cat > "$EXPORT_DIR/metadata.json" <<EOF
{
  "export_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "export_timestamp": "$TIMESTAMP",
  "database_version": "$DB_VERSION",
  "alembic_revision": "$ALEMBIC_REVISION",
  "tables": {
    "users": {
      "count": $USERS_COUNT,
      "file": "users.csv"
    },
    "decks": {
      "count": $DECKS_COUNT,
      "file": "decks.csv"
    },
    "duels": {
      "count": $DUELS_COUNT,
      "file": "duels.csv"
    },
    "shared_statistics": {
      "count": $SHARED_STATS_COUNT,
      "file": "shared_statistics.csv"
    }
  },
  "notes": "This backup was created using export-production-data.sh"
}
EOF

echo -e "${GREEN}✓ metadata.json を作成しました${NC}"
echo ""

# サマリー表示
echo -e "${GREEN}=== エクスポート完了 ===${NC}"
echo ""
echo "エクスポート先: $EXPORT_DIR"
echo ""
echo "データ件数:"
echo "  ユーザー: $USERS_COUNT"
echo "  デッキ: $DECKS_COUNT"
echo "  対戦履歴: $DUELS_COUNT"
echo "  共有統計: $SHARED_STATS_COUNT"
echo ""
echo "ファイル:"
ls -lh "$EXPORT_DIR"
echo ""

# 圧縮の推奨
TOTAL_SIZE=$(du -sh "$EXPORT_DIR" | cut -f1)
echo -e "${YELLOW}推奨: データを圧縮してください${NC}"
echo ""
echo "圧縮コマンド例:"
echo "  cd data-exports"
echo "  tar -czf backup_$TIMESTAMP.tar.gz backup_$TIMESTAMP/"
echo "  # または"
echo "  zip -r backup_$TIMESTAMP.zip backup_$TIMESTAMP/"
echo ""
echo -e "${GREEN}エクスポートが正常に完了しました！${NC}"
