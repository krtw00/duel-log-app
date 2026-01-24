---
depends_on: []
tags: [adr, backend, hono]
ai_summary: "Honoフレームワーク採用の決定記録"
---

# ADR 0002: Hono/TypeScriptをバックエンドとして採用

> Status: Active
> 最終更新: 2026-01-23

## ステータス

**採用済み** (2025-01)

## コンテキスト

Duel Log Appのバックエンドフレームワークを選定する必要がある。

### 要件

- RESTful APIの構築
- Edge Runtime対応
- TypeScriptネイティブ
- 軽量かつ高速
- OpenAPI仕様の自動生成

### 検討した選択肢

1. **Hono** - Edge対応の軽量Webフレームワーク
2. **Express** - Node.jsの定番フレームワーク
3. **tRPC** - 型安全なRPCフレームワーク

## 決定

**Hono on Vercel Functions + Drizzle ORM + Zod**を採用する。

## 理由

### Honoの利点

| 観点 | Hono |
|------|------|
| **Edge対応** | Vercel Edge Functions、Cloudflare Workers等で動作 |
| **軽量** | ゼロ依存、高速なルーティング |
| **OpenAPI** | Zod OpenAPIによるスキーマ自動生成 |
| **TypeScript** | ファーストクラスのTypeScriptサポート |
| **統一言語** | フロントエンドとバックエンドでTypeScript統一 |

### 他の選択肢を選ばなかった理由

| フレームワーク | 見送り理由 |
|--------------|-----------|
| Express | Edge対応が限定的、レガシーなAPI設計 |
| tRPC | REST APIが必要（外部連携、OpenAPI公開） |

## 結果

### メリット

- Edge Runtimeによる低レイテンシ
- Drizzle ORMで型安全なDB操作
- ZodスキーマからOpenAPI仕様を自動生成
- フロントエンドと型定義を共有可能

### デメリット

- Expressほどエコシステムが成熟していない
- Edge Runtime固有の制約（Node.js APIの一部が使用不可）

## 関連ドキュメント

- [バックエンド構成](../02-architecture/structure.md)
- [API仕様](../03-details/api.md)
- [Supabase認証](./0001-supabase-auth.md)

## 参考リンク

- [Hono公式ドキュメント](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Zod](https://zod.dev/)
