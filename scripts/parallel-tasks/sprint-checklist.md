# スプリント前チェックリスト

スプリント開始前にPMが実施すべき準備事項です。

---

## 1. Issue選定とタスク分解

- [ ] GitHubからスプリント対象のIssueを選定
  ```bash
  gh issue list --state open --limit 20
  ```
- [ ] 各Issueの作業量を見積もり（1ワーカー = 1-2時間で完了できる粒度）
- [ ] バックエンド/フロントエンドの分類
- [ ] 依存関係の確認（A完了後にBを開始など）
- [ ] ワーカー数の決定（推奨: 3-6名）

---

## 2. 設定ファイルの作成

### sprint-XX.conf
```bash
# 例: scripts/parallel-tasks/sprint-04.conf
cat > scripts/parallel-tasks/sprint-04.conf << 'EOF'
worker1:fix/issue-123:#123
worker2:feat/new-feature:#124
worker3:fix/frontend-bug:#125
EOF
```

### sprint-XX.tasks
```bash
# 例: scripts/parallel-tasks/sprint-04.tasks
# 各ワーカーのタスク詳細を記載
# テンプレートは .claude/rules/parallel-dev.md を参照
```

---

## 3. ステータスディレクトリの初期化

```bash
# ディレクトリ作成
mkdir -p /home/iguchi/work/.parallel-dev-status/reviews

# alerts.log初期化
cat > /home/iguchi/work/.parallel-dev-status/alerts.log << 'EOF'
# Sprint XX Alerts Log
# 開始: $(date '+%Y-%m-%d %H:%M:%S')
EOF

# 共有ボード初期化
cat > /home/iguchi/work/.parallel-dev-status/shared-board.md << 'EOF'
# 共有ボード - Sprint XX

ワーカー間の情報共有用ボードです。

## 使い方
- 問題報告、依頼、情報共有を記載
- 定期的にこのファイルを確認
- 詳細は `.claude/agents/shared-board-guide.md` を参照

---
EOF

# レビュー済みハッシュ初期化
> /home/iguchi/work/.parallel-dev-status/reviewed.txt

# 古いレビューファイルをクリア
rm -f /home/iguchi/work/.parallel-dev-status/reviews/*.txt
```

---

## 4. developブランチの準備

```bash
cd /home/iguchi/work/duel-log-app

# developブランチに切り替え
git checkout develop

# 最新化
git pull origin develop

# 未コミットの変更がないことを確認
git status
```

---

## 5. 依存関係の確認

### バックエンド
```bash
cd backend
uv sync
uv run pytest -x -q  # クイックテスト
```

### フロントエンド
```bash
cd frontend
npm ci  # クリーンインストール
npm run test:unit -- --run  # テスト実行
npm run build  # ビルド確認
```

---

## 6. 既存テストの確認

```bash
# バックエンド全テスト
cd backend
TEST_DATABASE_URL="sqlite:///./test.db" uv run pytest -v

# フロントエンド全テスト
cd frontend
npm run test:unit
```

**全テストがパスしていることを確認してからスプリント開始**

---

## 7. tmuxセッションのセットアップ

```bash
# セットアップスクリプト実行
./scripts/parallel-dev-setup.sh scripts/parallel-tasks/sprint-04.conf

# セッションにアタッチ
tmux attach -t duel-team
```

---

## 8. ワーカー起動

```bash
# 各ワーカーペインでClaude Codeを起動
./scripts/parallel-dev-start.sh scripts/parallel-tasks/sprint-04

# 監視役起動（Pane 0で実行）
./scripts/parallel-dev-monitor.sh --loop
```

---

## 9. PM監視開始

別ターミナルで以下を定期的に確認:

```bash
# alerts.log監視
tail -f /home/iguchi/work/.parallel-dev-status/alerts.log

# 共有ボード確認
cat /home/iguchi/work/.parallel-dev-status/shared-board.md

# ワーカーペイン状態確認
tmux capture-pane -t duel-team:0.1 -p | tail -20
```

---

## クイックスタートコマンド（コピペ用）

```bash
# 1. 設定ファイル確認
cat scripts/parallel-tasks/sprint-XX.conf
cat scripts/parallel-tasks/sprint-XX.tasks

# 2. ステータスディレクトリ初期化
mkdir -p /home/iguchi/work/.parallel-dev-status/reviews
cat > /home/iguchi/work/.parallel-dev-status/alerts.log << 'EOF'
# Sprint XX Alerts Log
EOF
cat > /home/iguchi/work/.parallel-dev-status/shared-board.md << 'EOF'
# 共有ボード - Sprint XX
---
EOF
> /home/iguchi/work/.parallel-dev-status/reviewed.txt
rm -f /home/iguchi/work/.parallel-dev-status/reviews/*.txt

# 3. developブランチ準備
cd /home/iguchi/work/duel-log-app
git checkout develop && git pull origin develop

# 4. テスト確認
cd backend && TEST_DATABASE_URL="sqlite:///./test.db" uv run pytest -x -q
cd ../frontend && npm run test:unit -- --run

# 5. セットアップ
./scripts/parallel-dev-setup.sh scripts/parallel-tasks/sprint-XX.conf

# 6. ワーカー起動
./scripts/parallel-dev-start.sh scripts/parallel-tasks/sprint-XX
```

---

## トラブル時の対処

### 前回のWorktreeが残っている
```bash
# Worktree一覧確認
git worktree list

# 削除
git worktree remove /home/iguchi/work/duel-log-app-worker_name --force
```

### 前回のブランチが残っている
```bash
# ブランチ一覧
git branch

# 削除（マージ済み）
git branch -d branch_name

# 強制削除
git branch -D branch_name
```

### tmuxセッションが残っている
```bash
tmux kill-session -t duel-team
```
