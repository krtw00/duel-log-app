# Duel Log App - Frontend

Vue 3 + TypeScript + Vite を使用したデュエルログアプリケーションのフロントエンドです。

## 🌐 本番環境

- **本番URL**: https://duel-log-app.vercel.app/
- **API**: https://duel-log-app.onrender.com

## 技術スタック

- **Vue 3**: プログレッシブJavaScriptフレームワーク（Composition API）
- **TypeScript**: 型安全性を提供
- **Vite**: 高速な開発サーバーとビルドツール
- **Vuetify 3**: マテリアルデザインコンポーネントライブラリ
- **Pinia**: Vue 3用の状態管理
- **Vue Router**: SPA用のルーティング
- **Axios**: HTTP通信（withCredentials対応）
- **ApexCharts**: チャート・グラフ表示

## セットアップ

### 前提条件

- Docker Desktop

### Docker Composeで起動（推奨）

```bash
# プロジェクトルートで実行
docker compose up -d

# ログ確認
docker compose logs -f frontend
```

### アクセスURL

| サービス | URL |
|---------|-----|
| フロントエンド | http://localhost:5173 |
| バックエンドAPI | http://localhost:8000 |

### コンテナ内でコマンド実行

```bash
# テスト実行
docker compose exec frontend npm run test:unit

# ビルド
docker compose exec frontend npm run build

# リント
docker compose exec frontend npm run lint
```

### 環境変数

開発環境は`.env.development`で設定されています。

本番環境にデプロイする前に、`.env.production`を編集：

```env
VITE_API_URL=https://duel-log-app.onrender.com
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

詳細は [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) を参照してください。

## ビルド

### 開発用ビルド

```bash
npm run build
```

### 本番用ビルド

本番用にビルドする前に、`.env.production` の設定を確認してください。

```bash
npm run build
```

ビルドされたファイルは `dist` ディレクトリに出力されます。

## プレビュー

本番ビルドをローカルでプレビュー:

```bash
npm run preview
```

## テスト

```bash
npm run test
```

カバレッジレポート付きで実行:

```bash
npm run test:coverage
```

## デプロイ

### Vercelへのデプロイ（本番環境）

現在の本番環境: https://duel-log-app.vercel.app/

#### 1. Vercelにプロジェクトをインポート

1. [Vercel](https://vercel.com) にログイン
2. 「Add New Project」をクリック
3. GitHubリポジトリを選択
4. `frontend` ディレクトリをルートディレクトリとして設定

#### 2. 環境変数を設定

Vercel Dashboard で以下の環境変数を設定:

| Name           | Value                               | Environment         |
| -------------- | ----------------------------------- | ------------------- |
| `VITE_API_URL` | `https://duel-log-app.onrender.com` | Production, Preview |

詳細な手順は [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) を参照してください。

#### 3. デプロイ

GitHubにプッシュすると自動的にデプロイされます:

```bash
git add .
git commit -m "Deploy to Vercel"
git push
```

### その他のホスティングサービス

- **Netlify**: [Netlify Documentation](https://docs.netlify.com/)
- **AWS Amplify**: [AWS Amplify Documentation](https://docs.amplify.aws/)
- **GitHub Pages**: SPA用のルーティング設定が必要

## プロジェクト構成

```
frontend/
├── src/
│   ├── assets/          # 静的アセット
│   │   └── styles/      # グローバルスタイル
│   ├── components/      # Vueコンポーネント
│   │   ├── common/      # 共通コンポーネント
│   │   │   ├── LoadingOverlay.vue
│   │   │   └── ToastNotification.vue
│   │   ├── duel/        # デュエル関連コンポーネント
│   │   │   ├── DuelFormDialog.vue
│   │   │   ├── DuelTable.vue
│   │   │   └── StatCard.vue
│   │   └── layout/      # レイアウトコンポーネント
│   │       └── AppBar.vue
│   ├── plugins/         # Vueプラグイン設定
│   │   └── vuetify.ts
│   ├── router/          # ルーティング設定
│   │   └── index.ts
│   ├── services/        # API通信サービス
│   │   └── api.ts       # Axios設定（withCredentials）
│   ├── stores/          # Pinia状態管理
│   │   ├── auth.ts      # 認証状態
│   │   ├── loading.ts   # ローディング状態
│   │   └── notification.ts  # 通知状態
│   ├── types/           # TypeScript型定義
│   │   └── index.ts
│   ├── utils/           # ユーティリティ関数
│   ├── views/           # ページコンポーネント
│   │   ├── DashboardView.vue
│   │   ├── DecksView.vue
│   │   ├── LoginView.vue
│   │   ├── RegisterView.vue
│   │   ├── ForgotPasswordView.vue
│   │   ├── ResetPasswordView.vue
│   │   ├── ProfileView.vue
│   │   └── StatisticsView.vue
│   ├── App.vue          # ルートコンポーネント
│   ├── main.ts          # エントリーポイント
│   └── vite-env.d.ts    # Vite環境変数の型定義
├── public/              # 公開静的ファイル
├── .env.development     # 開発環境変数
├── .env.production      # 本番環境変数
├── .env.example         # 環境変数サンプル
├── ENV_SETUP_GUIDE.md   # 環境変数設定ガイド
├── VERCEL_ENV_SETUP.md  # Vercel環境変数設定ガイド
├── vercel.json          # Vercel設定ファイル
├── vite.config.ts       # Vite設定
└── package.json         # 依存関係
```

## 主な機能

### 認証機能

- ユーザー登録
- ログイン/ログアウト
- パスワードリセット（メール送信機能）
- プロフィール管理
- アカウント削除

### デュエル管理

- 対戦記録の登録
- 対戦履歴の表示・編集・削除
- ゲームモード別フィルタリング（ランク、レート、イベント、DC）
- 先攻/後攻の記録
- ランク/レート値の記録

### デッキ管理

- 自分のデッキ登録
- 相手デッキ登録
- デッキの編集・削除

### 統計機能

- 総合勝率
- デッキ別勝率
- 先攻/後攻勝率
- ゲームモード別統計
- デッキ相性表
- 月間デッキ分布
- 直近デッキトレンド

### UI/UX

- レスポンシブデザイン
- ダークモード対応
- ローディング表示（中央配置）
- トースト通知
- エラーハンドリング

## 認証とセキュリティ

### HttpOnlyクッキー認証

このアプリケーションは、セキュアな認証のためにHttpOnlyクッキーを使用しています。

- **XSS攻撃からの保護**: トークンはJavaScriptからアクセスできません
- **CSRF攻撃からの保護**: `SameSite`属性を使用
- **クロスオリジン対応**: `withCredentials: true`を設定

### CORS設定

バックエンドAPIとのクロスオリジン通信に対応しています：

```typescript
// src/services/api.ts
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // クッキーを送信
});
```

## IDE設定

### VSCode

推奨拡張機能:

- Vue - Official (旧 Volar)
- TypeScript Vue Plugin (Volar)
- ESLint
- Prettier

`.vscode/extensions.json`:

```json
{
  "recommendations": ["Vue.volar", "Vue.vscode-typescript-vue-plugin"]
}
```

## トラブルシューティング

### 環境変数が反映されない

開発サーバーを再起動してください:

```bash
# サーバーを停止 (Ctrl+C)
npm run dev
```

### ビルドエラー

依存関係を再インストールしてください:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Vercelでのデプロイエラー

1. 環境変数が正しく設定されているか確認
   - Vercel Dashboard → Settings → Environment Variables
2. ビルドコマンドが正しいか確認（`npm run build`）
3. Node.jsのバージョンを確認（18以上推奨）
4. ビルドログを確認してエラーメッセージを確認

### CORSエラー

ブラウザのコンソールに「CORS policy」エラーが表示される場合：

1. バックエンドの`FRONTEND_URL`環境変数を確認
2. `withCredentials: true`が設定されているか確認
3. バックエンドのCORS設定を確認

詳細は `backend/CORS_FIX_QUICKSTART.md` を参照。

### ログイン後に画面が遷移しない

1. ブラウザのクッキーを確認
   - F12 → Application → Cookies
   - `access_token`が存在するか確認
2. `/me` エンドポイントのレスポンスを確認
3. サードパーティクッキーが許可されているか確認

詳細は `backend/LOGIN_REDIRECT_FIX.md` を参照。

## パフォーマンス最適化

- **コード分割**: Vue Routerによる自動コード分割
- **遅延ローディング**: ルートごとのコンポーネント遅延ロード
- **ツリーシェイキング**: Viteによる自動最適化
- **画像最適化**: 適切な画像フォーマットとサイズの使用

## ブラウザサポート

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## ライセンス

このプロジェクトのライセンスについては、ルートディレクトリのLICENSEファイルを参照してください。

## 関連ドキュメント

- [環境変数設定ガイド](./ENV_SETUP_GUIDE.md)
- [Vercel環境変数設定ガイド](./VERCEL_ENV_SETUP.md)
- [セットアップガイド](./SETUP_GUIDE.md)
- [Vue 3 Documentation](https://v3.vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Vuetify 3 Documentation](https://vuetifyjs.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue Router Documentation](https://router.vuejs.org/)

## サポート

問題が発生した場合は、[GitHub Issues](https://github.com/krtw00/duel-log-app/issues)で報告してください。
