# ようこそ初心者用ページへ

ここでは初心者が開発環境の環境構築と開発で使う便利なツールの入れ方とよく使うコマンドを列挙するよ

## まず毎回これをやってほしいぜ

```bash
sudo apt update
sudo apt upgrade -y
sudo apt full-upgrade -y
sudo apt autoremove -y
```    

| Command | Description |
| --- | --- |
| `sudo apt update` | 新しいソフトをインストールする前や、システムやパッケージをアップグレードする前 |
| `sudo apt upgrade -y` | 古いバージョンのパッケージを順番に最新に置き換える |
| `sudo apt full-upgrade -y` | 必要なパッケージを削除・インストールしつつ、システムを最新に |
| `sudo apt autoremove -y` | 古いパッケージや使われなくなった依存ライブラリを自動で削除 |

## 次にgitの最新を入れるぜ

```bash
sudo add-apt-repository ppa:git-core/ppa -y
sudo apt update
sudo apt install git -y
git --version
```    

| Command | Description |
| --- | --- |
| `sudo add-apt-repository ppa:git-core/ppa -y` | Git を最新バージョンにアップグレード するための準備 |
| `sudo apt install git -y` | Git 本体と依存パッケージをダウンロード＆インストール |
| `git --version` | gitのバージョン確認 |

## Pythonのリンター/フォーマッターをインストールするぜ

```bash
pip install ruff black
```    
| Command | Description |
| --- | --- |
| `pip install ruff black` | リンター/フォーマッターのインストール |
| `ruff check .` | カレントディレクトリのコードチェック |
| `ruff check . --fix` | 未使用 import 削除など、細かいものは自動で直す |
| `black .` | ルート配下の Python ファイル全部が綺麗になる |

VSCodeで使う場合の設定の方法も書くかも


## そして最高の相棒"Google Gemini CLI"とかいうAiちゃんを入れるぜ

```bash
npm install -g @google/gemini-cli
gemini
```    

そのままだと`gemini`は英語しか話さないので以下の様に命令してくれ。そうすると以降は日本語がデフォルトになるぜ

```bash
セーブメモリに今後は日本語で回答するよう記憶しておいてください。
```    

キーボードの`Ctrl + C`で`gemini`から抜けられるぜ

| Command | Description |
| --- | --- |
| `npm install -g @google/gemini-cli` | ターミナルで gemini コマンドが使えるようになる |
| `gemini` | geminiが立ち上がる |

## このままでもかなり便利だが、さらにgeminiにgithub連携させるぜ

```bash
(type -p wget >/dev/null || (sudo apt update && sudo apt install wget -y)) \
    && sudo mkdir -p -m 755 /etc/apt/keyrings \
    && out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    && cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
    && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && sudo mkdir -p -m 755 /etc/apt/sources.list.d \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && sudo apt update \
    && sudo apt install gh -y
```  

説明は面倒なので`ChatGPT`に聞いてくれ

```bash
sudo apt update
sudo apt install gh
``` 

| Command | Description |
| --- | --- |
| `sudo apt install gh` | GitHub CLI をインストール |

これで`gemini`でも`gh`コマンドが使えて便利だぜ

試しに`gemini`で`github`の`Issues`を見たいとすると

```bash
cd duel-log-app/
gemini
```  

の後にターミナル画面で

```bash
githubのissuesの一覧をghコマンドで見せてください。
```  

で`github`の`Issues`が見れるぜ

他には`@`を入力することで`gemini`でファイルを参照できるぞ

以下はよく使う`git`コマンド集だ

## 頻出コマンドだ

| Command | Description |
| --- | --- |
| `git branch` | 今どのブランチにいるか確認 |
| `git branch -r` | リモートのブランチ一覧を表示する |
| `git switch main` | ローカルの main ブランチに切り替える |
| `git pull origin main` | ローカルブランチをリモートの最新状態に更新する |
| `git switch develop` | ローカルの develop ブランチに切り替える |
| `git pull origin develop` | ローカルブランチをリモートの最新状態に更新する |
| `git switch -c <type>/<issue-id>-<description>` | 新しいブランチを作って切り替えるときのテンプレ |
| `git add .` | 変更を Git に通知するだけ |
| `git commit -m "WIP(Work In Progress):途中作業"` | 「途中作業の保存」というメッセージ付きでローカルリポジトリに記録 |
| `git push origin ブランチ名` | ローカルのブランチをリモートにアップロードする |

プルリクの説明は面倒なので`ChatGPT`か`gemini`に聞いてくれ

## 試しにgeminiでソースコードの見方説明させるよ

```bash
 @backend/app/　のファイルでどの順番でソースコードを理解すればいいの？
```  

```
一般的なWebアプリケーションの構造を頼りに、以下の順序で読み進めるのが
  効率的です。これは「外側から内側へ」と処理の流れを追うアプローチです。

   1. `main.py` (エントリーポイント)
       * 全ての処理はここから始まります。FastAPIアプリケーションがどのように初期化され、どのルータ
         ーが読み込まれているかを確認します。CORSなどのミドルウェア設定もここにあります。

   2. `api/routers/` (API層)
       * main.pyから読み込まれているルーター（例: auth.py, decks.py, duels.py）を見ます。
       * これにより、アプリケーションがどのようなAPIエンドポイント（URL）を提供しているかが分かりま
         す。いわば、アプリケーションの機能一覧です。

   3. `schemas/` (データ契約層)
       * API層のコードを読むと、リクエストの受け取りやレスポンスの返却にschemas以下のPydanticモデル
         が使われていることに気づくはずです。
       * これを読むことで、各APIがどのような形式のデータをやり取りするのか（APIの仕様）を正確に理解
         できます。

   4. `services/` (ビジネスロジック層)
       * API層の各エンドポイントは、具体的な処理をservices層の関数に委譲しています。
       * 例えば、api/routers/duels.py の create_duel は services/duel_service.py の
         create_user_duel を呼び出しています。アプリケーションの頭脳にあたる部分です。

   5. `models/` (データモデル層)
       * services層のコードを読むと、データベースとのやり取りが発生します。その際にmodels以下のSQLA
         lchemyモデルが使われます。
       * これを読むことで、データベースのテーブルがどのように定義されているかを理解できます。

   6. `core/`, `db/`, `utils/` (サポート層)
       * 最後に、設定 (core/config.py)、認証 (core/security.py)、DBセッション管理 (db/session.py)
         といった、アプリケーション全体を支える共通部品を確認します。

  この流れで進めると、リクエストがどのように受け取られ、処理され、データベースに保存されるかとい
  う一連の流れを追いやすくなります。
```

ってな感じで説明してくれます。

```bash
 @backend/app/main.py の説明をソースコードを比較しながらしてくれ
```  

``` 
✦ backend/app/main.py
  は、FastAPIアプリケーションのエントリーポイントであり、アプリケーション全体の初期設定、ミドルウェ
  アの適用、ルーティングの登録、エラーハンドリングの一元化を行う中心的なファイルです。

  ソースコードの各セクションと対応させながら説明します。

  ---

  1. ロギング設定

   1 import logging
   2 import os
   3 # ...
   4 from app.core.logging_config import setup_logging
   5 
   6 # ロギング設定
   7 setup_logging(level=settings.LOG_LEVEL)
   8 logger = logging.getLogger(__name__)
   * 説明: ここでは、app/core/logging_config.py に定義されている setup_logging 関数を呼び出して、ア
     プリケーション全体のロギング（ログ出力）を設定しています。settings.LOG_LEVEL は
     app/core/config.py で定義された環境変数から取得されるログレベル（例: INFO,
     DEBUG）で、これによりログの出力詳細度を制御し、アプリケーションのログ出力が統一されます。

  2. FastAPIアプリケーションの初期化

   1 from fastapi import FastAPI
   2 # ...
   3 app = FastAPI(
   4     title="Duel Log API",
   5     description="遊戯王デュエルログ管理API",
   6     version="1.0.0",
   7 )
   * 説明: FastAPI クラスのインスタンス app を作成しています。title, description, version
     は、FastAPIが自動生成するAPIドキュメント（通常 /docs
     でアクセス可能）に表示される、このAPIに関する基本的な情報です。

  3. CORS (Cross-Origin Resource Sharing) 設定

    1 from fastapi.middleware.cors import CORSMiddleware
    2 # ...
    3 # 環境変数から許可するオリジンを取得
    4 frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    5 allowed_origins = [
    6     origin.strip() for origin in frontend_url.split(",") if origin.strip()
    7 ]
    8 logger.info(f"Allowed CORS origins from FRONTEND_URL: {allowed_origins}")
    9 
   10 # Vercelのプレビューデプロイメント用の正規表現パターン
   11 vercel_preview_pattern = r"https://.*\.vercel\.app"
   12 logger.info(f"Allowing CORS for Vercel preview pattern: {vercel_preview_pattern}")
   13 
   14 app.add_middleware(
   15     CORSMiddleware,
   16     allow_origins=allowed_origins,
   17     allow_origin_regex=vercel_preview_pattern,
   18     allow_credentials=True,
   19     allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
   20     allow_headers=["Authorization", "Content-Type", "Cookie", "Set-Cookie"],
   21     expose_headers=["Set-Cookie"],
   22 )
   * 説明: CORSMiddleware をアプリケーションに追加し、CORSポリシーを設定しています。
       * allow_origins: 環境変数 FRONTEND_URL
         から取得した、APIへのアクセスを許可するオリジン（ドメインやポートを含むURL）のリストです。
       * allow_origin_regex: Vercelのプレビューデプロイメントのような、動的に生成されるURLパターン
         を正規表現で許可します。
       * allow_credentials=True:
         クッキーやHTTP認証ヘッダーなどの認証情報を含むリクエストを許可します。
       * allow_methods, allow_headers: 許可するHTTPメソッド（GET,
         POSTなど）とHTTPヘッダーを指定しています。
       * これにより、異なるドメインで動作するフロントエンドアプリケーションから、このAPIへのリクエ
         ストがセキュリティポリシーによってブロックされずに処理されるようになります。

  4. 例外ハンドラーの登録

    1 from fastapi.exceptions import RequestValidationError
    2 from sqlalchemy.exc import SQLAlchemyError
    3 from app.core.exception_handlers import (
    4     app_exception_handler,
    5     general_exception_handler,
    6     sqlalchemy_exception_handler,
    7     validation_exception_handler,
    8 )
    9 from app.core.exceptions import AppException
   10 # ...
   11 app.add_exception_handler(AppException, app_exception_handler)
   12 app.add_exception_handler(RequestValidationError, validation_exception_handler)
   13 app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
   14 app.add_exception_handler(Exception, general_exception_handler)
   * 説明: app.add_exception_handler
     を使用して、特定の例外が発生した際に呼び出されるカスタムハンドラーを登録しています。
       * AppException: app/core/exceptions/__init__.py
         で定義されている、アプリケーション固有のカスタム例外です。
       * RequestValidationError: FastAPIがPydanticモデルを使ってリクエストボディやクエリパラメータ
         のバリデーションに失敗した際に発生するエラーです。
       * SQLAlchemyError: データベース操作中に発生するエラーです。
       * Exception: 上記のいずれにも該当しない、予期せぬ全てのエラーをキャッチするための汎用的なハ
         ンドラーです。
      これらのハンドラーは app/core/exception_handlers.py に定義されており、エラー発生時に一貫したJ
  SON形式のエラーレスポンスを返すことで、クライアント側でのエラー処理を容易にします。

  5. ルーターの登録
   1 from app.api.routers import auth, decks, duels, me, shared_statistics, statistics, users
   2 # ...
   3 app.include_router(auth.router)
   4 app.include_router(me.router)
   5 app.include_router(users.router)
   6 app.include_router(decks.router)
   7 app.include_router(duels.router)
   8 app.include_router(statistics.router)
   9 app.include_router(shared_statistics.router)
   * 説明: app/api/routers ディレクトリにある各モジュール（auth.py, decks.py, duels.py
     など）で定義された APIRouter インスタンスを、app.include_router
     を使ってメインのFastAPIアプリケーションに組み込んでいます。
   * これにより、例えば auth.router で定義されたエンドポイントは /auth というURLプレフィックスでア
     クセス可能になり、アプリケーションの機能がモジュールごとに整理され、拡張性が高まります。

  6. ルートとヘルスチェックエンドポイント

   1 @app.get("/", tags=["root"])
   2 def root():
   3     """ルートエンドポイント"""
   4     return {"message": "Duel Log API", "version": "1.0.0", "docs": "/docs"}
   5 
   6 @app.get("/health", tags=["health"])
   7 def health_check():
   8     """ヘルスチェックエンドポイント"""
   9     return {"status": "healthy"}
   * 説明: @app.get デコレーターを使って、HTTP
     GETリクエストに対するエンドポイントを定義しています。
       * /: アプリケーションのルートURLにアクセスした際に、APIの基本的な情報（メッセージ、バージョ
         ン、ドキュメントへのリンク）を返します。
       * /health: アプリケーションが正常に稼働しているかを確認するためのシンプルなエンドポイントで
         す。デプロイされたアプリケーションの監視によく利用されます。

  ---

  このように main.py は、FastAPIアプリケーションの「骨格」を形成し、様々な外部モジュールや設定を
  統合して、機能的なWeb APIとして動作させるための基盤を提供しています。
``` 

らしい。ちなみにbackend/app/main.pyの8～11行目で波線うってるんだけど

```bash
 @backend/app/main.py の8～11行目で波線うってるんだけどなんで？
```  

```
✦ ご指摘の箇所に波線が表示されるのは、コードの静的解析ツール（リンター）がimport文の順序に関する警
  告を出している可能性が非常に高いです。

  コード自体は正しく動作しますが、プロジェクトで定められたコーディング規約（特にimportの並び順）に
  従っていないために表示されています。

  なぜ警告が出るのか？

  Pythonプロジェクトでは、import文を以下のルールで並べるのが一般的です。

   1. 標準ライブラリ (例: import os, import logging)
   2. サードパーティライブラリ (例: from fastapi import ..., from sqlalchemy.exc import ...)
   3. プロジェクト内の自作モジュール (例: from app.api.routers import ...)

  そして、各グループ内ではアルファベット順にソートします。

  ソースコードとの比較

  問題の箇所を見てみましょう。

    1 # --- 8-11行目周辺 ---
    2 
    3 # [サードパーティライブラリ]
    4  7: from fastapi import FastAPI
    5  8: from fastapi.exceptions import RequestValidationError
    6  9: from fastapi.middleware.cors import CORSMiddleware
    7 10: from sqlalchemy.exc import SQLAlchemyError
    8 11:
    9 # [自作モジュール]
   10 12: from app.api.routers import auth, decks, duels, me, shared_statistics, statistics, users

   * グループ分け: 7〜10行目はサードパーティライブラリ、12行目以降は自作モジュールとなっており、11
     行目の空行で正しくグループ分けされています。
   * 並び順: サードパーティのグループ内（7〜10行目）を見てみると、fastapi -> sqlalchemy
     の順で、モジュール名 (fastapi..., sqlalchemy...)
     がアルファベット順に並んでいるように見えます。

  結論

  一見するとルール通りに並んでいるように思えますが、このプロジェクトで使われているリンター（おそ
  らくruffやisort）には、標準とは少し異なる特殊な設定がされている可能性があります。

  例えば、
   * sqlalchemyをfastapiより先に書くべき、というルールが設定されている。
   * 特定のモジュールを別のグループとして扱う設定になっている。

  このような設定が .pre-commit-config.yaml や pyproject.toml
  といった設定ファイルに記述されています。

  要するに、「コードは動くが、プロジェクトの定めるフォーマットルールに従っていない」というのが波
  線の原因です。

  この種の警告は、通常、コマンドを実行して自動で修正できます。もしよろしければ、設定ファイルを確
  認し、整形コマンドを実行して修正しましょうか？
```

眠くなったのでここまで