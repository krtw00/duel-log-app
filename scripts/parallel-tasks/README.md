# 並列開発環境

tmux + Git Worktree + Claude Code で複数Issueを同時処理するための環境。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│ ユーザー                                                         │
│  - 方針決定、Issue選定、最終承認                                 │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ PM（pane 0）                                                     │
│  - タスク割り当て、進捗監視、マージ判断、統合テスト               │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│Worker 1  │Worker 2  │Worker 3  │Worker 4  │Worker 5  │Worker 6  │
│(Claude)  │(Claude)  │(Claude)  │(Claude)  │(Claude)  │(Claude)  │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

## クイックスタート

```bash
# 1. 設定ファイルを作成（または既存を編集）
vim scripts/parallel-tasks/default.conf

# 2. タスクファイルを作成
vim scripts/parallel-tasks/default.tasks

# 3. セットアップ実行
./scripts/parallel-dev-setup.sh

# 4. tmuxセッションにアタッチ
tmux attach -t duel-team

# 5. ワーカーにタスク送信
./scripts/parallel-dev-start.sh
```

## 設定ファイル形式

### ワーカー定義 (*.conf)

```
# 形式: worker_name:branch_name:issue_numbers
backend:fix/datetime-aware:#299,#316
frontend:fix/i18n-hardcoded:#318
tester:test/admin-permissions:#315,#297
```

### タスク定義 (*.tasks)

```
[backend]
あなたはバックエンド開発者です。
...タスク内容...

[frontend]
あなたはフロントエンド開発者です。
...タスク内容...
```

## スクリプト一覧

| スクリプト | 説明 |
|-----------|------|
| `parallel-dev-setup.sh` | 環境セットアップ（ブランチ、Worktree、tmux） |
| `parallel-dev-start.sh` | 各ワーカーにClaudeを起動してタスク送信 |
| `parallel-dev-dashboard.sh` | 進捗ダッシュボード表示 |
| `parallel-dev-integrate.sh` | マージ・統合テスト |
| `parallel-dev-cleanup.sh` | 環境クリーンアップ |

## tmuxペイン操作

| キー | 操作 |
|------|------|
| `Ctrl+b q` | ペイン番号表示 |
| `Ctrl+b 矢印` | ペイン移動 |
| `Ctrl+b z` | ペイン最大化/復帰 |
| `Ctrl+b d` | デタッチ |

## PM統合フロー

```bash
# 1. ワーカー完了を待つ
./scripts/parallel-dev-dashboard.sh

# 2. 完了したワーカーをマージ
./scripts/parallel-dev-integrate.sh backend
./scripts/parallel-dev-integrate.sh frontend

# 3. 統合テスト
./scripts/parallel-dev-integrate.sh --test

# 4. クリーンアップ
./scripts/parallel-dev-cleanup.sh
```

## 注意事項

- 開発サーバーは共有（Supabase 1セット）
- DBスキーマ変更を含むIssueは1件のみ同時処理
- 各ワーカーはコード変更 + ビルドチェックのみ（サーバー起動不要）
- 統合テストはPMがdevelopで実行
