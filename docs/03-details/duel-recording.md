---
depends_on: []
tags: [appendix, feature, duel]
ai_summary: "対戦記録機能の設計仕様"
---

# 対戦記録機能

> Status: Active
> 最終更新: 2026-01-23

対戦結果の登録・編集・削除を行うコア機能

---

## 概要

| 項目 | 内容 |
|------|------|
| 目的 | 対戦記録機能の設計ドキュメント |
| 状態 | ✅ 実装済み |
| 対象読者 | 開発者 |

---

## 記録項目

### 必須項目

| 項目 | 型 | 説明 |
|------|-----|------|
| result | enum | 勝敗（win/loss） |
| deckId | UUID | 使用デッキ |
| opponentDeckId | UUID | 相手デッキ |
| isFirst | boolean | 先攻/後攻 |
| wonCoinToss | boolean | コイン勝敗 |
| dueledAt | timestamp | 対戦日時 |

### オプション項目

| 項目 | 型 | 説明 |
|------|-----|------|
| gameMode | enum | ゲームモード（デフォルト: RANK） |
| rank | integer | ランク値（RANKモード時） |
| rateValue | float | レート値（RATEモード時） |
| dcValue | integer | DCポイント（DCモード時） |
| memo | string | メモ（500文字以内） |

---

## データフロー

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   DuelTable     │────▶│  DuelFormDialog │────▶│    API Call     │
│  (一覧表示)     │     │  (入力フォーム)  │     │  (POST/PUT)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                             ┌─────────────────┐
│  TanStack Query │◀────────────────────────────│    Database     │
│  (キャッシュ)    │     invalidateQueries      │   (PostgreSQL)  │
└─────────────────┘                             └─────────────────┘
```

---

## 操作

### 作成

1. ダッシュボードで「対戦を記録」ボタン
2. フォームで対戦情報を入力
3. 送信でAPIコール
4. 成功時にキャッシュ無効化 → 一覧更新

### 編集

1. 一覧から対戦を選択
2. フォームに既存データをプリセット
3. 変更後に送信
4. 成功時にキャッシュ無効化

### 削除

1. 一覧から削除対象を選択
2. 確認ダイアログ表示
3. 確認後にDELETEリクエスト
4. 成功時にキャッシュ無効化

---

## バリデーション

### クライアント側（Zod）

| フィールド | バリデーション |
|-----------|--------------|
| result | enum: win, loss |
| deckId | UUID |
| opponentDeckId | UUID |
| isFirst | boolean |
| wonCoinToss | boolean |
| dueledAt | 日付（coerce） |
| gameMode | enum: RANK, RATE, EVENT, DC（optional、デフォルト: RANK） |
| memo | 最大500文字（optional） |

フロントエンド・バックエンドで同一のZodスキーマを共有し、入力検証を統一する。

### サーバー側

- 同一Zodスキーマで検証
- ユーザー所有権チェック（RLS）
- デッキ存在確認

---

## 画面録画分析との統合

画面録画分析機能が有効な場合:

1. FSMがコイン/勝敗を検出
2. 自動でフォームにプリセット
3. ユーザーが確認・修正
4. 通常通り保存

詳細は [画面録画分析](./screen-analysis.md) を参照。

---

## API

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/duels` | GET | 一覧取得（フィルタ対応） |
| `/api/duels` | POST | 作成 |
| `/api/duels/:id` | GET | 詳細取得 |
| `/api/duels/:id` | PUT | 更新 |
| `/api/duels/:id` | DELETE | 削除 |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [API仕様](../../03-details/api.md) | API仕様 |
| [データモデル](../../03-details/data-model.md) | データモデル |
| [画面録画分析](./screen-analysis.md) | 画面録画分析 |
