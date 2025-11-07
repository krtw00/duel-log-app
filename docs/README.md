# Duel Log App ドキュメンテーション

このディレクトリは、Duel Log Appの設計、アーキテクチャ、開発規約に関するドキュメントを**カテゴリー別に階層化**して整理したものです。

## 📖 ドキュメント構造

```
docs/
├── README.md （このファイル - 全体インデックス）
│
├── architecture/           📐 アーキテクチャ・設計
│   ├── backend-architecture.md
│   ├── frontend-architecture.md
│   └── db-schema.md
│
├── api/                    🔌 API・統合
│   └── api-reference.md
│
├── guides/                 📋 開発ガイドライン
│   ├── development-guide.md
│   ├── environment-setup.md
│   └── development-tutorial.md
│
├── design/                 💡 設計思想・ベストプラクティス
│   ├── error-handling.md
│   └── code-readability-guide.md
│
├── deployment/             🚀 デプロイ・運用
│   ├── deployment.md
│   ├── ci-cd-guide.md
│   └── notification-settings.md
│
└── operations/             🐛 運用ツール・管理
    └── bug-tracking-setup.md
```

---

## 🎯 クイックスタート

### 🆕 新規開発者の方
1. **[guides/environment-setup.md](./guides/environment-setup.md)** - 開発環境をセットアップ
2. **[guides/development-guide.md](./guides/development-guide.md)** - ブランチ戦略とワークフローを理解
3. **[architecture/](./architecture/)** - システムアーキテクチャを学習

### 👨‍💻 既存開発者の方
- **[guides/development-guide.md](./guides/development-guide.md)** - コミット規約やブランチ戦略の確認
- **[api/api-reference.md](./api/api-reference.md)** - API仕様の確認
- **[design/error-handling.md](./design/error-handling.md)** - エラーハンドリングパターンの確認

### 🚀 デプロイ・運用担当者の方
- **[deployment/deployment.md](./deployment/deployment.md)** - デプロイ手順
- **[deployment/ci-cd-guide.md](./deployment/ci-cd-guide.md)** - CI/CD パイプラインの管理
- **[operations/bug-tracking-setup.md](./operations/bug-tracking-setup.md)** - バグ管理システムの構築

---

## 📚 カテゴリー別ドキュメント

### 🏗️ [アーキテクチャ・設計](./architecture/)
システムの全体構造、レイヤー設計、データベース設計について解説します。

**含まれる内容:**
- バックエンド構造（FastAPI、SQLAlchemy、サービスレイヤー）
- フロントエンド構造（Vue 3、Pinia、コンポーネント設計）
- データベーススキーマ（テーブル定義、リレーション）

**このセクションを読むべき人:**
- 新規開発者がシステム全体を理解したい場合
- 機能追加時に既存アーキテクチャを確認したい場合

---

### 🔌 [API・統合](./api/)
バックエンドが提供するAPIエンドポイント、通信仕様について記述します。

**含まれる内容:**
- 全APIエンドポイントの仕様
- リクエスト/レスポンス形式
- 認証・認可方式

**このセクションを読むべき人:**
- フロントエンド開発者がAPI仕様を確認したい場合
- 外部システムがこのAPIを利用したい場合

---

### 📋 [開発ガイドライン](./guides/)
開発を始めるために必要な環境構築、ブランチ戦略、コーディング規約について説明します。

**含まれる内容:**
- 環境変数設定とセットアップ手順
- ブランチ戦略（main/develop/フィーチャーブランチ）
- Git ワークフロー（Conventional Commits）
- 初心者向けチュートリアル

**このセクションを読むべき人:**
- 開発を始める全ての人（**最初にこちらを読んでください**）
- 既存開発者が規約を確認したい場合

---

### 💡 [設計思想・ベストプラクティス](./design/)
エラーハンドリング、コード品質、保守性向上に関するガイドラインを提供します。

**含まれる内容:**
- エラー処理の設計パターン（バックエンド・フロントエンド）
- コード品質基準（ドキュメント、コメント、命名規則）
- 可読性向上の施策
- 長期的な品質改善ロードマップ

**このセクションを読むべき人:**
- エラーハンドリングの実装方法を確認したい場合
- コード品質を向上させたい場合

**注記:** コーディング規約（フォーマッター、リンター、型安全性）は [.claude/coding-rules.md](../.claude/coding-rules.md) に統合されています（AI向けドキュメント）。

---

### 🚀 [デプロイ・運用](./deployment/)
本番環境へのデプロイ、CI/CD パイプライン、通知設定について説明します。

**含まれる内容:**
- Vercel（フロントエンド）へのデプロイ手順
- Render（バックエンド）へのデプロイ手順
- GitHub Actions ワークフロー
- CI/CD トラブルシューティング
- メール通知設定

**このセクションを読むべき人:**
- デプロイ担当者
- DevOps/CI-CD 担当者
- 全開発者（メール通知を制御したい場合）

---

### 🐛 [運用ツール・管理](./operations/)
プロジェクト運用に関するツール設定、バグ管理システムについて説明します。

**含まれる内容:**
- GitHub Issues と Projects を用いたバグ管理
- 自動化ワークフロー
- 非エンジニアメンバー向けバグ報告フロー

**このセクションを読むべき人:**
- プロジェクトマネージャー
- チームリード

---

## 🤖 AI向けドキュメント

以下は Claude Code（AI）が参照する専用ドキュメントです（`.claude/` ディレクトリ）：

- **[.claude/coding-rules.md](../.claude/coding-rules.md)** - コーディング規約（フォーマッター、リンター、命名規則）
- **[.claude/rules-checklist.md](../.claude/rules-checklist.md)** - PR確認チェックリスト
- **[.claude/sources.md](../.claude/sources.md)** - ドキュメント出典リスト
- **[.claude/UPDATE-GUIDE.md](../.claude/UPDATE-GUIDE.md)** - AI コンテキストドキュメントの更新手順

これらは git 追跡対象外であり、定期的に最新の情報に更新されます。

---

## 🗂️ アーカイブドキュメント

以下のドキュメントは、AI向けドキュメント (`.claude/`) と内容が重複するため、アーカイブされています：

- **[.archive/coding-conventions.md](./.archive/coding-conventions.md)** - `.claude/coding-rules.md` に統合

---

## 🔍 ドキュメント検索

**特定のトピックを探している場合:**

| 探している情報 | 読むべきドキュメント |
|--------------|------------------|
| 環境構築方法 | [guides/environment-setup.md](./guides/environment-setup.md) |
| ブランチ戦略、Git ワークフロー | [guides/development-guide.md](./guides/development-guide.md) |
| コーディング規約 | [.claude/coding-rules.md](../.claude/coding-rules.md) |
| API仕様 | [api/api-reference.md](./api/api-reference.md) |
| バックエンド構造 | [architecture/backend-architecture.md](./architecture/backend-architecture.md) |
| フロントエンド構造 | [architecture/frontend-architecture.md](./architecture/frontend-architecture.md) |
| エラーハンドリング | [design/error-handling.md](./design/error-handling.md) |
| コード品質・可読性 | [design/code-readability-guide.md](./design/code-readability-guide.md) |
| デプロイ手順 | [deployment/deployment.md](./deployment/deployment.md) |
| CI/CD 設定 | [deployment/ci-cd-guide.md](./deployment/ci-cd-guide.md) |
| メール通知設定 | [deployment/notification-settings.md](./deployment/notification-settings.md) |
| バグ管理システム | [operations/bug-tracking-setup.md](./operations/bug-tracking-setup.md) |

---

## 💡 ドキュメント更新のガイドライン

ドキュメントを更新・追加する場合は、以下の原則に従ってください：

1. **適切なカテゴリーに配置**: どのカテゴリーに属するかを判断
2. **各カテゴリーのREADME.mdを更新**: 新規ドキュメントをリストに追加
3. **トップレベルREADME.mdを更新**: 必要に応じて検索テーブルを更新
4. **AI向けドキュメントとの同期**: 重複がないか確認

---

## 📞 ドキュメントに関する質問・改善提案

ドキュメントに誤りや改善の余地がある場合は、GitHub Issues で報告してください。

**テンプレート:**
```
## ドキュメント改善提案

**対象**: [docs/category/filename.md]

**問題点**: 
[説明]

**提案内容**: 
[改善提案]
```
