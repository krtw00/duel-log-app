# Duel Log App

遊戯王マスターデュエルの対戦履歴を記録・分析するWebアプリケーション。

## Core Value

1. **対戦履歴の可視化** - 勝敗、デッキ、対戦相手を統計情報として可視化
2. **デッキ分析** - デッキごとの勝率、相性表、トレンド分析
3. **配信者サポート** - 配信者ポップアップ、配信者モード（プライバシー保護）
4. **データポータビリティ** - CSVインポート/エクスポート、統計情報共有URL

## 技術スタック

@docs/02-architecture/tech-stack.md を参照。

## 設計原則

1. **User-Centric Simplicity** - シンプルな操作で完結
2. **Privacy First** - 配信者のプライバシーを最優先
3. **Layered Architecture** - Routes → Service → DB の責務分離
4. **Type Safety** - TypeScript + Zodで型安全を確保
5. **Single Source of Truth** - サーバーがSSoT、TanStack Queryでキャッシュ
6. **Progressive Enhancement** - 基本機能を優先、高度な機能は段階的に追加

## データモデル

@docs/03-details/data-model.md を参照。

## 開発環境

Docker不使用。`pnpm dev|build|test|lint|typecheck` + `npx supabase start`

- アプリ: `http://localhost:5173`
- Supabase Studio: `http://127.0.0.1:54323`

## Git運用ルール（必須）

**mainへの直接push禁止。** 詳細は @docs/07-development/contributing.md を参照。

## テストユーザー

seedスクリプトで作成（パスワード: `password123`）:

| ユーザー | メール | 管理者 | デバッガー |
|---------|--------|:------:|:---------:|
| testuser | test@example.com | ✅ | ✅ |
| admin | admin@example.com | ✅ | - |
| debugger | debugger@example.com | - | ✅ |

## デプロイ

@docs/06-deployment/vercel.md を参照。

## 詳細ドキュメント

@docs/00-index.md を参照。

## ツール・MCP使用ガイド

### 利用可能リソース
- **Plugins**: Supabase（DB・認証）, Serena（コード構造）
- **MCP**: Render（デプロイ状況・ログ）
- **Commands**: `/code`, `/lint`, `/migrate`, `/test`

### シナリオ別ルール
- DBスキーマ変更 → Supabaseプラグイン or `/migrate`
- テスト → `/test` or `pnpm test`
- リント → `/lint`（Biome）
- デプロイ確認 → Render MCP or `/deploy`スキル
- モノレポ構造理解 → Serena
