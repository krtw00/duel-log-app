# Migration Fix Instructions

## 問題
Dockerコンテナ内に古いマイグレーションファイル `a1b2c3d4e5f8_add_performance_indexes_to_duels.py` が残っており、存在しないカラム `duel_date` を参照しようとしています。

## 解決手順

以下のコマンドを**必ず順番に**実行してください：

### 1. 現在のコンテナとボリュームを完全に削除

```bash
cd /home/user/duel-log-app
docker compose down -v
```

**重要**: `-v` オプションは、データベースボリュームも含めてすべてのボリュームを削除します。

### 2. Dockerイメージも削除

```bash
docker rmi duel-log-app-backend duel-log-app-frontend duel-log-app-db 2>/dev/null || true
docker image prune -f
```

### 3. __pycache__ を削除

```bash
find /home/user/duel-log-app/backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find /home/user/duel-log-app/backend -type f -name "*.pyc" -delete 2>/dev/null || true
```

### 4. バックエンドイメージを完全に再ビルド

```bash
docker compose build --no-cache --pull backend
```

### 5. サービスを起動

```bash
docker compose up -d
```

### 6. ログを確認

```bash
docker compose logs -f backend
```

## 確認ポイント

ログで以下を確認してください：

✅ `Starting alembic upgrade head...` （単数形）と表示されること
✅ `4ed32ebe9919` の後に `a1b2c3d4e5f8` へのアップグレードが**試行されない**こと
✅ マイグレーションが正常に完了すること

## トラブルシューティング

もし上記の手順でも解決しない場合：

```bash
# すべてのDockerリソースを削除
docker compose down -v
docker system prune -a --volumes -f

# 再ビルドと起動
docker compose build --no-cache
docker compose up -d
```
