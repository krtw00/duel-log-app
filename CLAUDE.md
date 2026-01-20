# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Duel Log Appは、トレーディングカードゲーム（TCG）の対戦履歴を記録・分析するWebアプリケーションです。

### Core Value

1. **対戦履歴の可視化** - 勝敗、デッキ、対戦相手を記録し、統計情報として可視化
2. **デッキ分析** - デッキごとの勝率、相性表、トレンド分析
3. **配信者サポート** - OBSオーバーレイ、配信者モード（プライバシー保護）
4. **データポータビリティ** - CSVインポート/エクスポート、統計情報共有URL

```
┌─────────────────────────────────────────────────────────────────┐
│  Duel Log App                                                   │
│                                                                 │
│  ユーザー ───→ 対戦記録 ───→ 統計分析 ───→ 勝率向上           │
│                                                                 │
│  配信者 ─────→ OBSオーバーレイ ───→ 視聴者への情報提供         │
└─────────────────────────────────────────────────────────────────┘
```

## 技術スタック

- **バックエンド:** Python 3.11+, FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic
- **フロントエンド:** TypeScript, Vue 3 (Composition API), Vuetify 3, Pinia, Vite
- **データベース/認証:** Supabase (ローカル開発はSupabase CLI、本番はSupabase Cloud)
- **テスト:** バックエンド: Pytest | フロントエンド: Vitest
- **リンター/フォーマッター:** バックエンド: Ruff, Black | フロントエンド: ESLint, Prettier

## 重要な設計原則

1. **User-Centric Simplicity**: シンプルな操作で対戦記録・分析を完結
2. **Privacy First**: 配信者のプライバシーを最優先で保護
3. **Layered Architecture**: Router → Service → Modelの責務分離
4. **Type Safety**: TypeScript/Pythonで型安全を確保
5. **Single Source of Truth**: データの真実はDBのみ
6. **Progressive Enhancement**: 基本機能を優先、拡張機能は段階的に追加

## データ管理

| データ | テーブル | 説明 |
|--------|----------|------|
| ユーザー | `users` | 認証・プロフィール情報 |
| デッキ | `decks` | ユーザーデッキ + 相手デッキ（`is_opponent`で区別） |
| 対戦記録 | `duels` | 勝敗、ターン順、ゲームモード等 |
| 統計共有 | `shared_statistics` | 統計共有設定・トークン |

```
User 1→N Deck (user_id)
User 1→N Duel (user_id)
Duel N→1 Deck (deck_id: プレイヤーデッキ)
Duel N→1 Deck (opponent_deck_id: 相手デッキ)
```

## 開発サーバー起動（重要）

**必ずスクリプトを使用すること。直接 `python start.py` 等を実行しない。**

```bash
cd ~/work/duel-log-app
./scripts/dev-stop.sh    # 既存のサービスを停止（安全のため）
./scripts/dev.sh         # 全サービスを一括起動（Supabase + Backend + Frontend）
```

**起動後のURL:**
| サービス | URL |
|---------|-----|
| フロントエンド | http://localhost:5173 |
| バックエンドAPI | http://127.0.0.1:8000 |
| Supabase Studio | http://127.0.0.1:55323 |

**Supabase状態確認:** `npx supabase status`

## デプロイ

- **フロントエンド:** Vercel
- **バックエンド:** Render (Docker)
- **データベース:** Supabase Cloud または Neon (PostgreSQL)
- **認証:** Supabase Auth
- **CI/CD:** GitHub Actions

## 詳細ドキュメント

- @docs/00-INDEX.md - **ドキュメント全体ナビゲーション**
- @docs/01-introduction/overview.md - プロジェクト概要
- @docs/02-architecture/ - システムアーキテクチャ
- @docs/03-core-concepts/design-principles.md - 設計原則詳細
- @docs/10-decisions/ - アーキテクチャ決定記録（ADR）

詳細なガイドは `.claude/rules/` を参照:
- `backend.md` - バックエンド開発、アーキテクチャ、環境変数
- `frontend.md` - フロントエンド開発、アーキテクチャ
- `git-workflow.md` - ブランチ戦略、コミット規約
- `database.md` - スキーマ、マイグレーション、トラブルシューティング
- `tools.md` - 利用可能なツール一覧、使い分け
