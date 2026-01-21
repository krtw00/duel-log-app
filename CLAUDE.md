# Duel Log App

TCG対戦履歴を記録・分析するWebアプリケーション。

## Core Value

1. **対戦履歴の可視化** - 勝敗、デッキ、対戦相手を統計情報として可視化
2. **デッキ分析** - デッキごとの勝率、相性表、トレンド分析
3. **配信者サポート** - OBSオーバーレイ、配信者モード（プライバシー保護）
4. **データポータビリティ** - CSVインポート/エクスポート、統計情報共有URL

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| バックエンド | Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic |
| フロントエンド | TypeScript, Vue 3 (Composition API), Vuetify 3, Pinia, Vite |
| データベース | PostgreSQL (Supabase) |
| 認証 | Supabase Auth |
| テスト | Pytest, Vitest |
| リンター | Ruff, Black, ESLint, Prettier |

## 設計原則

1. **User-Centric Simplicity** - シンプルな操作で完結
2. **Privacy First** - 配信者のプライバシーを最優先
3. **Layered Architecture** - Router → Service → Modelの責務分離
4. **Type Safety** - TypeScript/Pythonで型安全を確保
5. **Single Source of Truth** - データの真実はDBのみ

## データモデル

```
User 1→N Deck (user_id)
User 1→N Duel (user_id)
Duel N→1 Deck (deck_id: プレイヤーデッキ)
Duel N→1 Deck (opponent_deck_id: 相手デッキ)
```

主要テーブル: `users`, `decks`, `duels`, `shared_statistics`

## 開発サーバー

```bash
./scripts/dev.sh         # 全サービス起動
./scripts/dev-stop.sh    # 全停止
```

| サービス | URL |
|---------|-----|
| フロントエンド | http://localhost:5173 |
| バックエンドAPI | http://127.0.0.1:8000 |
| Supabase Studio | http://127.0.0.1:55323 |

## デプロイ

- **フロントエンド:** Vercel
- **バックエンド:** Render (Docker)
- **データベース:** Supabase Cloud / Neon

## 詳細ドキュメント

`.claude/rules/`ディレクトリを参照:
- `backend.md` - バックエンド開発
- `frontend.md` - フロントエンド開発
- `database.md` - スキーマ、マイグレーション
- `git-workflow.md` - ブランチ戦略、コミット規約
