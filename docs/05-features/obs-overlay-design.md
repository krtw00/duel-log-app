# OBSオーバーレイ設計

## 概要

配信者向けの統計情報オーバーレイ機能。OBS Studio等の配信ソフトウェアにブラウザソースとして追加し、リアルタイムで対戦統計を表示する。

## 実装状況

| 機能 | 状態 | 備考 |
|------|------|------|
| OBS専用トークン発行 | ✅ 実装済み | 24時間有効、スコープ制限 |
| 統計API | ✅ 実装済み | 複数集計パターン対応 |
| オーバーレイ画面 | ✅ 実装済み | レイアウト・テーマ選択可能 |
| 表示項目カスタマイズ | ✅ 実装済み | ドラッグ&ドロップ対応 |
| スマートポーリング | ✅ 実装済み | 30秒間隔、画面非表示時停止 |
| 設定UI | ✅ 実装済み | URL生成・コピー |

---

## アーキテクチャ

### 認証フロー

```
┌─────────────────────────────────────────────────────────────────┐
│  OBS認証フロー                                                  │
│                                                                 │
│  1. ユーザーが設定画面でOBSトークンを発行                       │
│     POST /auth/obs-token (通常の認証が必要)                     │
│     ↓                                                           │
│  2. OBS専用JWT発行                                              │
│     - scope: "obs_overlay" (統計閲覧のみ)                       │
│     - 有効期限: 24時間                                          │
│     ↓                                                           │
│  3. トークン付きURLを生成                                       │
│     /obs-overlay?token=xxx&period_type=monthly&...              │
│     ↓                                                           │
│  4. OBSのブラウザソースにURL設定                                │
│     ↓                                                           │
│  5. オーバーレイが定期的に統計API呼び出し                       │
│     GET /statistics/obs?token=xxx&...                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### トークン検証の優先順位

バックエンドの `get_obs_overlay_user` 関数:

1. **クエリパラメータ** `token` - OBS URLに埋め込み用
2. **Authorizationヘッダー** `Bearer <token>` - API直接呼び出し用

検証プロセス:
1. OBS専用JWT（scope=obs_overlay）として検証
2. 失敗時、Supabase JWTとして検証（互換性）
3. ユーザーステータス確認（"active"のみ許可）

---

## 機能詳細

### 1. OBS専用トークン

**特徴:**
- 24時間有効（短寿命）
- `scope: "obs_overlay"` でスコープ制限
- 統計情報の読み取りのみ許可
- 書き込み操作は不可

**ペイロード:**
```json
{
  "sub": "user_id",
  "scope": "obs_overlay",
  "username": "user_name",
  "exp": "<24時間後>"
}
```

### 2. 統計集計パターン

| period_type | 説明 | 必須パラメータ |
|-------------|------|---------------|
| `monthly` | 指定月の統計 | year, month |
| `recent` | 直近N戦 | limit (1-100) |
| `from_start` | 配信開始から | start_id |
| `all` | 全期間 | なし |

### 3. 表示項目

| 項目 | 説明 | デフォルト |
|------|------|-----------|
| `current_deck` | 現在のデッキ名 | ✅ 表示 |
| `game_mode_value` | ランク/レート/DC値 | ✅ 表示 |
| `total_duels` | 総試合数 | ❌ 非表示 |
| `win_rate` | 勝率 | ✅ 表示 |
| `first_turn_win_rate` | 先攻勝率 | ✅ 表示 |
| `second_turn_win_rate` | 後攻勝率 | ✅ 表示 |
| `coin_win_rate` | コイントス勝率 | ✅ 表示 |
| `go_first_rate` | 先攻率 | ✅ 表示 |

### 4. レイアウト

| レイアウト | 説明 | 推奨サイズ |
|-----------|------|-----------|
| `grid` | グリッド配置（中央） | 800×600px |
| `horizontal` | 横1列（下部） | 1920×200px |
| `vertical` | 縦1列（右端） | 250×1080px |

### 5. テーマ

| テーマ | 背景色 | グラデーション |
|--------|--------|---------------|
| `dark` | `rgba(18,18,18,0.92)` | `#00d9ff` → `#b536ff` |
| `light` | `rgba(255,255,255,0.98)` | `#0066cc` → `#8844ff` |

---

## API設計

### POST /auth/obs-token

OBS専用トークンを発行

**認証:** 必須（通常のJWT）

**レスポンス:**
```json
{
  "obs_token": "eyJ...",
  "expires_in": 86400,
  "scope": "obs_overlay",
  "message": "OBS連携用トークンを発行しました。このトークンは24時間有効です。"
}
```

### GET /statistics/obs

OBSオーバーレイ用統計を取得

**認証:** OBS専用トークン（query param `token` または Authorization header）

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| token | string | ○ | OBS専用トークン |
| period_type | string | ○ | `monthly`/`recent`/`from_start`/`all` |
| year | int | △ | 年（monthly時必須） |
| month | int | △ | 月（monthly時必須） |
| limit | int | △ | 直近N戦（recent時、1-100） |
| start_id | int | △ | 開始ID（from_start時必須） |
| game_mode | string | - | `RANK`/`RATE`/`EVENT`/`DC` |

**レスポンス:**
```json
{
  "total_duels": 150,
  "win_rate": 62.5,
  "first_turn_win_rate": 68.2,
  "second_turn_win_rate": 55.8,
  "coin_win_rate": 51.3,
  "go_first_rate": 52.0,
  "current_deck": "炎王スネークアイ",
  "current_rank": "マスター1",
  "current_rate": null,
  "current_dc": null
}
```

### GET /statistics/overlay

軽量オーバーレイ用（当日セッション）

**特徴:**
- ETag/If-None-Match によるキャッシュ対応
- 当日の勝敗のみ取得

---

## ユーザー操作

### OBSセットアップ手順

1. **トークン発行**
   - 設定画面 → OBS連携 → 「トークン発行」
   - 24時間有効

2. **URL設定**
   - 集計期間・ゲームモードを選択
   - 表示項目をドラッグ&ドロップで並び替え
   - レイアウト・テーマを選択
   - 「URLをコピー」

3. **OBSに追加**
   - ソース追加 → ブラウザ
   - URLを貼り付け
   - サイズを設定（レイアウト別推奨サイズ参照）
   - カスタムCSS: `body { background-color: transparent; }`

### URL例

```
# 月間統計（2025年1月、ランクマッチ）
/obs-overlay?token=xxx&period_type=monthly&year=2025&month=1&game_mode=RANK&layout=grid&theme=dark

# 直近30戦
/obs-overlay?token=xxx&period_type=recent&limit=30&game_mode=RANK

# 配信開始から（ID=100以降）
/obs-overlay?token=xxx&period_type=from_start&start_id=100&game_mode=RANK
```

---

## 実装ファイル

### バックエンド

| ファイル | 説明 |
|---------|------|
| `app/api/routers/auth.py` | OBSトークン発行エンドポイント |
| `app/api/routers/statistics.py` | `/statistics/obs`, `/statistics/overlay` |
| `app/api/deps.py` | `get_obs_overlay_user` 認証関数 |
| `app/core/security.py` | JWT生成・検証 |

### フロントエンド

| ファイル | 説明 |
|---------|------|
| `src/views/OBSOverlayView.vue` | オーバーレイ表示画面 |
| `src/composables/useOBSConfiguration.ts` | OBS設定ロジック |
| `src/components/obs/OBSConfigPanel.vue` | 設定パネル |

---

## セキュリティ考慮事項

| 項目 | 対策 |
|------|------|
| トークン漏洩 | 24時間で自動失効、スコープ制限で被害軽減 |
| スコープ制限 | `obs_overlay` スコープは統計閲覧のみ許可 |
| ユーザー状態 | `status != "active"` は 403 Forbidden |
| レート制限 | STANDARD制限でトークン発行を保護 |
| HTTPS | 本番環境ではHTTPS必須 |

---

## 技術的特徴

### スマートポーリング

- デフォルト30秒間隔で統計更新
- `visibilitychange` イベントで画面非表示時は停止
- ネットワーク接続状態を監視

### トークンキャッシュ

- フロントエンド側で有効期限-30秒までキャッシュ
- 期限切れ前に自動で再取得可能

### i18n対応

- 全表示テキストが多言語対応
- ランク表示の国際化

---

## 関連ドキュメント

- @./sharing-feature-design.md - 統計共有機能
- @../06-interfaces/api-reference.md - API仕様
- @../10-decisions/002-supabase-auth.md - 認証方式
