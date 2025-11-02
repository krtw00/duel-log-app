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

プルリクについてはまた今度で