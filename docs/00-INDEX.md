# Duel Log App ドキュメント

**TCG対戦履歴記録・分析アプリケーション**

## 目的

Duel Log Appドキュメントのナビゲーションを提供する。

## ドキュメント構造

| ディレクトリ | 内容 |
|-------------|------|
| 00-INDEX | このファイル（ナビゲーション） |
| @./01-introduction/ | プロジェクト概要 |
| @./02-architecture/ | システム構成 |
| @./03-core-concepts/ | 中核となる概念・原則 |
| @./04-data/ | データモデル・DB |
| @./05-features/ | 機能詳細 |
| @./06-interfaces/ | API仕様 |
| @./07-deployment/ | デプロイ・運用 |
| @./08-development/ | 開発者向けガイド |
| @./09-testing/ | テスト |
| @./10-decisions/ | アーキテクチャ決定記録（ADR） |
| @./appendix/ | 付録（用語集等） |
| @./operations/ | 運用ツール・管理 |

---

## はじめに読むべきドキュメント

### 初めての方

| 順序 | ドキュメント | 内容 |
|:----:|------------|------|
| 1 | @./01-introduction/overview.md | プロジェクト概要・Core Value |
| 2 | @./02-architecture/backend-architecture.md | バックエンド構成 |
| 3 | @./02-architecture/frontend-architecture.md | フロントエンド構成 |

### 開発者

| 順序 | ドキュメント | 内容 |
|:----:|------------|------|
| 1 | @./08-development/local-development.md | ローカル環境セットアップ |
| 2 | @./08-development/development-guide.md | ブランチ戦略・コーディング規約 |
| 3 | @./03-core-concepts/error-handling.md | エラーハンドリングパターン |

### 運用担当者

| 順序 | ドキュメント | 内容 |
|:----:|------------|------|
| 1 | @./07-deployment/deployment.md | デプロイ手順 |
| 2 | @./07-deployment/ci-cd-guide.md | CI/CDパイプライン |
| 3 | @./operations/handover-guide.md | 引継ぎガイド |

---

## トピック別インデックス

### 設計・原則

| トピック | ドキュメント |
|---------|------------|
| 設計原則 | @./03-core-concepts/design-principles.md |
| エラーハンドリング | @./03-core-concepts/error-handling.md |
| アーキテクチャ決定 | @./10-decisions/ |
| 用語集 | @./appendix/glossary.md |

### データ

| トピック | ドキュメント |
|---------|------------|
| データモデル | @./04-data/data-model.md |

### 機能設計

| トピック | ドキュメント | 状況 |
|---------|------------|------|
| 統計情報共有 | @./05-features/sharing-feature-design.md | 実装済 |
| OBSオーバーレイ | @./05-features/obs-overlay-design.md | ⛔ 廃止予定 |
| 画面録画分析 | @./05-features/screen-recording-analysis.md | 部分実装 |
| 管理者画面 | @./05-features/admin-panel-design.md | 部分実装 |

### インターフェース

| トピック | ドキュメント |
|---------|------------|
| API仕様 | @./06-interfaces/api-reference.md |

### デプロイ

| トピック | ドキュメント |
|---------|------------|
| デプロイ手順 | @./07-deployment/deployment.md |
| CI/CD | @./07-deployment/ci-cd-guide.md |
| Supabase設定 | @./07-deployment/supabase-deployment-guide.md |

---

## よくある質問への直リンク

| 質問 | ドキュメント |
|------|-------------|
| プロジェクトの概要は？ | @./01-introduction/overview.md |
| ローカル開発環境のセットアップは？ | @./08-development/local-development.md |
| APIエンドポイント一覧は？ | @./06-interfaces/api-reference.md |
| DBスキーマは？ | @./04-data/data-model.md |
| デプロイ手順は？ | @./07-deployment/deployment.md |

---

## バージョン履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 3.0 | 2026-01-21 | AgentMine形式に統一 |
| 2.0 | 2026-01-20 | C4モデル + arc42に基づく構造化 |
| 1.0 | 2025-01 | 初版 |

**次に読むべきドキュメント**: @./01-introduction/overview.md
