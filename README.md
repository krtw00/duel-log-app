# Duel-Log-App

**Duel-Log-App** は、Yu-Gi-Oh! マスターデュエルの戦績を効率的に管理・分析するための Web アプリケーションです。対戦履歴の登録から統計分析、デッキ管理、データ共有まで幅広い機能を提供し、プレイヤーの戦績向上をサポートします。

---

## 🚀 特徴

- **戦績管理**: モード（ランク/イベント/カジュアル）、デッキ、勝敗、先攻/後攻、メモなどの詳細情報を登録可能
- **戦績閲覧・検索**: 表形式での表示と、モードやデッキ、勝敗によるフィルタリング機能
- **統計・分析**: 総合勝率やモード別、デッキ別の勝率を視覚的に表示
- **デッキ管理**: デッキ名やアーキタイプの登録・編集・削除機能
- **データエクスポート**: CSV や JSON 形式でのデータエクスポート対応
- **共有機能**: URL を介した戦績共有画面の提供

---

## ⚙️ 技術スタック

### バックエンド
- **フレームワーク**: FastAPI 0.111.1
- **ORM**: SQLAlchemy 2.0.22
- **マイグレーション**: Alembic 1.11.1
- **認証**: Passlib (bcrypt) 1.7.4
- **データベースドライバ**: psycopg2-binary 2.9.7
- **サーバー**: Uvicorn 0.24.0

### フロントエンド
- **フレームワーク**: Vue.js 3.5.21
- **UIライブラリ**: Vuetify 3.9.0-beta.1
- **HTTPクライアント**: Axios 1.12.2
- **ビルドツール**: Vite 4.5.0
- **スタイリング**: Sass 1.93.2, MDI Icons 7.4.47

### インフラ
- **データベース**: PostgreSQL 15
- **コンテナ**: Docker + Docker Compose
- **ホスティング**: Railway（無料枠対応・予定）

---

## 📊 データベース設計

### テーブル構成

- **Users**: ユーザー情報（ユーザー名、メール、パスワードハッシュ）
- **Decks**: デッキ情報（デッキ名、自分/相手の区別）
- **Duels**: 対戦記録（デッキ、相手デッキ、勝敗、先攻/後攻、コイン、ランク、日付、メモ）
- **SharedUrls**: 共有URL情報（年月、URL）

詳細なER図は [`docs/ER図.md`](./docs/ER図.md) を参照してください。

---

## 🛠️ セットアップ

### 前提条件

- Docker Desktop がインストールされていること
- Git がインストールされていること

### インストール手順

1. **リポジトリのクローン**
```bash
git clone <repository-url>
cd duel-log-app
```

2. **環境変数の設定**
```bash
cp .env.example .env
```

`.env` ファイルを編集して以下の変数を設定してください：
```env
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=duellog_db
DATABASE_URL=postgresql://your_username:your_password@db:5432/duellog_db
```

3. **Docker コンテナの起動**
```bash
docker-compose up -d
```

4. **データベースマイグレーションの実行**
```bash
docker-compose exec backend alembic upgrade head
```

5. **アプリケーションへのアクセス**
- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:8000
- API ドキュメント: http://localhost:8000/docs

---

## 🔌 API エンドポイント

### Users API (`/users`)
- `POST /users/` - ユーザー作成
- `GET /users/{user_id}` - ユーザー情報取得
- `GET /users/` - ユーザー一覧取得
- `PUT /users/{user_id}` - ユーザー情報更新
- `DELETE /users/{user_id}` - ユーザー削除

### Decks API (`/decks`)
- `POST /decks/` - デッキ作成
- `GET /decks/` - デッキ一覧取得
- `GET /decks/{deck_id}` - デッキ詳細取得
- `PUT /decks/{deck_id}` - デッキ更新
- `DELETE /decks/{deck_id}` - デッキ削除

### Duels API (`/duels`)
- `POST /duels/` - 対戦記録作成
- `GET /duels/` - 対戦記録一覧取得
- `GET /duels/{duel_id}` - 対戦記録詳細取得
- `PUT /duels/{duel_id}` - 対戦記録更新
- `DELETE /duels/{duel_id}` - 対戦記録削除

詳細なAPIドキュメントは http://localhost:8000/docs で確認できます。

---

## 📁 プロジェクト構造

```
duel-log-app/
├── backend/
│   ├── alembic/              # データベースマイグレーション
│   ├── app/
│   │   ├── api/              # APIエンドポイント
│   │   │   └── routers/      # ルーター（users, decks, duels）
│   │   ├── models/           # SQLAlchemyモデル
│   │   ├── schemas/          # Pydanticスキーマ
│   │   ├── services/         # ビジネスロジック
│   │   ├── core/             # 設定ファイル
│   │   ├── db/               # データベース接続
│   │   ├── auth.py           # 認証機能
│   │   └── main.py           # FastAPIアプリケーション
│   ├── Dockerfile
│   ├── requirements.txt
│   └── alembic.ini
├── frontend/
│   ├── src/
│   │   ├── components/       # Vueコンポーネント
│   │   ├── App.vue
│   │   └── main.js
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── docs/                      # ドキュメント
│   ├── ER図.md
│   └── UI構想.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚧 開発状況

### ✅ 実装済み

#### バックエンド
- [x] FastAPI による REST API
- [x] SQLAlchemy による ORM 実装
- [x] Alembic によるマイグレーション管理
- [x] CRUD 操作（Users, Decks, Duels）
- [x] パスワードハッシュ化（bcrypt）
- [x] CORS 設定
- [x] データベース設計とテーブル作成

#### インフラ
- [x] Docker 環境構築
- [x] PostgreSQL セットアップ
- [x] Docker Compose による統合環境

### 🚧 開発中・未実装

#### 優先度：高
- [ ] **JWT 認証の実装**（現在は仮実装）
- [ ] フロントエンド UI の本格実装
- [ ] 統合テストの作成

#### 優先度：中
- [ ] 統計・分析機能の実装
- [ ] データエクスポート機能（CSV/JSON）
- [ ] 共有機能の実装（SharedUrls テーブル活用）
- [ ] エラーハンドリングの統一
- [ ] バリデーションの強化

#### 優先度：低
- [ ] パフォーマンス最適化
- [ ] レート制限の実装
- [ ] Railway へのデプロイ設定
- [ ] API ドキュメントの充実

---

## ⚠️ セキュリティに関する注意

### 現在の認証実装について

**重要**: 現在の認証機能は開発用の仮実装です。

```python
# app/auth.py（現在の実装）
def get_current_user():
    # 固定ユーザー（id=1）を返す
    class User:
        id = 1
        username = "testuser"
    return User()
```

**本番環境では以下の実装が必須です**:
- JWT トークン認証
- リフレッシュトークン
- トークンの有効期限管理
- セキュアなトークン保存

---

## 🧪 テスト

現在、テストコードは未実装です。今後、以下のテストを追加予定：

- ユニットテスト（pytest）
- 統合テスト
- E2Eテスト

---

## 📖 開発ガイド

### マイグレーションの作成

```bash
# 新しいマイグレーションファイルを作成
docker-compose exec backend alembic revision --autogenerate -m "description"

# マイグレーションを適用
docker-compose exec backend alembic upgrade head

# マイグレーションを1つ戻す
docker-compose exec backend alembic downgrade -1
```

### ログの確認

```bash
# すべてのコンテナのログを表示
docker-compose logs -f

# 特定のコンテナのログを表示
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### データベースへの接続

```bash
# PostgreSQL にアクセス
docker-compose exec db psql -U your_username -d duellog_db
```

---

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

---

## 📝 ライセンス

MIT ライセンスのもとで公開されています。詳細は [LICENSE](./LICENSE) ファイルを参照してください。

---

## 📧 お問い合わせ

プロジェクトに関する質問や提案がある場合は、Issue を作成してください。

---

## 🙏 謝辞

このプロジェクトは以下の技術を使用しています：

- [FastAPI](https://fastapi.tiangolo.com/)
- [Vue.js](https://vuejs.org/)
- [Vuetify](https://vuetifyjs.com/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/)
