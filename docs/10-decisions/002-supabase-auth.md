# ADR 002: Supabaseを認証・データベースサービスとして採用

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
| **データベース** | PostgreSQL（リレーショナルDB） |
| **認証** | メール、OAuth（Google, Discord, GitHub）対応 |
| **ローカル開発** | Supabase CLI + Dockerで完全ローカル環境 |
| **コスト** | 無料枠が充実（500MB DB、50K MAU） |
| **オープンソース** | セルフホスト可能 |

### 他の選択肢を選ばなかった理由

| サービス | 見送り理由 |
|---------|-----------|
| Firebase | NoSQL（Firestore）で複雑なクエリが困難 |
| Auth0 + 自前DB | コスト高、インフラ管理の負担 |
| 自前実装 | セキュリティリスク、開発コスト |

## 結果

### メリット

- PostgreSQLの柔軟なクエリ（統計計算、相性表など）
- OAuth設定がダッシュボードで完結
- Supabase CLIでローカル環境が本番と同一

### デメリット

- Supabaseに依存（ベンダーロックイン）
- 無料枠を超えると有料プランが必要

### 運用上の注意

- ローカル開発では`npx supabase`を使用
- 本番環境: 認証はSupabase Auth、DBはSupabase CloudまたはNeon PostgreSQL
  - DBホスティングは認証とは独立して選択可能

## JWT認証フロー

```
┌─────────────────────────────────────────────────────────────────┐
│  認証フロー                                                     │
│                                                                 │
│  1. ユーザーがログイン                                          │
│     ↓                                                           │
│  2. Supabase Authがユーザー検証                                 │
│     ↓                                                           │
│  3. JWTトークン発行（access_token, refresh_token）              │
│     ↓                                                           │
│  4. フロントエンドがトークンを保存                              │
│     - HttpOnly Cookie（通常ブラウザ用）                         │
│     - メモリ（Safari ITP対策用）                                │
│     ↓                                                           │
│  5. バックエンドがJWT検証                                       │
│     - 優先: Authorization header (Bearer token)                 │
│       → Safari ITP、モバイルアプリ対応                          │
│     - フォールバック: HttpOnly Cookie                           │
│       → 通常ブラウザセッション用                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### トークン取得の優先順位（実装詳細）

1. **Authorizationヘッダー** (`Bearer <token>`)
   - Safari ITP (Intelligent Tracking Prevention) 対策
   - モバイルアプリやSPAからの明示的な認証
2. **Cookie** (`access_token`)
   - 通常のブラウザセッション認証
   - HttpOnly、SameSite=Lax で XSS/CSRF 対策

## 関連ドキュメント

- @../07-deployment/supabase-deployment-guide.md
- @../07-deployment/supabase-oauth-setup.md
- @../02-architecture/backend-architecture.md

## 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase CLI](https://supabase.com/docs/reference/cli)
