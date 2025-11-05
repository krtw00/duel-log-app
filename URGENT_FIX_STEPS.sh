#!/bin/bash
# 緊急修正手順 - 必ず順番に実行してください

set -e  # エラーが発生したら停止

echo "========================================"
echo "Step 1: すべてのコンテナを停止"
echo "========================================"
docker compose down
echo "✓ 完了"
echo ""

echo "========================================"
echo "Step 2: 古いbackendイメージを削除"
echo "========================================"
docker rmi duel-log-app-backend 2>/dev/null || echo "イメージが見つかりませんでした（OK）"
echo "✓ 完了"
echo ""

echo "========================================"
echo "Step 3: Dockerビルドキャッシュをクリア"
echo "========================================"
docker builder prune -f
echo "✓ 完了"
echo ""

echo "========================================"
echo "Step 4: backendイメージを完全再ビルド"
echo "========================================"
docker compose build --no-cache --pull backend
echo "✓ 完了"
echo ""

echo "========================================"
echo "Step 5: データベースボリュームも削除して再作成"
echo "========================================"
docker volume rm duel-log-app_db_data 2>/dev/null || echo "ボリュームが見つかりませんでした（OK）"
echo "✓ 完了"
echo ""

echo "========================================"
echo "Step 6: すべてのサービスを起動"
echo "========================================"
docker compose up -d
echo "✓ 完了"
echo ""

echo "========================================"
echo "✅ 修正完了！"
echo "========================================"
echo ""
echo "以下のコマンドでログを確認してください："
echo "docker compose logs -f backend"
echo ""
echo "確認ポイント："
echo "1. 'Starting alembic upgrade head...' (単数形) と表示されること"
echo "2. '4ed32ebe9919' で終了すること（a1b2c3d4e5f8 への移行が試行されないこと）"
echo "3. '✅ Migrations completed successfully!' と表示されること"
