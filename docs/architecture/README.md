# アーキテクチャ・設計

このディレクトリは、Duel Log Appのシステムアーキテクチャ、データベース設計、全体的な構造に関するドキュメントをまとめたものです。

## 📚 ドキュメント一覧

- **[backend-architecture.md](./backend-architecture.md)** - FastAPI、SQLAlchemy を用いたバックエンド構造、サービスレイヤー、API設計について解説します。
- **[frontend-architecture.md](./frontend-architecture.md)** - Vue 3 Composition API、Vuetify、Pinia を用いたフロントエンド構造、状態管理、コンポーネント設計について解説します。
- **[db-schema.md](./db-schema.md)** - PostgreSQL データベースのテーブル定義、リレーションシップ、インデックス設計について記述します。
- **[archive-deck-merge-design.md](./archive-deck-merge-design.md)** - デッキアーカイブ時に同じ名前のデッキを自動でマージする機能の設計について記述します。
- **[screen-recording-analysis.md](./screen-recording-analysis.md)** - ブラウザの画面録画から、選択権画面と勝敗（VICTORY/LOSE）を検出してイベント化する設計をまとめます。

## 🎯 このセクションを読むべき人

- **新規開発者**: アーキテクチャ全体を理解したい場合
- **機能追加時**: 既存のレイヤー構造を確認しながら開発したい場合
- **リファクタリング**: システム構造を改善する際の参考資料

## 📖 読む順序

1. [backend-architecture.md](./backend-architecture.md) - バックエンドの全体構造を理解
2. [frontend-architecture.md](./frontend-architecture.md) - フロントエンドの全体構造を理解
3. [db-schema.md](./db-schema.md) - データベース設計の詳細を確認
