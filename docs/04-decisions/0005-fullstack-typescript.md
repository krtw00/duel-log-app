---
depends_on: [./0002-hono-backend.md, ./0003-react-frontend.md, ./0004-vercel-fullstack.md]
tags: [adr, migration, typescript]
ai_summary: "Python/Vue構成からTypeScript統一構成への全面移行の決定記録"
---

# ADR 0005: Full-Stack TypeScript統一

> Status: Active
> 最終更新: 2026-01-23

## ステータス

**採用済み** (2025-01)

## コンテキスト

Duel Log Appは当初 Python/FastAPI（バックエンド）+ Vue 3/Vuetify（フロントエンド）で構築された。運用を通じて以下の課題が顕在化した。

### 課題

| 課題 | 影響 |
|------|------|
| 言語分断 | フロントとバックで型定義が独立し二重管理が発生 |
| コールドスタート | Render無料枠の15分スリープで初回アクセスが遅延 |
| CORS管理 | 別ドメイン構成によるCORS設定の煩雑さ |
| デプロイ複雑性 | 3サービス（Vercel + Render + Supabase）の個別管理 |
| AI支援品質 | Vue/Pythonよりも React/TypeScript の方がAI生成コード品質が高い |

### 検討した選択肢

1. **Full-Stack TypeScript（React + Hono）** - 言語統一、モノレポ構成
2. **Vue 3 + Hono** - バックエンドのみTypeScript化
3. **現状維持（Vue + Python）** - 既存コードを改修

## 決定

**選択肢1: Full-Stack TypeScript** を採用する。

フロントエンドをReact + shadcn/ui、バックエンドをHono + Drizzle ORMに全面リプレースする。

## 根拠

| 観点 | 判断 |
|------|------|
| 型安全 | Zodスキーマを単一パッケージで定義し、フロント・バックで共有 |
| 開発効率 | 同一言語でフルスタック開発、コンテキスト切替コストなし |
| デプロイ | Vercel単一ドメインに統合（ADR-0004と整合） |
| AI支援 | React/TypeScriptエコシステムのAI支援が最も成熟 |
| 人材 | TypeScript一本化により学習コストを集約 |

## 影響

### 移行対象

| 旧 | 新 |
|----|-----|
| Python / FastAPI | Hono / TypeScript |
| Vue 3 / Vuetify 3 | React / shadcn/ui |
| Pinia | Zustand |
| vue-router | TanStack Router |
| SQLAlchemy | Drizzle ORM |
| ESLint + Prettier | Biome |
| Render | Vercel Functions |

### リスクと対策

| リスク | 対策 |
|--------|------|
| UI再現精度 | 既存画面を参考にshadcn/ui + Tailwindでカスタマイズ |
| データ移行 | ステージング環境で検証後に本番移行 |
| 移行期間中のサービス停止 | 旧環境を並行維持、新環境完成後に切替 |

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [ADR-0002](./0002-hono-backend.md) | Honoバックエンド採用 |
| [ADR-0003](./0003-react-frontend.md) | Reactフロントエンド採用 |
| [ADR-0004](./0004-vercel-fullstack.md) | Vercelフルスタック構成 |
| [技術スタック](../02-architecture/tech-stack.md) | 技術一覧 |
