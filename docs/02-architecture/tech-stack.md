---
depends_on: []
tags: [architecture, technology]
ai_summary: "技術スタックの一覧と選定理由"
---

# 技術スタック

> Status: Active
> 最終更新: 2026-01-23

Duel Log Appで使用する技術とその選定理由を記載する。

---

## 技術一覧

| カテゴリ | 技術 | 役割 |
|---------|------|------|
| **フロントエンド** | | |
| Framework | React | UI構築 |
| Build | Vite | ビルドツール |
| UI | shadcn/ui + Tailwind CSS | コンポーネントライブラリ |
| Routing | TanStack Router | 型安全ルーティング |
| Server State | TanStack Query | API状態管理・キャッシュ |
| Client State | Zustand | グローバル状態管理 |
| Forms | React Hook Form + Zod | フォームバリデーション |
| Charts | Recharts | 統計グラフ描画 |
| i18n | react-i18next | 多言語対応（ja, en, ko） |
| **バックエンド** | | |
| Framework | Hono | 軽量Webフレームワーク |
| Runtime | Vercel Functions | サーバーレス実行環境 |
| ORM | Drizzle ORM | 型安全ORM |
| Validation | Zod | スキーマバリデーション |
| OpenAPI | @hono/zod-openapi | API仕様生成 |
| **インフラ** | | |
| Hosting | Vercel | フロントエンド + API |
| Database | Supabase PostgreSQL | データベース |
| Auth | Supabase Auth | 認証（OAuth: Google, Discord） |
| **テスト** | | |
| Unit/Integration | Vitest | テストフレームワーク |
| Component | Testing Library | コンポーネントテスト |
| E2E | Playwright | エンドツーエンドテスト |
| **開発ツール** | | |
| Monorepo | pnpm workspaces | パッケージ管理 |
| Linter/Formatter | Biome | Lint + Format統合 |
| Type Check | TypeScript (strict) | 型安全 |

---

## 選定理由（サマリ）

| 技術 | 選定理由 | ADR |
|------|---------|-----|
| Supabase | 課金済み基盤活用、PostgreSQL、RLS、ローカル開発対応 | [ADR-0001](../04-decisions/0001-supabase-auth.md) |
| Hono | Edge対応、軽量、FastAPI似の書き心地 | [ADR-0002](../04-decisions/0002-hono-backend.md) |
| React | AI支援品質最高、エコシステム最大 | [ADR-0003](../04-decisions/0003-react-frontend.md) |
| Vercel Full-Stack | 同一ドメイン、CORS不要、単一デプロイ | [ADR-0004](../04-decisions/0004-vercel-fullstack.md) |

---

## 旧アーキテクチャとの比較

| 項目 | 旧構成 | 新構成 |
|------|--------|--------|
| フロントエンド | Vue 3 + Vuetify 3 + Pinia | React + shadcn/ui + Zustand |
| バックエンド | Python/FastAPI on Render | Hono/TypeScript on Vercel |
| サービス数 | 3（Vercel + Render + Supabase） | 2（Vercel + Supabase） |
| CORS | 必要（別ドメイン） | 不要（同一ドメイン） |
| コールドスタート | 15分スリープ（Render無料枠） | なし（Vercel Edge） |
| 型共有 | 独立定義 | Zodスキーマで統一 |

---

## 関連ドキュメント

- [context.md](./context.md) - システム境界
- [structure.md](./structure.md) - コンポーネント構成
- [0004-vercel-fullstack.md](../04-decisions/0004-vercel-fullstack.md) - アーキテクチャ再設計ADR
