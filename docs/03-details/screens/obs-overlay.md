---
depends_on: [../ui.md]
tags: [screens, ui, obs, overlay]
ai_summary: "OBSオーバーレイ画面の機能仕様（トークン認証・スマートポーリング・レイアウト）"
---

# OBSオーバーレイ

> Status: Active
> 最終更新: 2026-01-24

## 画面概要

| 項目 | 内容 |
|------|------|
| パス | `/obs-overlay` |
| 目的 | OBSブラウザソースとして統計情報を配信画面に表示する |
| アクセス権 | 共有トークン必須（URLパラメータで指定） |
| レスポンシブ | 固定レイアウト（OBSソースサイズに依存） |
| URL取得元 | ダッシュボードの配信セクション（OBSブラウザソースパネル） |

### URL取得フロー

ダッシュボードの配信セクションでOBS設定モーダルを開き、URLをクリップボードにコピーする。ユーザーはコピーしたURLをOBSのブラウザソースに貼り付ける。

```mermaid
flowchart LR
    D[ダッシュボード<br/>OBS設定モーダル] -->|URLコピー| C[クリップボード]
    C -->|貼り付け| O[OBSブラウザソース<br/>/obs-overlay]
    O -.->|スマートポーリング| API[/statistics/obs API]
```

---

## クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| token | string | （必須） | 共有APIトークン |
| period_type | string | 'monthly' | monthly / recent / from_start |
| year | number | 現在の年 | 対象年（monthlyモード時） |
| month | number | 現在の月 | 対象月 1-12（monthlyモード時） |
| limit | number | 30 | 対戦数上限（recentモード時） |
| start_id | number | 未指定 | 開始対戦ID（from_startモード時） |
| game_mode | string | 未指定 | RANK / RATE / EVENT / DC |
| display_items | string | totalDuels以外の全項目 | 表示項目（カンマ区切り） |
| layout | string | 'grid' | grid / horizontal / vertical |
| theme | string | 'dark' | dark / light |
| refresh | number | 30000 | 更新間隔（ミリ秒） |

---

## 表示項目（display_items）

display_itemsが未指定の場合、totalDuels以外の全項目を表示する。

| キー | ラベル | 表示形式 |
|------|--------|---------|
| currentDeck | 使用デッキ | テキスト |
| totalDuels | 総対戦数 | 整数 |
| winRate | 勝率 | パーセンテージ |
| firstTurnWinRate | 先攻勝率 | パーセンテージ |
| secondTurnWinRate | 後攻勝率 | パーセンテージ |
| coinWinRate | コイントス勝率 | パーセンテージ |
| goFirstRate | 先攻率 | パーセンテージ |
| gameModeValue | モード値 | ランク表記 or 小数値 |

### gameModeValueのフォーマット

gameModeValueはgame_modeパラメータに応じて異なるキーに解決される。

| モード | 解決先 | 形式 | 例 |
|--------|--------|------|-----|
| RANK | currentRank | ランク名+数字 | 「ブロンズ5」 |
| RATE | currentRate | 小数2桁 | 「1234.56」 |
| DC | currentDc | 小数2桁 | 「1234.56」 |
| EVENT | - | 表示しない | - |

---

## データ更新方式

スマートポーリングで定期的にAPIを呼び出す。

| 項目 | 内容 |
|------|------|
| 初期間隔 | refreshパラメータ値（デフォルト30000ms） |
| 最大間隔 | 60000ms（エラー時にバックオフ） |
| タブ非表示時 | ポーリングを一時停止する |
| 認証 | Bearer token（URLのtokenパラメータ値） |

---

## テーマ

| テーマ | 背景 | テキスト | 枠線 |
|--------|------|---------|------|
| dark | rgba(18,18,18,0.92) | シアン→紫グラデーション | rgba(0,217,255,0.3) |
| light | rgba(255,255,255,0.98) | #0066cc→#8844ffグラデーション | rgba(0,100,200,0.5) |

---

## レイアウト

| レイアウト | 配置 |
|-----------|------|
| grid | グリッド配置（auto-fit、最小200px） |
| horizontal | 横1列（中央揃え） |
| vertical | 縦1列（最大450px幅） |

各カードはラベル + フォーマット済み値で構成される。

---

## 状態

| 状態 | 条件 | 表示内容 |
|------|------|---------|
| ローディング | 初回データ取得中 | 「Loading...」テキスト |
| トークンなし | tokenパラメータ未指定 | 「No token provided」エラー |
| 認証エラー | 401レスポンス | 「トークンが無効」エラー |
| エラー | API通信失敗 | エラーメッセージ（ステータス別） |
| 空データ | データ取得成功・データなし | デフォルト値（0%等）で表示 |

---

## 関連ドキュメント

- [../ui.md](../ui.md) - 画面一覧・共通パターン
- [dashboard.md](./dashboard.md) - ダッシュボード（配信セクションからURL取得）
- [../sharing.md](../sharing.md) - 共有機能（トークン生成）
- [streamer-popup.md](./streamer-popup.md) - 配信者ポップアップ（セッションベース版）
- [profile.md](./profile.md) - プロフィール（配信者モードの有効化）
