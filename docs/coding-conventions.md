# コーディング規約

## 1. はじめに

このドキュメントは、Duel Log App開発プロジェクトにおけるコードの一貫性、可読性、保守性を高めるためのコーディング規約を定めたものです。
すべてのコントリビューターは、この規約に従って開発を行うことが推奨されます。

## 2. 基本原則

*   **DRY (Don't Repeat Yourself):** コードの重複を避け、共通ロジックは積極的に関数やユーティリティとして切り出してください。
*   **KISS (Keep It Simple, Stupid):** 不必要に複雑な設計を避け、シンプルで理解しやすいコードを心がけてください。
*   **YAGNI (You Ain't Gonna Need It):** 将来必要になるかもしれないという予測だけで機能を実装しないでください。

## 3. フォーマット (コードスタイル)

当プロジェクトでは、コードフォーマッターを `pre-commit` フックで自動実行することにより、コードスタイルを強制しています。手動でフォーマットを調整する必要はありません。

### 3.1. Python (バックエンド)

*   **フォーマッター:** `black` および `ruff-format` を使用します。
*   **設定:** `backend/pyproject.toml` に基づき、自動でフォーマットが適用されます。
    *   一行の最大文字数: 88文字

### 3.2. TypeScript / Vue (フロントエンド)

*   **フォーマッター:** `Prettier` を使用します。
*   **設定:** `frontend/.prettierrc` に基づき、自動でフォーマットが適用されます。
    *   引用符: シングルクォート (`'`)
    *   末尾のカンマ: 常に付与 (`all`)
    *   一行の最大文字数: 100文字

## 4. 命名規則

プロジェクト全体として、**`snake_case` (スネークケース) への統一**を進めています。

### 4.1. Python (バックエンド)

*   **モジュール、関数、変数:** `snake_case` で記述します。
    *   例: `deck_service.py`, `get_user_duels()`, `user_id`
*   **クラス:** `PascalCase` で記述します。
    *   例: `DeckService`, `User`
*   **定数:** `UPPER_SNAKE_CASE` で記述します。
    *   例: `MAX_DUEL_RECORDS`

### 4.2. TypeScript / Vue (フロントエンド)

*   **変数、関数、ファイル名:** **`snake_case` で記述します。**
    *   例: `use_duel_form.ts`, `fetch_statistics()`, `duel_data`
*   **コンポーネント:** `PascalCase.vue` で記述します。
    *   例: `DuelFormDialog.vue`, `StatisticsChart.vue`
*   **型 / インターフェース:** `PascalCase` で記述します。
    *   例: `DuelStats`, `MatchupData`

### 4.3. 既存コードの移行戦略

**新規に作成するコードは、必ず上記の命名規則に従ってください。**

現在、コードベースには `camelCase` で書かれた古いコードが混在しています。それらの古いコードについても、**機能追加やリファクタリングを行う際に、関連する箇所から段階的に `snake_case` に置き換えていく**ことを推奨します。これにより、徐々にコードベース全体の命名規則を統一していきます。

## 5. コメントとドキュメント

コードの可読性を高めるため、**「なぜ」そのコードが必要なのか**を説明するコメントを重視します。

### 5.1. Python (バックエンド)

*   **Docstring:** 複雑な関数やクラスには、**Googleスタイル**のdocstringを記述してください。
    *   引数、戻り値、発生しうる例外について明記します。
*   **インラインコメント:** 複雑なアルゴリズムやビジネスロジックのステップを説明するために使用します。

### 5.2. TypeScript / Vue (フロントエンド)

*   **ファイルレベルコメント:** VueコンポーネントやComposableのファイル先頭に、その役割や機能をJSDoc形式で記述してください。
*   **JSDoc:** 複雑な関数には、引数や戻り値を含むJSDocを記述してください。

## 6. リンティング (静的解析)

`pre-commit` フックにより、コミット時に自動でリンターが実行されます。エラーが検出された場合は、コミットを修正してください。

*   **Python:** `Ruff` を使用します。設定は `backend/pyproject.toml` を参照してください。
*   **TypeScript / Vue:** `ESLint` を使用します。設定は `frontend/eslint.config.js` を参照してください。

## 7. コミットメッセージ

コミットメッセージは **Conventional Commits** の規約に従ってください。

*   **フォーマット:** `type(scope): subject`
*   **`type` の例:**
    *   `feat`: 新機能の追加
    *   `fix`: バグ修正
    *   `docs`: ドキュメントの変更
    *   `style`: コードスタイルのみの変更（フォーマットなど）
    *   `refactor`: リファクタリング
    *   `test`: テストの追加・修正
    *   `chore`: ビルドプロセスや補助ツールの変更
*   **`scope` (任意):** 変更範囲（例: `api`, `frontend`, `db`）
*   **`subject`:** 変更内容を簡潔に記述

**良い例:**
```
feat(api): add user profile endpoint
fix(frontend): correct login button behavior
docs: update coding conventions
```
