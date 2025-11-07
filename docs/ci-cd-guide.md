# CI/CD 設定ガイド

このドキュメントは、Duel Log AppのCI/CD設定とトラブルシューティングについて説明します。

## 📋 ワークフロー一覧

| ワークフロー | ファイル | トリガー | 説明 |
|------------|---------|---------|------|
| CI | `ci.yml` | push/PR (main) | メインCI（テスト、リンティング、カバレッジ） |
| CodeQL | `codeql.yml` | push/PR (main) + 週次 | セキュリティ分析 |
| E2E Tests | `e2e.yml` | push/PR (main) | Playwright E2Eテスト |
| Docker Test | `docker-test.yml` | push/PR (main) | Docker統合テスト |
| Lighthouse | `lighthouse.yml` | push/PR (main) | パフォーマンステスト |
| Release | `release.yml` | push (main) | 自動リリース・バージョニング |
| PR Review | `pr-review.yml` | PR作成/更新 | PR自動レビュー |
| Add to Project | `add-to-project.yml` | Issue作成 | Issue自動追加 |

---

## 🔧 必要な設定

### GitHub Secrets

以下のシークレットを設定してください（Settings > Secrets and variables > Actions）：

1. **PROJECT_TOKEN** （必須）
   - GitHub Project管理用
   - 必要な権限: `project (read/write)`

2. **CODECOV_TOKEN** （オプション、削除済み）
   - ~~Codecovでコードカバレッジ可視化~~
   - 有料のため削除されました
   - カバレッジレポートはCI logsで確認できます

### GitHub Actions権限

リポジトリ設定で以下を確認：

1. **Settings > Actions > General > Workflow permissions**
   - ✅ "Read and write permissions" を選択
   - ✅ "Allow GitHub Actions to create and approve pull requests" にチェック

これにより、ワークフローがPRにコメントしたりラベルを追加できます。

---

## 📝 Pull Request のルール

### PRタイトルの形式

PRタイトルは **Conventional Commits** 形式に従う必要があります：

```
<type>(<scope>): <subject>
```

#### 有効なタイプ

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードスタイル（フォーマット、セミコロンなど）
- `refactor`: リファクタリング
- `perf`: パフォーマンス改善
- `test`: テスト追加・修正
- `build`: ビルドシステム・外部依存関係
- `ci`: CI設定ファイル・スクリプト
- `chore`: その他の変更
- `revert`: コミットの取り消し

#### 良い例

```
feat(decks): デッキフィルタリング機能を追加
fix(auth): ログイン時のトークンリフレッシュを修正
docs(readme): セットアップ手順を更新
refactor(api): statistics エンドポイントを整理
```

#### 悪い例

```
Claude/review cicd requirements  ← ブランチ名そのまま
Update code  ← タイプがない
ADD NEW FEATURE  ← 大文字で始まっている
```

### PRタイトルの修正方法

1. **GitHubのWebインターフェース**:
   - PRページの右上「Edit」ボタン
   - タイトルを修正して保存

2. **GitHubのCLI（gh）**:
   ```bash
   gh pr edit <PR番号> --title "feat(ci): CI/CD機能を追加"
   ```

---

## 🐛 トラブルシューティング

### エラー: "No release type found in pull request title"

**原因**: PRタイトルがConventional Commits形式に従っていません。

**解決方法**: 上記の「PRタイトルの形式」に従ってタイトルを修正してください。

---

### エラー: "Resource not accessible by integration"

**原因**: GitHub Actionsがリソース（PR、Issue等）にアクセスする権限がありません。

**解決方法**:
1. Settings > Actions > General > Workflow permissions
2. "Read and write permissions" を選択
3. "Allow GitHub Actions to create and approve pull requests" にチェック

**注**: この問題は修正済みです（`permissions`セクションを追加 + `continue-on-error: true`）

---

### テストが失敗する

#### バックエンドテスト

```bash
# ローカルでテスト実行
cd backend
pytest

# 特定のテストのみ
pytest tests/test_auth.py

# カバレッジ付き
pytest --cov=app --cov-report=term-missing
```

#### フロントエンドテスト

```bash
# ローカルでテスト実行
cd frontend
npm run test:unit

# カバレッジ付き
npm run test:unit -- --coverage
```

---

### リンティングエラー

#### バックエンド（Ruff + Black）

```bash
cd backend

# リンティングチェック
ruff check .

# 自動修正
ruff check . --fix

# フォーマット
black .
```

#### フロントエンド（ESLint + Prettier）

```bash
cd frontend

# リンティングチェック
npm run lint

# フォーマット
npm run format
```

---

### 型エラー

#### フロントエンド（TypeScript）

```bash
cd frontend

# 型チェック
npm run build
# または
npx vue-tsc --noEmit
```

#### バックエンド（mypy）

```bash
cd backend
pip install mypy
mypy app/ --ignore-missing-imports
```

**注**: mypyは警告のみで、CI失敗の原因にはなりません。

---

## 📊 カバレッジレポートの確認

### ローカル環境

#### バックエンド

```bash
cd backend
pytest --cov=app --cov-report=html

# HTMLレポートを開く
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

#### フロントエンド

```bash
cd frontend
npm run test:unit -- --coverage

# HTMLレポートを開く
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

### CI環境

GitHub Actionsのログでカバレッジを確認：

1. Actions タブを開く
2. CI ワークフローを選択
3. 該当のテストステップのログを確認

カバレッジサマリーがコンソールに表示されます。

---

## 🔄 Dependabot

毎週月曜日 9:00 JST に以下の依存関係を自動チェック：

- npm packages（フロントエンド）
- pip packages（バックエンド）
- Docker images
- GitHub Actions

自動的にPRが作成されるので、レビューしてマージしてください。

---

## 🚀 デプロイフロー

1. **開発**: フィーチャーブランチで開発
2. **PR作成**: mainブランチへのPR
3. **CI実行**: 全てのチェックが自動実行
4. **レビュー**: コードレビュー
5. **マージ**: mainブランチにマージ
6. **自動リリース**: Semantic Releaseが自動でバージョニング
7. **デプロイ**: Vercel（frontend）とRender（backend）が自動デプロイ

---

## 📚 参考資料

- [Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/)
- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Playwright ドキュメント](https://playwright.dev/)
