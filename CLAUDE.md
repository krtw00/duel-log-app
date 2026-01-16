# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Duel Log Appは、トレーディングカードゲーム（TCG）の対戦履歴を記録・分析するWebアプリケーションです。詳細な統計情報、デッキ管理、相性分析、配信者向けのOBSオーバーレイ機能を提供します。

**技術スタック:**
- **バックエンド:** Python 3.11+, FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic
- **フロントエンド:** TypeScript, Vue 3 (Composition API), Vuetify 3, Pinia, Vite
- **データベース/認証:** Supabase (ローカル開発はSupabase CLI、本番はSupabase Cloud)
- **テスト:** バックエンド: Pytest | フロントエンド: Vitest
- **リンター/フォーマッター:** バックエンド: Ruff, Black | フロントエンド: ESLint, Prettier

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

詳細なガイドは `.claude/rules/` を参照:
- `backend.md` - バックエンド開発、アーキテクチャ、環境変数
- `frontend.md` - フロントエンド開発、アーキテクチャ
- `git-workflow.md` - ブランチ戦略、コミット規約
- `database.md` - スキーマ、マイグレーション、トラブルシューティング
- `tools.md` - 利用可能なツール一覧、使い分け

その他のドキュメント:
- `docs/development-guide.md` - コーディング規約とワークフロー
- `docs/deployment.md` - デプロイ手順
- `docs/api-reference.md` - APIエンドポイント
- `docs/db-schema.md` - データベーススキーマ詳細
