---
depends_on: []
tags: [adr, deployment, vercel]
ai_summary: "Vercelフルスタック構成の決定記録"
---

# ADR 0004: Vercel Full-Stack + Supabase構成を採用

> Status: Active
> 最終更新: 2026-01-23

## ステータス

**採用済み** (2025-01)

## コンテキスト

Duel Log Appのデプロイメント構成を見直す必要がある。フロントエンドとバックエンドを別々にデプロイする構成から、統合的な構成への移行を検討する。

### 要件

- シンプルなデプロイメント
- 同一ドメインでのAPI提供（CORS不要）
- コールドスタートの解消
- フロントエンドとバックエンドでの型共有
- 既存URLの維持

### 検討した選択肢

1. **Vercel Full-Stack + Supabase** - 単一プラットフォームに統合
2. **現状維持（分離構成）** - フロントエンドとバックエンドを別々にデプロイ
3. **Cloudflare Pages + Workers** - Cloudflareエコシステムに移行

## 決定

**Vercel Full-Stack + Supabase構成**を採用する。

## 理由

### Vercel Full-Stack構成の利点

| 観点 | Vercel Full-Stack |
|------|-------------------|
| **シンプル化** | 単一リポジトリ、単一デプロイで完結 |
| **CORS不要** | 同一ドメインでフロントエンドとAPIを提供 |
| **コールドスタート** | Vercel Functionsの最適化で解消 |
| **型共有** | pnpm workspacesでフロントエンド・バックエンド間の型共有 |
| **プレビュー** | PRごとにプレビュー環境が自動生成 |

### 他の選択肢を選ばなかった理由

| 構成 | 見送り理由 |
|------|-----------|
| 現状維持（分離構成） | 運用複雑性の解消不可、CORS設定の煩雑さ |
| Cloudflare Pages + Workers | 既存URL維持が困難、移行コスト高 |

## 結果

### メリット

- デプロイが`git push`のみで完結
- 同一ドメインによるCookie認証の簡素化
- モノレポによる型安全な開発体験

### デメリット

- Vercelプラットフォームへの依存
- Vercel Functionsの実行時間制限（10秒〜60秒）

## 関連ドキュメント

- [システム概要](../02-architecture/context.md)
- [Supabase認証](./0001-supabase-auth.md)
- [Honoバックエンド](./0002-hono-backend.md)
- [Supabaseデプロイメント](../06-deployment/supabase.md)

## 参考リンク

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Vercel Functions](https://vercel.com/docs/functions)
- [pnpm Workspaces](https://pnpm.io/workspaces)
