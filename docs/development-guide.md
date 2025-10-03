# 開発ガイドライン

このドキュメントは、Duel Log Appの開発を円滑に進めるためのガイドラインを定めます。

---

## 1. コーディング規約

コードの品質と一貫性を保つため、以下の規約に従ってください。

### バックエンド (Python)

- **フォーマッター**: [Black](https://github.com/psf/black) を使用します。
- **リンター**: [Ruff](https://github.com/astral-sh/ruff) を使用します。
- **型ヒント**: すべての関数とメソッドに型ヒントを付与することを推奨します。

```bash
# Ruffでのチェック
ruff check .

# Blackでのフォーマット
black .
```

### フロントエンド (TypeScript / Vue)

- **フォーマッター**: [Prettier](https://prettier.io/) を使用します。
- **リンター**: [ESLint](https://eslint.org/) を使用します。
- **規約**: Vue.jsの公式スタイルガイドを推奨します。

```bash
# ESLintでのチェック
npm run lint

# Prettierでのフォーマット
npm run format
```
*(注: `lint`および`format`スクリプトは`package.json`に定義されている必要があります)*

---

## 2. ブランチ戦略

[GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow) をベースとしたシンプルなブランチ戦略を採用します。

- **`main`**: 常にデプロイ可能な安定したブランチです。直接のプッシュは禁止し、プルリクエスト経由でのみマージします。
- **フィーチャーブランチ**: 新機能の開発やバグ修正は、`main`ブランチから新しいブランチを作成して行います。
  - ブランチ名の例: `feature/add-csv-import`, `fix/login-error`

### 開発フロー

1. `main`ブランチを最新の状態に更新します。
   ```bash
   git checkout main
   git pull origin main
   ```
2. 新しいフィーチャーブランチを作成します。
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. 開発を行い、変更をコミットします。
4. 開発が完了したら、プッシュします。
   ```bash
   git push origin feature/your-feature-name
   ```
5. GitHub上で`main`ブランチへのプルリクエストを作成します。
6. コードレビューを受け、CIのチェックが通ったらマージします。

---

## 3. コミットメッセージ

コミットメッセージは、[Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/) の規約に準拠します。

フォーマット: `<type>(<scope>): <subject>`

- **`<type>`**: コミットの種類
  - `feat`: 新機能の追加
  - `fix`: バグ修正
  - `docs`: ドキュメントの変更
  - `style`: コードスタイルの変更（フォーマットなど）
  - `refactor`: リファクタリング
  - `test`: テストの追加・修正
  - `chore`: ビルドプロセスや補助ツールの変更
- **`<scope>`** (optional): 変更の範囲（例: `backend`, `frontend`, `auth`, `deck`）
- **`<subject>`**: 変更内容の簡潔な説明

**コミットメッセージの例:**

```
feat(frontend): CSVインポート機能を追加
fix(backend): タイムゾーンのバリデーションを修正
docs(readme): デプロイ手順を更新
```

---

## 4. テスト

新しい機能を追加、または既存の機能を変更した場合は、必ずテストコードも追加・修正してください。

- **バックエンド**: `backend/tests/` 配下に、`pytest`で実行可能なテストを記述します。
- **フロントエンド**: `frontend/src/` 配下のコンポーネントに対応するテスト（`*.test.ts`）を記述します。

プルリクエストをマージする前に、すべてのテストがパスしていることをCIで確認します。
