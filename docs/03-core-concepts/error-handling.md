# エラーハンドリング設計

バックエンドとフロントエンドで一貫したエラーハンドリング戦略。

---

## バックエンド (FastAPI)

`app/core/exception_handlers.py`でグローバル例外ハンドラを定義。

### HTTPエラーコード

| コード | エラー種別 | トリガー |
|--------|-----------|----------|
| 422 | バリデーション | Pydanticスキーマ検証失敗 |
| 401 | 認証 | トークンなし/無効 |
| 403 | 認可 | 権限不足 |
| 500 | サーバー | DB/予期せぬエラー |

### レスポンス形式

```json
{
  "message": "エラーの概要",
  "detail": "詳細情報"
}
```

### ハンドラ一覧

| ハンドラ | 対象 | ログレベル |
|---------|------|-----------|
| `validation_exception_handler` | Pydanticエラー | WARNING |
| `app_exception_handler` | カスタム例外 | ERROR |
| `sqlalchemy_exception_handler` | DBエラー | ERROR |
| `general_exception_handler` | その他 | ERROR |

---

## フロントエンド (Vue.js)

### グローバルAPIエラーハンドリング

`src/services/api.ts`のAxiosインターセプターで処理。

| エラー | 処理 |
|--------|------|
| 401 | authStoreクリア → `/login`へリダイレクト |
| 403 | トースト通知「権限がありません」 |
| 422 | 各フォームコンポーネントで個別処理 |
| 5xx | トースト通知「サーバーエラー」 |

### 通知システム

| ストア/コンポーネント | 役割 |
|----------------------|------|
| `stores/notification.ts` | トースト状態管理 |
| `ToastNotification.vue` | トースト表示（成功=緑、エラー=赤） |
| `stores/loading.ts` | ローディング状態管理 |
| `LoadingOverlay.vue` | ローディングオーバーレイ |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| @./design-principles.md | 設計原則 |
| @../02-architecture/backend-architecture.md | バックエンド構造 |
| @../02-architecture/frontend-architecture.md | フロントエンド構造 |
