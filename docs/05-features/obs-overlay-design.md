# OBSオーバーレイ設計

> **⛔ 廃止予定:** この機能は「配信者ポップアップ」に移行予定です。
> 新規開発は配信者ポップアップで行い、このドキュメントは参照用に残しています。

配信者向けの統計情報オーバーレイ。OBS Studioにブラウザソースとして追加し、リアルタイムで対戦統計を表示。

---

## 実装状況

| 機能 | 状態 |
|------|------|
| OBS専用トークン発行 | ✅ 24時間有効、スコープ制限 |
| 統計API | ✅ 複数集計パターン対応 |
| オーバーレイ画面 | ✅ レイアウト・テーマ選択可能 |
| 表示項目カスタマイズ | ✅ ドラッグ&ドロップ対応 |

---

## 認証フロー

```
ユーザー → POST /auth/obs-token → OBS専用JWT発行
                                  ↓
                          トークン付きURL生成
                                  ↓
                          OBSブラウザソースに設定
                                  ↓
                          GET /statistics/obs で統計取得
```

**トークン検証優先順位:**
1. クエリパラメータ `token` - OBS URL埋め込み用
2. Authorizationヘッダー `Bearer <token>` - API直接呼び出し用

---

## 集計パターン

| period_type | 説明 | 必須パラメータ |
|-------------|------|---------------|
| `monthly` | 指定月の統計 | year, month |
| `recent` | 直近N戦 | limit (1-100) |
| `from_start` | 配信開始から | start_id |
| `all` | 全期間 | なし |

---

## 表示項目

| 項目 | デフォルト |
|------|-----------|
| `current_deck` | ✅ |
| `game_mode_value` | ✅ |
| `win_rate` | ✅ |
| `first_turn_win_rate` | ✅ |
| `second_turn_win_rate` | ✅ |
| `coin_win_rate` | ✅ |
| `go_first_rate` | ✅ |
| `total_duels` | ❌ |

---

## レイアウト・テーマ

| レイアウト | 推奨サイズ |
|-----------|-----------|
| `grid` | 800×600px |
| `horizontal` | 1920×200px |
| `vertical` | 250×1080px |

| テーマ | 背景色 |
|--------|--------|
| `dark` | `rgba(18,18,18,0.92)` |
| `light` | `rgba(255,255,255,0.98)` |

---

## API

### POST /auth/obs-token

OBS専用トークンを発行（認証必須）

```json
{
  "obs_token": "eyJ...",
  "expires_in": 86400,
  "scope": "obs_overlay"
}
```

### GET /statistics/obs

OBSオーバーレイ用統計を取得（OBS専用トークン必須）

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| token | string | ○ | OBS専用トークン |
| period_type | string | ○ | 集計パターン |
| game_mode | string | - | RANK/RATE/EVENT/DC |

---

## 実装ファイル

| バックエンド | 説明 |
|-------------|------|
| `app/api/routers/auth.py` | OBSトークン発行 |
| `app/api/routers/statistics.py` | 統計API |
| `app/api/deps.py` | `get_obs_overlay_user` |

| フロントエンド | 説明 |
|---------------|------|
| `src/views/OBSOverlayView.vue` | オーバーレイ画面 |
| `src/composables/useOBSConfiguration.ts` | 設定ロジック |
| `src/components/obs/OBSConfigPanel.vue` | 設定パネル |

---

## セキュリティ

| 項目 | 対策 |
|------|------|
| トークン漏洩 | 24時間で自動失効 |
| スコープ制限 | 統計閲覧のみ許可 |
| ユーザー状態 | `status != "active"` は 403 |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| @./sharing-feature-design.md | 統計共有機能 |
| @../06-interfaces/api-reference.md | API仕様 |
