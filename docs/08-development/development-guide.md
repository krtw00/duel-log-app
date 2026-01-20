# 開発ガイドライン

このドキュメントは、Duel Log Appの開発を円滑に進めるためのガイドラインを定めます。

---

## 0. 一通り環境そろえたけど全く何していいのかわからん

分かる人→[ココ](../../README.md) を読んだ後に[1. コーディング規約](#1-コーディング規約)

わからない人→ [ココ](./development-tutorial.md)

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

`main`ブランチの安定性を確保しつつ、並行開発を効率的に進めるため、`develop`ブランチを導入したブランチ戦略を採用します。

- **`main`**: 常に本番環境にデプロイ可能な、最も安定したブランチです。リリース可能なコードのみがマージされます。直接のプッシュは禁止し、`develop`ブランチからのプルリクエスト経由でのみマージします。
- **`develop`**: 次期リリースに向けた開発の統合ブランチです。フィーチャーブランチからの変更はここにマージされ、テストが行われます。
- **フィーチャーブランチ**: 新機能の開発やバグ修正は、`develop`ブランチから新しいブランチを作成して行います。
  - ブランチ名の例: `feature/add-csv-import`, `fix/login-error`

  **ブランチ命名規則**

  フィーチャーブランチの命名は、以下の規則に従ってください。

  - **形式**: `<type>/<issue-id>-<description>`
    - `<type>`: ブランチの種類を示します。
      - `feature`: 新機能開発
      - `fix`: バグ修正
      - `hotfix`: 緊急のバグ修正（`main`から分岐）
      - `refactor`: リファクタリング
      - `docs`: ドキュメントの更新
      - `chore`: ビルドツール、ライブラリの更新など、コードの変更を伴わない作業
    - `<issue-id>`: 関連するIssue番号（例: `GH-123`）。Issueトラッカーを使用しない場合は省略可能です。
    - `<description>`: ブランチの目的を簡潔に**英語**で記述します。単語はハイフン (`-`) で繋ぎ、小文字を使用します。

  **例:**

  - `feature/GH-456-add-user-profile-page`
  - `fix/GH-123-fix-login-error`
  - `refactor/extract-common-components`
  - `docs/update-deployment-guide`
  - `chore/update-dependencies`
- **リリースブランチ (オプション)**: 大規模なリリース前には、`develop`からリリースブランチを作成し、最終的なバグ修正や調整を行います。リリース後、`main`と`develop`にマージされます。

### 開発フロー

1. `develop`ブランチを最新の状態に更新します。
   ```bash
   git checkout develop
   git pull origin develop
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
5. GitHub上で`develop`ブランチへのプルリクエストを作成します。
6. コードレビューを受け、CIのチェックが通ったらマージします。
7. リリース準備が整ったら、`develop`ブランチから`main`ブランチへのプルリクエストを作成し、本番環境へデプロイします。

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
