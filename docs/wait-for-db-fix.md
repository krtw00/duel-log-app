# wait-for-db.sh エラー修正ガイド

## 🐛 問題

```
exec ./wait-for-db.sh: no such file or directory
```

このエラーは以下の原因で発生します：
1. **改行コードの問題**: WindowsのCRLF形式のファイルがLinuxコンテナで実行できない
2. **ファイルパーミッションの問題**: 実行権限が正しく設定されていない
3. **シェバン行の問題**: `#!/bin/bash` が正しく認識されない

---

## ✅ 解決方法（3つの選択肢）

### 🔹 方法1: dos2unix を使用（推奨）

既に修正済みの `Dockerfile` を使用します。

**手順:**

1. Docker イメージを再ビルド
```bash
cd C:\Users\grand\work\duel-log-app
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

2. ログを確認
```bash
docker-compose logs -f backend
```

**変更点:**
- `Dockerfile` に `dos2unix` を追加
- `wait-for-db.sh` の改行コードを自動変換

---

### 🔹 方法2: Pythonスクリプトを使用（より確実）

シェルスクリプトの代わりにPythonスクリプトを使用します。

**手順:**

1. `Dockerfile` の名前を変更
```bash
cd backend
move Dockerfile Dockerfile.bash
move Dockerfile.python Dockerfile
```

2. Docker イメージを再ビルド
```bash
cd ..
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

**メリット:**
- プラットフォーム依存の問題がない
- 改行コードの問題が発生しない
- デバッグが容易

---

### 🔹 方法3: Git の改行コード設定を変更

プロジェクト全体で改行コードを統一します。

**手順:**

1. `.gitattributes` ファイルを作成
```bash
# プロジェクトルートで実行
echo "*.sh text eol=lf" > .gitattributes
```

2. 既存ファイルの改行コードを変更
```bash
cd backend
# PowerShellで実行
(Get-Content wait-for-db.sh -Raw).Replace("`r`n","`n") | Set-Content wait-for-db.sh -NoNewline
```

3. Docker イメージを再ビルド
```bash
cd ..
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

---

## 🔍 トラブルシューティング

### エラーが続く場合

#### 1. ログを詳しく確認
```bash
docker-compose logs backend
```

#### 2. コンテナ内でファイルを確認
```bash
docker-compose exec backend bash
ls -la wait-for-db.sh
file wait-for-db.sh
cat -A wait-for-db.sh | head -1
```

期待される出力:
```
-rwxr-xr-x 1 root root 1234 Jan 1 00:00 wait-for-db.sh
wait-for-db.sh: Bourne-Again shell script, ASCII text executable
#!/bin/bash$
```

#### 3. 手動で改行コードを変換
```bash
docker-compose exec backend bash
dos2unix wait-for-db.sh
chmod +x wait-for-db.sh
exit
docker-compose restart backend
```

---

## 📋 現在の設定状況

### 修正済みファイル

1. ✅ `backend/wait-for-db.sh` - 改行コード修正済み
2. ✅ `backend/Dockerfile` - dos2unix 追加済み
3. ✅ `backend/start.py` - Python版スクリプト作成済み
4. ✅ `backend/Dockerfile.python` - Python版Dockerfile作成済み

---

## 🚀 推奨アクション

**最も簡単で確実な方法: 方法2（Pythonスクリプト）**

```bash
# 1. バックエンドディレクトリに移動
cd C:\Users\grand\work\duel-log-app\backend

# 2. Dockerfileを切り替え
move Dockerfile Dockerfile.bash
move Dockerfile.python Dockerfile

# 3. プロジェクトルートに戻る
cd ..

# 4. Docker再ビルド
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d

# 5. 確認
docker-compose logs -f backend
```

成功すると以下のようなログが表示されます：
```
⏳ Waiting for database at db...
✅ Database is ready!
🔄 Running Alembic migrations...
✅ Migrations completed successfully!
🚀 Starting Uvicorn server...
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## 💡 今後の予防策

### .gitattributes の設定

プロジェクトルートに `.gitattributes` を作成:

```
# シェルスクリプトは常にLF
*.sh text eol=lf

# Pythonファイルは常にLF
*.py text eol=lf

# Dockerfileは常にLF
Dockerfile* text eol=lf

# Windowsバッチファイルは常にCRLF
*.bat text eol=crlf
*.cmd text eol=crlf
```

### VS Code の設定

`.vscode/settings.json` を作成:

```json
{
  "files.eol": "\n",
  "[shellscript]": {
    "files.eol": "\n"
  }
}
```

---

## 📞 それでも解決しない場合

1. Dockerのログを全て確認
```bash
docker-compose logs backend > backend_error.log
```

2. Docker環境をリセット
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

3. WSL2を使用している場合、ファイルシステムの問題の可能性があるため、
   プロジェクトをWSL2内に移動することを検討

---

どの方法で修正しますか？**方法2（Pythonスクリプト）**が最も確実です！
