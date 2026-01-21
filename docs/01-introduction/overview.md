# Duel Log App 概要

**TCG対戦履歴記録・分析アプリケーション**

## Core Value

| 価値 | 説明 |
|------|------|
| 対戦履歴の可視化 | 勝敗、デッキ、対戦相手を統計情報として可視化 |
| デッキ分析 | デッキごとの勝率、相性表、トレンド分析 |
| 配信者サポート | OBSオーバーレイ、配信者モード（プライバシー保護） |
| データポータビリティ | CSVインポート/エクスポート、統計情報共有URL |

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| バックエンド | Python 3.11+ / FastAPI / SQLAlchemy 2.0 / Alembic |
| フロントエンド | TypeScript / Vue 3 / Vuetify 3 / Pinia / Vite |
| データベース | PostgreSQL (Supabase) |
| 認証 | Supabase Auth (OAuth: Google, Discord, GitHub) |
| ホスティング | Vercel (Frontend) / Render (Backend) |
| CI/CD | GitHub Actions |

---

## 主要機能

### 実装済み

| 機能 | 説明 |
|------|------|
| 対戦記録 | 勝敗、デッキ、対戦相手、ゲームモード、ターン順を記録 |
| デッキ管理 | 自分のデッキと対戦相手のデッキを管理 |
| 統計情報 | 勝率、先攻/後攻勝率、コイントス勝率、期間別統計 |
| デッキ相性表 | デッキ間の勝率マトリックス |
| 配信者ポップアップ | 配信用のリアルタイム統計表示 |
| 統計共有 | URLベースの統計情報公開 |
| 配信者モード | プライバシー保護（個人情報マスク） |

### 計画中

| 機能 | 設計ドキュメント |
|------|-----------------|
| 初手カード勝率分析 | @../05-features/opening-hand-analysis-design.md |
| フィードバック機能 | @../05-features/feedback-and-contact.md |
| 多言語対応 | @../05-features/internationalization.md |

---

## クイックスタート

```bash
git clone https://github.com/krtw00/duel-log-app.git
cd duel-log-app
./scripts/dev.sh
```

| サービス | URL |
|---------|-----|
| フロントエンド | http://localhost:5173 |
| バックエンドAPI | http://127.0.0.1:8000 |
| Supabase Studio | http://127.0.0.1:55323 |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| @../02-architecture/backend-architecture.md | バックエンド詳細 |
| @../02-architecture/frontend-architecture.md | フロントエンド詳細 |
| @../04-data/data-model.md | データベーススキーマ |
| @../08-development/local-development.md | 開発環境セットアップ |
