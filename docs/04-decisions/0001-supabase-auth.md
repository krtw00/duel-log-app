---
depends_on: []
tags: [adr, auth, supabase]
ai_summary: "Supabase Auth採用の決定記録"
---

# ADR 0001: Supabaseを認証・データベースサービスとして採用

> Status: Active
> 最終更新: 2026-01-23

## ステータス

**採用済み** (2024-01)

## コンテキスト

Duel Log Appの認証基盤とデータベースホスティングを選定する必要がある。

### 要件

- ユーザー認証（メール、OAuth）
- PostgreSQLデータベース
- ローカル開発環境のサポート
- 無料枠または低コスト
- スケーラビリティ

### 検討した選択肢

1. **Supabase** - オープンソースのFirebase代替
2. **Firebase** - Googleのフルスタックプラットフォーム
3. **Auth0 + 自前DB** - 認証特化サービス + 別途DB
4. **自前実装** - JWT認証を自前で実装

## 決定

**Supabase**を採用する。

## 理由

### Supabaseの利点

| 観点 | Supabase |
|------|----------|
| **既存資産** | 複数プロジェクトで課金済み、DB一元管理が可能 |
| **データベース** | PostgreSQL（リレーショナルDB） |
| **認証** | メール、OAuth（Google, Discord）対応 |
| **ローカル開発** | Supabase CLI + Dockerで完全ローカル環境 |
| **セキュリティ** | RLS（Row Level Security）標準装備 |
| **オープンソース** | セルフホスト可能 |

### 他の選択肢を選ばなかった理由

| サービス | 見送り理由 |
|---------|-----------|
| Firebase | NoSQL（Firestore）で複雑なクエリが困難 |
| Auth0 + 自前DB | コスト高、インフラ管理の負担 |
| 自前実装 | セキュリティリスク、開発コスト |

## 結果

### メリット

- 複数プロジェクトのDB一元管理（課金済みインフラの活用）
- PostgreSQLの柔軟なクエリ（統計計算、相性表など）
- OAuth設定がダッシュボードで完結
- Supabase CLIでローカル環境が本番と同一

### デメリット

- Supabaseに依存（ベンダーロックイン）
- 課金プラン維持が前提（複数プロジェクト共用で償却）

## 関連ドキュメント

- [認証フロー](../03-details/flows.md)
- [Supabaseデプロイメント](../06-deployment/supabase.md)
- [バックエンド構成](../02-architecture/structure.md)

## 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase CLI](https://supabase.com/docs/reference/cli)
