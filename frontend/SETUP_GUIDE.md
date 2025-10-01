# 🎮 Duel Log App - フロントエンドセットアップガイド

## 📋 概要

Vue 3 + TypeScript + Vuetify を使用したモダンなフロントエンドアプリケーションです。
サイバーでクールなデザインの対戦記録管理アプリです。

## 🚀 セットアップ手順

### 1. 必要なパッケージのインストール

```bash
cd frontend
npm install
```

すべての必要なパッケージは既に package.json に含まれています。

### 2. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスしてください。

### 3. バックエンドの起動（別ターミナル）

フロントエンドを使用する前に、バックエンドAPIサーバーを起動してください：

```bash
cd backend
docker-compose up
```

または直接Pythonで起動：

```bash
cd backend
uvicorn app.main:app --reload
```

## 📁 ファイル構成

```
frontend/
├── src/
│   ├── main.ts                          # アプリエントリーポイント
│   ├── App.vue                          # ルートコンポーネント
│   ├── router/
│   │   └── index.ts                     # Vue Routerの設定
│   ├── stores/
│   │   └── auth.ts                      # 認証状態の管理
│   ├── views/
│   │   ├── LoginView.vue                # ログイン画面
│   │   └── DashboardView.vue            # 戦績管理画面
│   ├── components/
│   │   └── duel/
│   │       ├── StatCard.vue             # 統計カード
│   │       ├── DuelTable.vue            # 対戦履歴テーブル
│   │       └── DuelFormDialog.vue       # 対戦記録入力フォーム
│   ├── services/
│   │   └── api.ts                       # Axios API Client
│   ├── types/
│   │   └── index.ts                     # TypeScript型定義
│   ├── assets/
│   │   └── styles/
│   │       └── main.scss                # グローバルスタイル
│   └── plugins/
│       └── vuetify.ts                   # Vuetify設定
├── .env                                 # 環境変数
├── index.html                           # HTMLエントリーポイント
├── package.json                         # パッケージ設定
├── tsconfig.json                        # TypeScript設定
├── tsconfig.node.json                   # Node用TypeScript設定
└── vite.config.ts                       # Vite設定
```

## 🎨 デザインの特徴

### カラーパレット
- **Background**: `#0a0e27` (深い青黒)
- **Surface**: `#12162e` (ダークグレー)
- **Primary**: `#00d9ff` (サイバーブルー)
- **Secondary**: `#b536ff` (ネオンパープル)
- **Accent**: `#ff2d95` (ピンク)

### 主な機能
- ✨ ダークテーマをベースにしたサイバーな世界観
- 🌈 グラデーション背景とグローエフェクト
- 🎬 スムーズなアニメーションとトランジション
- 📱 レスポンシブデザイン
- 🔐 JWT認証による安全なログイン

## 🔧 ビルド

本番用にビルドする場合：

```bash
npm run build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

## 🎯 使い方

### 1. ログイン
- 初回起動時はバックエンドでユーザーを作成してください
- メールアドレスとパスワードでログイン

### 2. 対戦記録の追加
- 「対戦記録を追加」ボタンをクリック
- 使用デッキ、相手デッキ、勝敗などを入力
- 保存ボタンで記録完了

### 3. 統計の確認
- ダッシュボード上部の統計カードで勝率などを確認
- テーブルで詳細な対戦履歴を確認

### 4. 記録の編集・削除
- テーブルの各行にある編集・削除ボタンで操作

## 🐛 トラブルシューティング

### ポート5173が使用中の場合

`vite.config.ts` でポート番号を変更してください：

```typescript
server: {
  port: 5174 // 別のポート番号に変更
}
```

### バックエンドとの接続エラー

1. バックエンドが起動しているか確認：`http://localhost:8000/docs`
2. `.env` の `VITE_API_URL` が正しいか確認
3. CORSの設定を確認（バックエンド側の `main.py`）

### TypeScriptエラー

```bash
npm run build
```

を実行して型チェックを確認してください。

### Vuetifyコンポーネントが表示されない

```bash
npm install
```

を再実行して、依存関係を確認してください。

## 📚 使用技術

- **Vue 3.5** - Composition API
- **TypeScript 5.4** - 型安全性
- **Vuetify 3.9** - UIコンポーネントライブラリ
- **Vue Router 4** - ルーティング
- **Pinia 2.1** - 状態管理
- **Axios 1.12** - HTTP通信
- **Vite 4.5** - ビルドツール
- **SCSS** - スタイリング

## 🎯 実装済み機能

- ✅ JWT認証によるログイン/ログアウト
- ✅ 対戦記録の追加・編集・削除
- ✅ 統計カードによる勝率表示
- ✅ 対戦履歴のテーブル表示
- ✅ デッキの管理（バックエンド連携）
- ✅ レスポンシブデザイン
- ✅ ダークモード
- ✅ アニメーション効果

## 🚧 今後の拡張案

### 優先度：高
- [ ] デッキ管理画面の追加
- [ ] フィルター機能の強化
- [ ] エクスポート機能（CSV）

### 優先度：中
- [ ] 統計グラフの実装（Chart.js）
- [ ] 期間別分析機能
- [ ] 相手デッキ別勝率表示

### 優先度：低
- [ ] PWA対応
- [ ] ダークモード/ライトモードの切り替え
- [ ] 多言語対応

## 🔐 セキュリティ

- JWT トークンは localStorage に保存
- トークンは自動的にリクエストヘッダーに付与
- 401エラー時は自動的にログイン画面へリダイレクト
- 本番環境では必ずHTTPSを使用してください

## 📞 サポート

問題が発生した場合：

1. **TypeScriptエラー**: `npm run build` で型チェック
2. **CORSエラー**: バックエンドのCORS設定を確認
3. **ルーティングエラー**: `router/index.ts` のパスを確認
4. **スタイルが反映されない**: ブラウザのキャッシュをクリア

## 🎉 完成！

すべてのファイルが正しく配置されました。
以下のコマンドで起動できます：

```bash
# フロントエンド起動
cd frontend
npm install
npm run dev

# 別ターミナルでバックエンド起動
cd backend
docker-compose up
```

ブラウザで `http://localhost:5173` にアクセスして、
サイバーでクールな対戦記録管理アプリをお楽しみください！🚀✨

---

**Created with ❤️ for Duel Log App**
