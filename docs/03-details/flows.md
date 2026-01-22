---
depends_on: []
tags: [details, sequence, auth]
ai_summary: "認証・データ取得・リアルタイム更新の主要フロー"
---

# 主要フロー

> Status: Active
> 最終更新: 2026-01-23

Duel Log Appの主要な処理フロー（認証、データ取得、リアルタイム更新）を定義する。

---

## 認証フロー

### OAuth認証シーケンス

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant SPA as React SPA
    participant Supabase as Supabase Auth
    participant Provider as OAuth Provider
    participant API as Hono API
    participant DB as PostgreSQL

    User->>SPA: ログインボタンクリック
    SPA->>Supabase: signInWithOAuth()
    Supabase->>Provider: OAuth認証リクエスト
    Provider->>User: 認証画面表示
    User->>Provider: 認証情報入力
    Provider->>Supabase: 認証成功 + ユーザー情報
    Supabase->>SPA: JWT + セッション
    SPA->>SPA: Zustandに認証状態保存

    Note over SPA,API: 以降のAPI呼び出し

    SPA->>API: API リクエスト (Bearer Token)
    API->>Supabase: JWT検証
    Supabase->>API: ユーザー情報
    API->>DB: JIT Provisioning（初回のみ）
    DB->>API: ユーザーレコード
    API->>SPA: レスポンス
```

### JIT (Just-In-Time) Provisioning

Supabase Authで認証後、初回API呼び出し時にユーザーをDBに自動作成する。

| ステップ | 処理 |
|---------|------|
| 1 | JWT検証（Supabase Auth） |
| 2 | usersテーブルでユーザーを検索 |
| 3a | 存在する場合 → そのまま続行 |
| 3b | 存在しない場合 → INSERT実行 |
| 4 | コンテキストにユーザー情報を設定 |

---

## データ取得フロー

### TanStack Query によるデータフェッチ

```mermaid
sequenceDiagram
    participant Component as Reactコンポーネント
    participant Hook as useDuels()
    participant QueryClient as TanStack Query
    participant Cache as キャッシュ
    participant API as Hono API
    participant DB as PostgreSQL

    Component->>Hook: useDuels(filters)
    Hook->>QueryClient: useQuery()

    alt キャッシュヒット（staleTime内）
        QueryClient->>Cache: 取得
        Cache->>QueryClient: キャッシュデータ
        QueryClient->>Component: 即座にデータ返却
    else キャッシュミス or stale
        QueryClient->>API: GET /api/duels
        API->>DB: SELECT
        DB->>API: データ
        API->>QueryClient: レスポンス
        QueryClient->>Cache: キャッシュ更新
        QueryClient->>Component: データ返却
    end
```

### データ更新フロー（Optimistic Update）

```mermaid
sequenceDiagram
    participant Component as Reactコンポーネント
    participant Mutation as useMutation
    participant QueryClient as TanStack Query
    participant API as Hono API

    Component->>Mutation: createDuel(data)

    Note over Mutation,QueryClient: Optimistic Update
    Mutation->>QueryClient: onMutate（楽観的にキャッシュ更新）

    Mutation->>API: POST /api/duels
    API->>Mutation: 201 Created

    alt 成功時
        Mutation->>QueryClient: onSuccess → invalidateQueries
    else 失敗時
        Mutation->>QueryClient: onError → キャッシュをロールバック
    end
```

---

## リアルタイム更新（配信者ポップアップ）

### BroadcastChannel によるタブ間通信

```mermaid
sequenceDiagram
    participant Dashboard as ダッシュボード
    participant Channel as BroadcastChannel
    participant Popup as 配信者ポップアップ

    Dashboard->>Dashboard: 対戦結果を記録
    Dashboard->>Channel: postMessage({ type: 'DUEL_CREATED' })
    Channel->>Popup: メッセージ受信
    Popup->>Popup: invalidateQueries(['statistics'])
    Popup->>Popup: UIを更新
```

### 通信パターン

| イベント | 送信元 | 処理内容 |
|---------|-------|---------|
| DUEL_CREATED | ダッシュボード | デュエル・統計キャッシュを無効化 |
| DUEL_UPDATED | ダッシュボード | デュエル・統計キャッシュを無効化 |
| DUEL_DELETED | ダッシュボード | デュエル・統計キャッシュを無効化 |

---

## 認可モデル

### ロールベースアクセス制御

| ロール | 権限 |
|--------|------|
| user | 自分のデータのみCRUD |
| admin | 全ユーザーデータ閲覧、ステータス変更 |
| debugger | デバッグ機能へのアクセス |

### Row Level Security (RLS)

| テーブル | 操作 | ポリシー |
|---------|------|---------|
| duels | SELECT/INSERT/UPDATE/DELETE | `user_id = auth.uid()` |
| decks | SELECT/INSERT/UPDATE/DELETE | `user_id = auth.uid()` |
| shared_statistics | SELECT (public) | tokenによるアクセス（認証不要） |
| shared_statistics | INSERT/UPDATE/DELETE | `user_id = auth.uid()` |
| 全テーブル | ALL (admin) | usersテーブルでis_admin=trueの場合バイパス |

---

## エラーハンドリングフロー

| エラー種別 | フロントエンド処理 |
|-----------|------------------|
| 401 Unauthorized | ログイン画面へリダイレクト |
| 400 Validation | フォームにフィールドエラーを表示 |
| 403 Forbidden | Toastでエラーメッセージを表示 |
| 404 Not Found | 「見つかりません」ページを表示 |
| 5xx Server Error | リトライを促すToastを表示 |

---

## 関連ドキュメント

- [api.md](./api.md) - API設計
- [data-model.md](./data-model.md) - データモデル
- [0001-supabase-auth.md](../04-decisions/0001-supabase-auth.md) - Supabase Auth採用ADR
