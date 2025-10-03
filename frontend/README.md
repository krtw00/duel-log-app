# Duel Log App - Frontend

Vue 3 + TypeScript + Vite を使用したデュエルログアプリケーションのフロントエンドです。

## 技術スタック

- **Vue 3**: プログレッシブJavaScriptフレームワーク
- **TypeScript**: 型安全性を提供
- **Vite**: 高速な開発サーバーとビルドツール
- **Vuetify 3**: マテリアルデザインコンポーネントライブラリ
- **Pinia**: Vue 3用の状態管理
- **Vue Router**: SPA用のルーティング
- **Axios**: HTTP通信

## セットアップ

### 前提条件

- Node.js 18以上
- npm または yarn

### インストール

```bash
npm install
```

### 環境変数の設定

環境変数を使用してAPIエンドポイントを設定します。

#### 開発環境

`.env.development` ファイルが自動的に使用されます（デフォルトで `http://localhost:8000`）。

カスタム設定が必要な場合は、`.env.local` を作成してください:

```bash
cp .env.example .env.local
```

#### 本番環境

本番環境にデプロイする前に、`.env.production` ファイルを編集して、実際の本番APIのURLを設定してください:

```env
VITE_API_URL=https://your-production-api.com
```

詳細は [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) を参照してください。

## 開発

開発サーバーを起動:

```bash
npm run dev
```

ブラウザで http://localhost:5173 にアクセスできます。

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

## デプロイ

### Vercelへのデプロイ

#### 1. Vercelにプロジェクトをインポート

1. [Vercel](https://vercel.com) にログイン
2. 「Add New Project」をクリック
3. GitHubリポジトリを選択
4. `frontend` ディレクトリをルートディレクトリとして設定

#### 2. 環境変数を設定

Vercel Dashboard で以下の環境変数を設定:

- **Name**: `VITE_API_URL`
- **Value**: 本番APIのURL（例: `https://api.your-domain.com`）
- **Environment**: Production, Preview

詳細な手順は [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) を参照してください。

#### 3. デプロイ

GitHubにプッシュすると自動的にデプロイされます。

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
│   ├── components/      # Vueコンポーネント
│   │   ├── common/     # 共通コンポーネント
│   │   ├── duel/       # デュエル関連コンポーネント
│   │   └── layout/     # レイアウトコンポーネント
│   ├── plugins/         # Vueプラグイン設定
│   ├── router/          # ルーティング設定
│   ├── services/        # API通信サービス
│   ├── stores/          # Pinia状態管理
│   ├── types/           # TypeScript型定義
│   ├── utils/           # ユーティリティ関数
│   ├── views/           # ページコンポーネント
│   ├── App.vue          # ルートコンポーネント
│   ├── main.ts          # エントリーポイント
│   └── vite-env.d.ts    # Vite環境変数の型定義
├── .env.development     # 開発環境変数
├── .env.production      # 本番環境変数
├── .env.example         # 環境変数サンプル
├── ENV_SETUP_GUIDE.md   # 環境変数設定ガイド
├── VERCEL_ENV_SETUP.md  # Vercel環境変数設定ガイド
├── vercel.json          # Vercel設定ファイル
└── vite.config.ts       # Vite設定
```

## 主な機能

- ユーザー認証（ログイン・登録・パスワードリセット）
- デュエル記録の管理
- デッキ管理
- 統計情報の表示
- レスポンシブデザイン
- ダークモード対応

## IDE設定

### VSCode

推奨拡張機能:
- Vue - Official (旧 Volar)
- TypeScript Vue Plugin (Volar)
- ESLint
- Prettier

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
2. ビルドコマンドが正しいか確認（`npm run build`）
3. Node.jsのバージョンを確認（18以上推奨）

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
