# 規約文書の根拠（出典リスト）

このドキュメントは、`.claude/coding-rules.md` と `.claude/rules-checklist.md` の作成に参考にした、プロジェクト内の公式規約ドキュメントを記載しています。

## 主要参考文書

### 📄 README.md
**位置**: `/README.md`

**参考した内容**:
- 技術スタック（Python 3.11+, FastAPI, Vue 3 など）
- プロジェクト概要・機能説明
- 開発環境セットアップ手順
- Git 運用ルール（main/develop/フィーチャーブランチ）
- Pre-commit Hooks のセットアップ

**該当セクション**:
- 技術スタック → `coding-rules.md` の言語別フォーマッター
- Git 運用 → `coding-rules.md` の Git・PR 運用
- Pre-commit → `coding-rules.md` の pre-commit hooks

---

### 📄 CLAUDE.md
**位置**: `/CLAUDE.md`

**参考した内容**:
- バックエンド・フロントエンドの技術スタック詳細
- よく使うコマンド集
- アーキテクチャの概要（APIレイヤー、サービスレイヤー、モデル層）
- 重要なパターン（BaseService パターン、Composables など）
- データベーススキーマ関連情報

**該当セクション**:
- テスト方針 → `coding-rules.md` のテスト必須場面
- 依存管理 → `coding-rules.md` の依存管理方針
- コミットメッセージ → `coding-rules.md` の Git・PR 運用

---

### 📄 docs/development-guide.md
**位置**: `/docs/development-guide.md`

**参考した内容**:
- コーディング規約（Black, Ruff, Prettier, ESLint）
- ブランチ戦略（main, develop, フィーチャーブランチ）
- ブランチ命名規則（形式・例）
- コミットメッセージ規約（Conventional Commits）
- テスト方針

**該当セクション**:
- すべてのセクションの基盤
- `coding-rules.md` の言語別フォーマッター・命名規則・テスト方針
- `rules-checklist.md` のコミット・PR 運用

---

### 📄 docs/coding-conventions.md
**位置**: `/docs/coding-conventions.md`

**参考した内容**:
- 基本原則（DRY, KISS, YAGNI）
- フォーマット設定（Black, Prettier の詳細）
- 命名規則（Python: snake_case/PascalCase, TypeScript: snake_case）
- 命名規則の移行戦略（古い camelCase からの段階的置き換え）
- コメント・ドキュメント方針
- リンティング設定（Ruff, ESLint）
- コミットメッセージ規約

**該当セクション**:
- `coding-rules.md` の基本命名規則とアンチパターン
- `coding-rules.md` のドキュメント化セクション
- `rules-checklist.md` の命名規則チェック

---

### 📄 docs/error-handling.md
**位置**: `/docs/error-handling.md`

**参考した内容**:
- バックエンド例外処理パターン（400, 401, 403, 422, 500）
- フロントエンドエラーハンドリング（API インターセプター）
- グローバル通知システム（トースト通知）
- ローディング管理

**該当セクション**:
- `coding-rules.md` の例外処理セクション
- `rules-checklist.md` の例外処理・エラーハンドリング

---

### 📄 docs/backend-architecture.md
**位置**: `/docs/backend-architecture.md`

**参考した内容**:
- ディレクトリ構造（api, core, db, models, schemas, services）
- レイヤー化アーキテクチャ
- 認証・認可パターン
- 設定管理（Pydantic BaseSettings）
- データベースマイグレーション（Alembic）

**該当セクション**:
- `coding-rules.md` のテスト方針
- `rules-checklist.md` のファイル・フォルダ構造

---

## 設定ファイル参考資料

### 📋 backend/pyproject.toml
**位置**: `/backend/pyproject.toml`

**参考した内容**:
- Black 設定（行長 88 字）
- Ruff ルール設定（E, W, F, I, C, B ルール）
- Pytest 設定（カバレッジ, テストパス定義）
- Coverage 設定（除外ファイル・行）

**該当セクション**:
- `coding-rules.md` の Python フォーマッター・リンター設定
- `rules-checklist.md` のテストカバレッジチェック

---

### 📋 .pre-commit-config.yaml
**位置**: `/.pre-commit-config.yaml`

**参考した内容**:
- Black・Ruff（Python）のフック設定
- Prettier（フロントエンド）のフック設定
- 一般的なファイルチェック（YAML, JSON, トレーリング空白など）

**該当セクション**:
- `coding-rules.md` の pre-commit hooks セクション
- `rules-checklist.md` のフォーマット・リンティングチェック

---

### 📋 frontend/tsconfig.json
**位置**: `/frontend/tsconfig.json`

**参考した内容**:
- TypeScript コンパイラオプション
- strict モード有効（noUnusedLocals, noUnusedParameters）
- パスエイリアス設定（`@/*`）

**該当セクション**:
- `coding-rules.md` の TypeScript/Vue 型チェック
- `rules-checklist.md` の型チェック項目

---

## その他参考リソース

### 外部規約・ガイドラインの参照

| 規約 | 参照箇所 | 使用箇所 |
|------|--------|---------|
| **Conventional Commits** | https://www.conventionalcommits.org/ja/ | `coding-rules.md` / `rules-checklist.md` のコミットメッセージ |
| **PEP 8** | https://pep8-ja.readthedocs.io/ | Python コーディング規約の基盤 |
| **Vue.js Style Guide** | https://ja.vuejs.org/style-guide/ | Vue コンポーネント命名・構造 |
| **Prettier Config** | https://prettier.io/docs/en/options | フロントエンドフォーマット設定 |
| **ESLint Rules** | https://eslint.org/docs/latest/rules/ | TypeScript/Vue リンター設定 |

---

## ドキュメント生成日

- **生成日**: 2025-11-08
- **生成者**: Claude Code (MCP-first mode)
- **参考文書バージョン**: プロジェクト最新版
- **保管場所**: `.claude/` ディレクトリ（git 未追跡）
- **更新予定**: 定期的に最新情報に同期

---

## 利用方法

このドキュメント群は、Claude Code が開発支援を行う際に参照するコンテキストです。

1. **AI による定期更新**: 新しい規約やベストプラクティスが追加された場合、AI が自動抽出・更新
2. **根拠の透明性**: `sources.md` で各規約の出典を明確に記録
3. **git 未追跡**: チーム固有のコンテキストのため、`.gitignore` で除外

---

## 関連ドキュメント（git 追跡）

- `docs/coding-rules.md` - 公式コーディング規約（該当なし）
- `docs/rules-checklist.md` - 公式チェックリスト（該当なし）
- `docs/development-guide.md` - 開発プロセス全般
- `docs/error-handling.md` - エラーハンドリング設計
- `docs/backend-architecture.md` - バックエンドアーキテクチャ
