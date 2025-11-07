# コーディング規約 — 根拠資料リスト

本ドキュメント (`coding-rules.md`, `rules-checklist.md`) は、以下の公式ドキュメント・設定ファイルを根拠に作成されました。

---

## 公式ドキュメント

### README & セットアップ
- **ファイル:** `README.md`
- **内容:** プロジェクト概要、技術スタック、開発環境セットアップ、Git運用ルール、pre-commit hooks
- **抽出項目:** 
  - 技術スタック（Python 3.11+, FastAPI, PostgreSQL, Vue.js 3, Vite, Vuetify 3）
  - ツール（Black, Ruff, Pytest, ESLint, Prettier, Vitest）
  - ブランチ戦略（main, develop, フィーチャーブランチ）

### 開発ガイドライン
- **ファイル:** `docs/development-guide.md`
- **内容:** コーディング規約、ブランチ戦略、コミットメッセージ、テスト方針
- **抽出項目:**
  - Black: 88文字
  - Ruff: リンティング
  - ESLint + Prettier: フロントエンド
  - Conventional Commits 準拠
  - テスト: pytest (バックエンド), Vitest (フロントエンド)

### コーディング規約詳細
- **ファイル:** `docs/coding-conventions.md`
- **内容:** 命名規則（snake_case への統一）、フォーマット、コメント・ドキュメント
- **抽出項目:**
  - Python: `snake_case` (関数・変数・モジュール) + `PascalCase` (クラス)
  - TypeScript/Vue: `snake_case` (ファイル・変数) + `PascalCase` (コンポーネント・型)
  - Google形式 Docstring (Python)
  - JSDoc (TypeScript/Vue)
  - DRY, KISS, YAGNI の基本原則

### プロジェクト非公開ガイド
- **ファイル:** `CLAUDE.md`
- **内容:** アーキテクチャ概要、よく使うコマンド、パターン集
- **抽出項目:**
  - バックエンド: FastAPI, SQLAlchemy 2.0, BaseService パターン
  - フロントエンド: Vue 3 Composition API, Pinia, Composables パターン
  - 統計情報・OBSオーバーレイの多層構造

---

## 設定ファイル

### Pre-commit 設定
- **ファイル:** `.pre-commit-config.yaml`
- **内容:** Git hooks の自動実行設定
- **確認項目:**
  - Black (Python フォーマット)
  - Ruff (Python リンティング + フォーマット)
  - Prettier (フロントエンド フォーマット)
  - 一般的なファイルチェック（trailing whitespace, YAML/JSON 構文など）

### バックエンド設定
- **ファイル:** `backend/pyproject.toml`
- **内容:** Black, Ruff, Pytest, Coverage 設定
- **確認項目:**
  - Black: 88文字、py311 対象
  - Ruff: `E, W, F, I, C, B` 選択、除外ルール定義
  - Pytest: `tests/` ディレクトリ、`test_*` 関数、カバレッジ設定 (80%+ 目標)

### フロントエンド設定
- **ファイル:** `frontend/.prettierrc`
- **内容:** Prettier フォーマット設定
- **確認項目:**
  - シングルクォート
  - 末尾カンマ常時付与
  - 100文字

- **ファイル:** `frontend/eslint.config.js`
- **内容:** ESLint, TypeScript, Vue.js, JSDoc 設定
- **確認項目:**
  - `@typescript-eslint/no-explicit-any`: warn
  - `@typescript-eslint/no-unused-vars`: warn
  - JSDoc: `require-jsdoc` (FunctionDeclaration, MethodDefinition, ClassDeclaration)
  - Vue: マルチワード コンポーネント名チェック無効化

---

## 関連ドキュメント（参考）

- **`docs/error-handling.md`** — エラーハンドリング設計
- **`docs/api-reference.md`** — APIエンドポイント仕様
- **`docs/db-schema.md`** — データベーススキーマ詳細
- **`docs/deployment.md`** — デプロイ手順（Vercel, Render, Neon）
- **`docs/backend-architecture.md`** — バックエンドアーキテクチャ詳細
- **`docs/frontend-architecture.md`** — フロントエンドアーキテクチャ詳細

---

## バージョン・更新日

- **作成日:** 2025-11-08
- **根拠ドキュメント版:** README.md, CLAUDE.md の最新版
- **ツールバージョン参考:**
  - Black 24.10.0
  - Ruff 0.8.4
  - Prettier 4.0.0-alpha.8
  - Python 3.11+, Vue.js 3, TypeScript 5.x+

---

## 注記

1. **既存コードの移行:** コーディング規約内で記述の「既存コードの移行戦略」を参照
2. **設定の更新:** Pre-commit hooks や設定ファイルはプロジェクト進行に伴い更新される可能性があります
3. **確認方法:** 本ドキュメント作成後、各設定ファイルの変更時は sources.md も併せて更新してください
