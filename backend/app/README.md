1️⃣フォルダ構造の意味

api/
ルーターやエンドポイント。ユーザーが呼ぶ URL に対応。

core/
設定や定数、アプリ全体で使う共通設定（例: JWT設定、環境変数）

db/
DB接続、セッション生成。SQLAlchemyエンジン設定など

models/
SQLAlchemyモデルクラス。DBテーブル定義。マイグレーションと連動

schemas/
Pydanticモデル。APIリクエスト/レスポンスのバリデーション用

services/
ビジネスロジック層。DB操作や統計計算などアプリの処理を書く

templates/
Jinja2テンプレート（HTML出力用）

utils/
ユーティリティ関数。共通処理をまとめる場所

__init__.py
Pythonパッケージ初期化用

auth.py
認証関連処理（JWT、ログイン/ログアウトなど）

main.py
FastAPI アプリのエントリーポイント（起動・ルーター登録）

2️⃣ 理解する順序（おすすめ）

main.py

アプリ全体がどう起動しているか把握
ルーター登録やミドルウェアの流れを確認

models/

DB構造（テーブル・カラム・外部キー）を把握
既に Alembic マイグレーションで作られたテーブルと対応

schemas/

APIで使うデータ型
どのフィールドを受け取ったり返したりしているか

api/

ルーティングを追う
「どの URL → どのサービス関数が呼ばれるか」を理解

services/

ビジネスロジック
DBアクセスや統計計算、勝率計算などアプリの肝

db/、core/、auth.py、utils/

補助部分。設定や認証、DB接続の仕組みを把握する時に読む

3️⃣ 理由

main.py から始めると アプリ全体の流れ が見える

models/ と schemas/ を理解すると DBとAPIの橋渡し が分かる

api/ と services/ を読むと 機能ごとの処理の流れ が追える

おすすめ読み順

main.py → models/ → schemas/ → api/ → services/ → db/core/auth/utils
