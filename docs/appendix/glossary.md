# 用語集

Duel Log Appで使用される用語の定義です。

---

## ドメイン用語（TCG関連）

### Duel（デュエル / 対戦）

トレーディングカードゲームにおける1回の対戦。勝敗、使用デッキ、対戦相手デッキ、ゲームモード、ターン順などの情報を含む。

### Deck（デッキ）

対戦で使用するカードの組み合わせ。ユーザーが作成・管理する「自分のデッキ」と、対戦相手が使用する「相手のデッキ」がある。

### is_opponent（相手デッキフラグ）

デッキが「相手のデッキ」であることを示すブール値。`true`の場合、そのデッキは対戦相手が使用したデッキとして記録される。

### Game Mode（ゲームモード）

対戦の種類。例：ランクマッチ、カジュアル、大会など。

### Turn Order（ターン順 / 先攻後攻）

対戦における行動順序。先攻（first）または後攻（second）。

### Coin Toss（コイントス）

対戦開始時のターン順決定方法。勝った側が先攻/後攻を選択できる。

### Matchup（マッチアップ / 相性）

デッキ間の有利不利関係。相性表（Matchup Matrix）で可視化される。

### Win Rate（勝率）

特定の条件下での勝利回数 / 総対戦数。パーセンテージで表示。

---

## アプリケーション用語

### OBS Overlay（OBSオーバーレイ）

OBS Studio等の配信ソフトウェアで表示するための統計情報画面。配信者が視聴者に統計を見せるために使用。

### Streamer Mode（配信者モード）

ユーザーの個人情報（ユーザー名、メールアドレス等）をマスクして表示するモード。配信中のプライバシー保護に使用。

### Shared Statistics（統計共有）

統計情報をURLで公開する機能。共有URLにアクセスすると、認証なしで統計を閲覧できる。

### Statistics Period（統計期間）

統計を計算する期間。全期間、今月、今週、カスタム期間など。

### Deck Archive（デッキアーカイブ）

使用しなくなったデッキを非表示にする機能。アーカイブされたデッキは統計計算から除外されるが、過去の対戦履歴は保持される。

### Deck Merge（デッキマージ）

複数のデッキを1つに統合する機能。重複登録されたデッキを整理するために使用。

---

## 技術用語

### JWT (JSON Web Token)

認証に使用されるトークン形式。Supabase Authが発行し、バックエンドが検証する。

**トークンの送信方法（優先順位順）:**
1. **Authorizationヘッダー** (`Bearer <token>`) - Safari ITP対策、モバイルアプリ対応
2. **HttpOnly Cookie** (`access_token`) - 通常のブラウザセッション、XSS対策

### HttpOnly Cookie

JavaScriptからアクセスできないCookie。JWTをHttpOnly Cookieに保存することで、XSS攻撃によるトークン窃取を防止。

### OAuth

第三者サービス（Google、Discord、GitHub）を使った認証プロトコル。Supabase Authが対応。

### Pinia

Vue 3の状態管理ライブラリ。グローバルな状態（認証情報、デッキ一覧、統計情報など）を管理。

### Composable

Vue 3のComposition APIで再利用可能なロジックをカプセル化したもの。`use`プレフィックスで命名（例：`useAuth`、`useStatistics`）。

### Alembic

SQLAlchemyのマイグレーションツール。データベーススキーマの変更をバージョン管理。

### Migration（マイグレーション）

データベーススキーマの変更を管理する仕組み。Alembicが`backend/alembic/versions/`にマイグレーションファイルを生成。

### Service Layer（サービス層）

ビジネスロジックを集約するレイヤー。Routerとモデルの間に位置し、トランザクション管理やバリデーションを担当。

### ADR (Architecture Decision Record)

アーキテクチャ決定記録。技術選択の理由、検討した代替案、結果を文書化したもの。

---

## 略語

| 略語 | 正式名称 | 説明 |
|------|---------|------|
| TCG | Trading Card Game | トレーディングカードゲーム |
| API | Application Programming Interface | アプリケーション間の通信仕様 |
| REST | Representational State Transfer | Web APIの設計スタイル |
| CRUD | Create, Read, Update, Delete | 基本的なデータ操作 |
| ORM | Object-Relational Mapping | オブジェクトとRDBのマッピング |
| UI | User Interface | ユーザーインターフェース |
| UX | User Experience | ユーザー体験 |
| CI/CD | Continuous Integration/Continuous Deployment | 継続的インテグレーション/デプロイ |
| XSS | Cross-Site Scripting | クロスサイトスクリプティング攻撃 |
| CORS | Cross-Origin Resource Sharing | オリジン間リソース共有 |

---

## 関連ドキュメント

- @../00-INDEX.md - ドキュメントインデックス
- @../04-data/data-model.md - データモデル詳細
- @../10-decisions/ - 技術選択の詳細理由
