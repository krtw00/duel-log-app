# Duel Log App ドキュメント

**TCG対戦履歴記録・分析アプリケーション**

## ドキュメント構造

このドキュメントは階層化された構造で整理されています。

```
00-INDEX (このファイル)              ← ナビゲーション・入り口
01-introduction                      ← プロジェクト概要
02-architecture                      ← システム構成
03-core-concepts                     ← 中核となる概念・原則
04-data                              ← データモデル・DB
05-features                          ← 機能詳細・設計
06-interfaces                        ← API仕様
07-deployment                        ← デプロイ・運用
08-development                       ← 開発者向けガイド
09-testing                           ← テスト
10-decisions                         ← アーキテクチャ決定記録
appendix                             ← 付録（用語集等）
operations                           ← 運用ツール・管理
reviews                              ← コードレビュー記録
```

---

## はじめに読むべきドキュメント

### 初めての方

Duel Log Appが何をするものか理解したい：

1. **@01-introduction/overview.md** - プロジェクト概要・Core Value
2. **@02-architecture/backend-architecture.md** - バックエンド構成
3. **@02-architecture/frontend-architecture.md** - フロントエンド構成
4. **@../README.md** - クイックスタート

### 開発者（コントリビューター）

開発に参加したい：

1. **@08-development/local-development.md** - ローカル環境セットアップ
2. **@08-development/environment-setup.md** - 環境変数設定
3. **@08-development/development-guide.md** - ブランチ戦略・コーディング規約
4. **@03-core-concepts/error-handling.md** - エラーハンドリングパターン

### デプロイ・運用担当者

本番環境を管理したい：

1. **@07-deployment/deployment.md** - デプロイ手順
2. **@07-deployment/ci-cd-guide.md** - CI/CDパイプライン
3. **@07-deployment/supabase-deployment-guide.md** - Supabase設定

---

## ロール別ガイド

### バックエンド開発者

**必読ドキュメント:**
1. @02-architecture/backend-architecture.md - FastAPI構造、サービスパターン
2. @04-data/data-model.md - DBスキーマ、リレーション
3. @06-interfaces/api-reference.md - APIエンドポイント仕様
4. @03-core-concepts/error-handling.md - エラーハンドリング

**典型的なフロー:**
```bash
# 1. ローカル環境起動
./scripts/dev.sh

# 2. バックエンドのみ再起動
./scripts/dev-backend.sh

# 3. テスト実行
cd backend && uv run pytest
```

### フロントエンド開発者

**必読ドキュメント:**
1. @02-architecture/frontend-architecture.md - Vue 3構造、Pinia状態管理
2. @06-interfaces/api-reference.md - 利用するAPI仕様
3. @03-core-concepts/code-readability-guide.md - コード品質基準

**典型的なフロー:**
```bash
# 1. ローカル環境起動
./scripts/dev.sh

# 2. フロントエンドのみ再起動
./scripts/dev-frontend.sh

# 3. テスト実行
cd frontend && npm run test
```

### テスター

**必読ドキュメント:**
1. @09-testing/e2e-test-guide.md - E2Eテストガイド
2. @09-testing/test-cases/ - テストケース定義

---

## トピック別インデックス

### 設計・原則

- **設計原則**: @03-core-concepts/design-principles.md
- **エラーハンドリング**: @03-core-concepts/error-handling.md
- **コード品質**: @03-core-concepts/code-readability-guide.md
- **アーキテクチャ決定**: @10-decisions/ (ADR)
- **用語集**: @appendix/glossary.md

### データ

- **データモデル**: @04-data/data-model.md
- **スキーマ定義**: @04-data/data-model.md

### 機能設計

- **統計情報共有**: @05-features/sharing-feature-design.md
- **OBSオーバーレイ**: @05-features/obs-overlay-design.md
- **画面録画分析**: @05-features/screen-recording-analysis.md
- **管理者画面**: @05-features/admin-panel-design.md
- **デッキアーカイブマージ**: @05-features/archive-deck-merge-design.md
- **初手カード分析**: @05-features/opening-hand-analysis-design.md (未実装)
- **フィードバック機能**: @05-features/feedback-and-contact.md (未実装)
- **多言語対応**: @05-features/internationalization.md (未実装)
- **モバイル対応**: @05-features/mobile-support.md (未実装)

### インターフェース

- **API仕様**: @06-interfaces/api-reference.md

### デプロイ・運用

- **デプロイ手順**: @07-deployment/deployment.md
- **CI/CD**: @07-deployment/ci-cd-guide.md
- **Supabase設定**: @07-deployment/supabase-deployment-guide.md
- **OAuth設定**: @07-deployment/supabase-oauth-setup.md
- **通知設定**: @07-deployment/notification-settings.md

### 開発

- **ローカル開発**: @08-development/local-development.md
- **環境変数設定**: @08-development/environment-setup.md
- **開発ガイド**: @08-development/development-guide.md
- **チュートリアル**: @08-development/development-tutorial.md

### テスト

- **E2Eテストガイド**: @09-testing/e2e-test-guide.md
- **テストケース**: @09-testing/test-cases/

### 運用

- **バグ管理**: @operations/bug-tracking-setup.md
- **引継ぎガイド**: @operations/handover-guide.md
- **引継ぎチェックリスト**: @operations/handover-checklist.md

---

## よくある質問への直リンク

| 質問 | ドキュメント |
|------|-------------|
| プロジェクトの概要は？ | @01-introduction/overview.md |
| ローカル開発環境のセットアップは？ | @08-development/local-development.md |
| APIエンドポイント一覧は？ | @06-interfaces/api-reference.md |
| DBスキーマは？ | @04-data/data-model.md |
| デプロイ手順は？ | @07-deployment/deployment.md |
| CI/CDの設定は？ | @07-deployment/ci-cd-guide.md |
| エラーハンドリングのパターンは？ | @03-core-concepts/error-handling.md |
| テストの実行方法は？ | @09-testing/e2e-test-guide.md |
| 技術選択の理由は？ | @10-decisions/ |

---

## 機能実装状況

設計ドキュメントに対する実装状況の一覧です。

| 機能 | 設計ドキュメント | 実装状況 |
|------|-----------------|---------|
| デッキアーカイブマージ | @05-features/archive-deck-merge-design.md | ✅ 完全実装 |
| 管理者画面 | @05-features/admin-panel-design.md | ⚠️ 部分実装 |
| 画面録画分析 | @05-features/screen-recording-analysis.md | ⚠️ 部分実装 |
| 統計情報共有 | @05-features/sharing-feature-design.md | ✅ 完全実装 |
| OBSオーバーレイ | @05-features/obs-overlay-design.md | ✅ 完全実装 |
| 初手カード勝率分析 | @05-features/opening-hand-analysis-design.md | ❌ 未実装 |
| フィードバック機能 | @05-features/feedback-and-contact.md | ❌ 未実装 |
| 多言語対応（i18n） | @05-features/internationalization.md | ❌ 未実装 |
| モバイル対応 | @05-features/mobile-support.md | ❌ 未実装 |

---

## ドキュメント凡例

### アイコン

- 🎯 **重要**: 必ず理解すべき概念
- 💡 **ヒント**: 役立つ情報
- ⚠️ **注意**: よくある間違い・注意点
- 🔗 **参照**: 関連ドキュメント

### 相対パス表記

ドキュメント内では `@` で始まる相対パスで他ドキュメントを参照：
- `@02-architecture/backend-architecture.md` - docsルートからの相対パス
- `@../README.md` - プロジェクトルートのREADME

---

## 貢献

ドキュメントの改善提案は大歓迎です：
- GitHub Issuesで報告してください
- @../README.md - プロジェクト概要

---

## バージョン履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 2.0 | 2026-01-20 | C4モデル + arc42に基づく構造化 |
| 1.0 | 2025-01 | 初版 |

---

**次に読むべきドキュメント**: @01-introduction/overview.md
