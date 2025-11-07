# Duel Log App ドキュメンテーション

このディレクトリは、Duel Log Appの設計、アーキテクチャ、開発規約に関するドキュメントをまとめたものです。

## 📖 ドキュメント一覧

### 🏗️ アーキテクチャ・設計

- **[バックエンドアーキテクチャ](./backend-architecture.md)**: FastAPI, SQLAlchemy を用いたバックエンド構造、サービスレイヤー、API設計について解説します。
- **[フロントエンドアーキテクチャ](./frontend-architecture.md)**: Vue 3 Composition API, Vuetify, Pinia を用いたフロントエンド構造、状態管理、コンポーネント設計について解説します。
- **[データベーススキーマ](./db-schema.md)**: PostgreSQL データベースのテーブル定義、リレーションシップ、インデックス設計について記述します。

### 🔌 API・統合

- **[APIリファレンス](./api-reference.md)**: バックエンドが提供する全APIエンドポイントの詳細な仕様、リクエスト/レスポンス形式、認証について記述します。

### 📋 開発ガイドライン

開発を始める前に、以下のドキュメントを一読してください。

- **[開発ガイド](./development-guide.md)**: ブランチ戦略、コミット規約（Conventional Commits）、Pull Request ワークフロー、開発環境のセットアップについて説明します。
- **[環境構築ガイド](./environment-setup.md)**: バックエンド・フロントエンド・Docker環境のセットアップ、環境変数設定、依存ツールのインストール方法について説明します。
- **[コーディング規約](./coding-conventions.md)**: 命名規則、フォーマッター設定（Black, Ruff, Prettier, ESLint）、型安全性に関する規約を定めています。

### 💡 設計思想・ベストプラクティス

- **[エラーハンドリング](./error-handling.md)**: バックエンド・フロントエンドにおけるエラー処理の設計パターンと実装例を定義しています。
- **[コード可読性向上ガイド](./code-readability-guide.md)**: ドキュメンテーション、インラインコメント、命名規則の統一に関するガイドラインを提供します。

### 🚀 デプロイ・運用

- **[デプロイ手順](./deployment.md)**: Vercel（フロントエンド）、Render（バックエンド）へのデプロイ手順、本番環境設定について説明します。
- **[CI/CD設定ガイド](./ci-cd-guide.md)**: GitHub Actions ワークフロー（CI, CodeQL, E2E, Lighthouse, Release）の説明とトラブルシューティング。
- **[GitHub通知設定ガイド](./notification-settings.md)**: CI実行時のメール通知削減、GitHub通知設定の推奨設定について説明します。

### 🐛 運用ツール・セットアップ

- **[バグトラッキングシステム設定ガイド](./bug-tracking-setup.md)**: GitHub Issues と Projects を用いたバグ管理システムのセットアップ方法について説明します。

### 📚 開発チュートリアル・リファレンス

- **[開発チュートリアル](./development-tutorial.md)**: 初心者向けの開発環境構築チュートリアルと便利なコマンド集。

### 🤖 AI向けドキュメント（`.claude/` ディレクトリ）

以下のドキュメントは Claude Code（AI）向けに `.claude/` ディレクトリに保管されています：

- **[コーディングルール](../.claude/coding-rules.md)**: AI が遵守すべきコーディング標準と規約の統合ドキュメント。
- **[ルールチェックリスト](../.claude/rules-checklist.md)**: PR提出前の確認項目リスト。
- **[出典リファレンス](../.claude/sources.md)**: AI コンテキストドキュメントの参照元トレーサビリティ。
- **[更新ガイド](../.claude/UPDATE-GUIDE.md)**: AI コンテキストドキュメントのメンテナンス手順。

---

## 🔍 クイックリンク

**最初に読むべきドキュメント:**
1. [開発ガイド](./development-guide.md) - ブランチ戦略、コミット規約、開発フロー
2. [環境構築ガイド](./environment-setup.md) - 開発環境のセットアップ
3. [コーディング規約](./coding-conventions.md) - コード品質基準

**アーキテクチャを学ぶ:**
1. [バックエンドアーキテクチャ](./backend-architecture.md)
2. [フロントエンドアーキテクチャ](./frontend-architecture.md)
3. [データベーススキーマ](./db-schema.md)

**実装時に確認する:**
1. [APIリファレンス](./api-reference.md)
2. [エラーハンドリング](./error-handling.md)
3. [コード可読性向上ガイド](./code-readability-guide.md)

**運用関連:**
1. [デプロイ手順](./deployment.md)
2. [CI/CD設定ガイド](./ci-cd-guide.md)
3. [GitHub通知設定ガイド](./notification-settings.md)
