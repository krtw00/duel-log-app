# 画面録画分析設計

ブラウザの画面録画から対戦中の特定シーンを検出し、イベントとして取り込む機能。

---

## 実装状況

| 機能 | 状態 |
|------|------|
| コイントス結果検出 | ✅ TensorFlow.js ML |
| 勝敗判定（VICTORY/LOSE） | ✅ TensorFlow.js ML |
| 複数解像度対応（720p〜2160p） | ✅ 正規化処理 |
| ユーザー設定ON/OFF | ✅ `enable_screen_analysis` |
| 対戦入力UIへの統合 | ✅ DuelFormDialog.vue |
| FSM状態管理（メインスレッド） | ✅ 実装完了 |
| 自動対戦記録作成 | ❌ 未実装 |

---

## 検出対象

| 対象 | 説明 |
|------|------|
| 先攻/後攻選択画面 | 選択権ありを検出 |
| 勝敗画面 | VICTORY/LOSE判定 |

---

## アーキテクチャ

### パイプライン

```
フレーム取得 → ROI抽出 → ML分類（Worker） → FSM確定（メインスレッド）
```

| ステップ | 説明 |
|---------|------|
| フレーム取得 | `getDisplayMedia()` + Canvas |
| ROI抽出 | 比率ベースの固定領域切り出し |
| ML分類 | TensorFlow.js（Web Worker） |
| FSM確定 | メインスレッドで時系列管理 |

### ファイル構成

```
frontend/src/
├── composables/
│   └── useScreenAnalysis.ts      # 統合Composable + FSM
├── workers/
│   └── screenAnalysis.worker.ts  # ML分類のみ
└── utils/
    └── screenAnalysis/
        ├── config.ts             # 統合設定
        ├── fsm.ts                # FSM状態機械
        └── types.ts              # 型定義
```

詳細なFSM設計は @./screen-analysis-fsm.md を参照。

---

## 解析パラメータ

| パラメータ | 値 |
|-----------|-----|
| スキャンFPS | 5 fps |
| コイン確定条件 | 5フレーム連続一致 |
| 勝敗確定条件 | 3フレーム連続一致 |
| コインクールダウン | 15秒 |
| 勝敗クールダウン | 12秒 |

---

## ML分類

### TensorFlow.js

| 項目 | 内容 |
|------|------|
| ランタイム | TensorFlow.js（ブラウザ） |
| バックエンド | WebGL（GPU加速） |
| モデル形式 | TensorFlow.js GraphModel |
| 入力サイズ | 224x224 |

### フォールバック

MLモデルがない場合は色ヒストグラムベースのヒューリスティックを使用。

| 状態 | 動作 |
|------|------|
| モデルあり | ML分類を使用 |
| モデルなし | 色ベース判定 + 警告表示 |

---

## プライバシー

| 項目 | 対策 |
|------|------|
| 処理場所 | クライアント（ブラウザ）内で完結 |
| 送信データ | フレーム画像は送信しない |
| 保存 | イベント・メタ情報のみ（画像はデバッガー専用オプトイン） |

---

## 実装ファイル

| ファイル | 説明 |
|---------|------|
| `frontend/src/composables/useScreenAnalysis.ts` | 統合Composable |
| `frontend/src/utils/screenAnalysis/fsm.ts` | FSM状態機械 |
| `frontend/src/workers/screenAnalysis.worker.ts` | ML分類Worker |
| `frontend/src/views/ProfileView.vue` | 設定UI |
| `frontend/src/components/duel/DuelFormDialog.vue` | 対戦入力統合 |
| `backend/app/models/user.py` | `enable_screen_analysis`, `is_debugger` |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| @./screen-analysis-fsm.md | FSM詳細設計 |
| @../02-architecture/frontend-architecture.md | フロントエンド構造 |
| @../04-data/data-model.md | データモデル |
