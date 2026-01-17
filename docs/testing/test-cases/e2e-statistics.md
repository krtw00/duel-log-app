# 統計表示 E2Eテストケース

## 概要
統計表示機能（総合勝率、デッキ相性、配信オーバーレイ、統計共有）のE2Eテストケース。
agent-browserを使用してUIレベルでの動作確認を行う。

---

## TC-STAT-001: 総合勝率の表示

### 目的
ダッシュボードで総合勝率が正しく表示されることを確認する。

### 前提条件
- ログイン済み状態である
- 複数の対戦記録が登録されている

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | ダッシュボードを開く | ダッシュボードが表示される |
| 2 | 総合勝率セクションを確認 | 勝率、勝利数、敗北数が表示される |
| 3 | 勝率グラフを確認 | 円グラフまたは棒グラフが表示される |

### agent-browser コマンド

```bash
# ダッシュボードを開く
agent-browser open "http://localhost:5173/dashboard"
agent-browser snapshot

# 期待: 総合勝率が表示される
# 期待: 勝利数、敗北数、引き分け数が表示される
# 期待: 勝率が正しく計算されている（例: 勝利数 / (勝利数 + 敗北数)）

agent-browser screenshot
```

### 備考
- 対戦記録がない場合は適切なメッセージが表示されることを確認
- パーセンテージ表示が正しいことを確認

---

## TC-STAT-002: デッキ別勝率の表示

### 目的
統計ページでデッキ別の勝率が正しく表示されることを確認する。

### 前提条件
- ログイン済み状態である
- 複数のデッキで対戦記録が登録されている

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | 統計ページを開く | 統計情報が表示される |
| 2 | デッキ別勝率セクションを確認 | 各デッキの勝率が表示される |
| 3 | デッキをクリック | そのデッキの詳細統計が表示される |

### agent-browser コマンド

```bash
# 統計ページを開く
agent-browser open "http://localhost:5173/statistics"
agent-browser snapshot

# 期待: デッキ別の勝率が一覧表示される
# 期待: 各デッキの使用回数が表示される
# 期待: デッキごとの勝率が正しく計算されている

# 最初のデッキをクリック
agent-browser click @deck-stats-row-0
agent-browser snapshot

# 期待: そのデッキの詳細統計が表示される
# 期待: 対戦相手別の勝率が表示される

agent-browser screenshot
```

### 備考
- デッキ別の統計が正しく集計されていることを確認
- 使用回数が0のデッキも表示されることを確認

---

## TC-STAT-003: デッキ相性表の表示

### 目的
デッキ相性表が正しく表示されることを確認する。

### 前提条件
- ログイン済み状態である
- 複数のデッキ組み合わせで対戦記録が登録されている

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | 統計ページを開く | 統計情報が表示される |
| 2 | 「相性表」タブをクリック | デッキ相性表が表示される |
| 3 | マトリックス形式の相性表を確認 | 各組み合わせの勝率が表示される |
| 4 | セルをクリック | その組み合わせの詳細が表示される |

### agent-browser コマンド

```bash
# 統計ページを開く
agent-browser open "http://localhost:5173/statistics"
agent-browser snapshot -i

# 相性表タブをクリック
agent-browser click @matchup-tab

# 相性表を確認
agent-browser snapshot

# 期待: 自分のデッキ × 相手のデッキのマトリックスが表示される
# 期待: 各セルに勝率が表示される
# 期待: 色分け（有利/不利）されている

# 特定の組み合わせをクリック
agent-browser click @matchup-cell-0-0
agent-browser snapshot

# 期待: その組み合わせの対戦履歴が表示される
# 期待: 勝利数、敗北数、勝率が表示される

agent-browser screenshot
```

### 備考
- 対戦データがない組み合わせは「データなし」と表示されることを確認
- 勝率に応じた色分け（緑: 有利、赤: 不利、黄: 互角）が正しいことを確認

---

## TC-STAT-004: フィルタリング機能

### 目的
統計ページのフィルタリング機能が正常に動作することを確認する。

### 前提条件
- ログイン済み状態である
- 異なるゲームモード、日付の対戦記録が登録されている

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | 統計ページを開く | 統計情報が表示される |
| 2 | ゲームモードでフィルタリング | 選択したモードの統計のみ表示される |
| 3 | 日付範囲でフィルタリング | 指定期間の統計のみ表示される |
| 4 | フィルタをクリア | 全期間の統計が表示される |

### agent-browser コマンド

```bash
# 統計ページを開く
agent-browser open "http://localhost:5173/statistics"
agent-browser snapshot -i

# ゲームモードでフィルタリング
agent-browser click @filter-mode-select
agent-browser snapshot -i
agent-browser click @filter-mode-ranked
agent-browser snapshot

# 期待: ランクマッチの統計のみが表示される
# 期待: 勝率が再計算されている

# 日付範囲でフィルタリング
agent-browser fill @date-from-input "2024-01-01"
agent-browser fill @date-to-input "2024-01-31"
agent-browser click @apply-filter-button
agent-browser snapshot

# 期待: 2024年1月の統計のみが表示される

# フィルタをクリア
agent-browser click @clear-filters-button
agent-browser snapshot

# 期待: 全期間の統計が再度表示される

agent-browser screenshot
```

### 備考
- フィルタ適用後も統計計算が正しいことを確認
- 複数のフィルタを同時に適用できることを確認

---

## TC-STAT-005: ターン順別勝率の表示

### 目的
先攻/後攻別の勝率が正しく表示されることを確認する。

### 前提条件
- ログイン済み状態である
- 先攻/後攻の情報を含む対戦記録が登録されている

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | 統計ページを開く | 統計情報が表示される |
| 2 | 「ターン順別」セクションを確認 | 先攻/後攻の勝率が表示される |
| 3 | グラフを確認 | 比較グラフが表示される |

### agent-browser コマンド

```bash
# 統計ページを開く
agent-browser open "http://localhost:5173/statistics"
agent-browser snapshot

# 期待: 先攻勝率と後攻勝率が表示される
# 期待: それぞれの対戦数が表示される
# 期待: 比較グラフ（棒グラフなど）が表示される

agent-browser screenshot
```

### 備考
- 先攻/後攻のデータがない場合は適切なメッセージが表示されることを確認

---

## TC-STAT-006: コイントス勝率の表示

### 目的
コイントス（先攻/後攻選択）の勝率が正しく表示されることを確認する。

### 前提条件
- ログイン済み状態である
- コイントス情報を含む対戦記録が登録されている

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | 統計ページを開く | 統計情報が表示される |
| 2 | 「コイントス別」セクションを確認 | コイントス勝利時/敗北時の勝率が表示される |
| 3 | グラフを確認 | 比較グラフが表示される |

### agent-browser コマンド

```bash
# 統計ページを開く
agent-browser open "http://localhost:5173/statistics"
agent-browser snapshot

# 期待: コイントス勝利時の勝率が表示される
# 期待: コイントス敗北時の勝率が表示される
# 期待: それぞれの対戦数が表示される

agent-browser screenshot
```

### 備考
- コイントスのデータがない場合は適切なメッセージが表示されることを確認

---

## TC-STAT-007: OBSオーバーレイの表示

### 目的
OBS配信用のオーバーレイが正しく表示されることを確認する。

### 前提条件
- ログイン済み状態である
- OBSオーバーレイURLを取得済み

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | プロフィールページを開く | プロフィール設定が表示される |
| 2 | OBSオーバーレイセクションを確認 | オーバーレイURLが表示される |
| 3 | 「プレビュー」ボタンをクリック | プレビュー画面が表示される |
| 4 | オーバーレイ内容を確認 | 統計情報が表示される |

### agent-browser コマンド

```bash
# プロフィールページを開く
agent-browser open "http://localhost:5173/profile"
agent-browser snapshot -i

# OBSオーバーレイセクションまでスクロール
agent-browser snapshot

# 期待: OBSオーバーレイURLが表示される
# 期待: URLコピーボタンが表示される

# プレビューボタンをクリック
agent-browser click @obs-preview-button

# 新しいタブが開く（agent-browserでは制限あり）
# オーバーレイページを直接開く
agent-browser open "http://localhost:5173/obs?token=..."
agent-browser snapshot

# 期待: 統計情報が配信用にレイアウトされている
# 期待: 総合勝率、最近の対戦結果が表示される
# 期待: 背景が透明または半透明である

agent-browser screenshot
```

### 備考
- オーバーレイはOBSに組み込むことを想定したレイアウトであることを確認
- 認証トークンが正しく機能することを確認

---

## TC-STAT-008: 統計情報の共有設定

### 目的
統計情報の共有設定が正常に動作することを確認する。

### 前提条件
- ログイン済み状態である
- 対戦記録が登録されている

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | プロフィールページを開く | プロフィール設定が表示される |
| 2 | 統計共有セクションを確認 | 共有設定が表示される |
| 3 | 「共有を有効にする」をクリック | 共有URLが生成される |
| 4 | 共有URLをコピー | URLがクリップボードにコピーされる |
| 5 | 共有URLにアクセス | 統計情報が表示される（認証不要） |

### agent-browser コマンド

```bash
# プロフィールページを開く
agent-browser open "http://localhost:5173/profile"
agent-browser snapshot -i

# 統計共有セクションまでスクロール
agent-browser snapshot

# 共有を有効にするトグルをクリック
agent-browser click @enable-sharing-toggle
agent-browser snapshot

# 期待: 共有URLが生成される
# 期待: URLコピーボタンが表示される

# 共有URLをコピー（コピーされたURLを取得する必要がある）
agent-browser click @copy-share-url-button

# 共有URLにアクセス（新しいブラウザまたはシークレットモード想定）
agent-browser open "http://localhost:5173/shared/statistics/..."
agent-browser snapshot

# 期待: ログインなしで統計情報が表示される
# 期待: 総合勝率、デッキ別勝率、相性表が表示される
# 期待: 個人情報（メールアドレスなど）は表示されない

agent-browser screenshot
```

### 備考
- 共有URLは予測不可能なトークンを含むことを確認
- 共有を無効にすると、URLにアクセスできなくなることを確認

---

## TC-STAT-009: 統計情報の共有範囲設定

### 目的
共有する統計情報の範囲を設定できることを確認する。

### 前提条件
- ログイン済み状態である
- 統計共有が有効になっている

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | プロフィールページを開く | プロフィール設定が表示される |
| 2 | 共有範囲設定を確認 | チェックボックスが表示される |
| 3 | 「デッキ相性表」のチェックを外す | 設定が保存される |
| 4 | 共有URLにアクセス | デッキ相性表が表示されない |
| 5 | 再度チェックを入れる | デッキ相性表が表示される |

### agent-browser コマンド

```bash
# プロフィールページを開く
agent-browser open "http://localhost:5173/profile"
agent-browser snapshot -i

# 共有範囲設定を確認
agent-browser snapshot

# 期待: 「総合勝率」「デッキ別勝率」「デッキ相性表」などのチェックボックスが表示される

# デッキ相性表のチェックを外す
agent-browser click @share-matchup-checkbox
agent-browser snapshot

# 設定を保存
agent-browser click @save-share-settings-button

# 共有URLにアクセス
agent-browser open "http://localhost:5173/shared/statistics/..."
agent-browser snapshot

# 期待: デッキ相性表が表示されない
# 期待: 総合勝率とデッキ別勝率は表示される

agent-browser screenshot
```

### 備考
- 設定変更が即座に反映されることを確認
- 少なくとも1つは共有項目を選択する必要があることを確認

---

## TC-STAT-010: 配信者モードの切り替え

### 目的
配信者モード（個人情報マスク）が正常に動作することを確認する。

### 前提条件
- ログイン済み状態である

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | ダッシュボードを開く | 通常モードで表示される |
| 2 | 配信者モードをONにする | 個人情報がマスクされる |
| 3 | 各ページを確認 | 全ページで個人情報がマスクされている |
| 4 | 配信者モードをOFFにする | 通常表示に戻る |

### agent-browser コマンド

```bash
# ダッシュボードを開く
agent-browser open "http://localhost:5173/dashboard"
agent-browser snapshot

# 期待: ユーザー名、メールアドレスが表示される

# 配信者モードトグルをONにする
agent-browser click @streamer-mode-toggle
agent-browser snapshot

# 期待: ユーザー名が「配信者」などに変更される
# 期待: メールアドレスが「***@***.com」などにマスクされる

# デッキページに移動
agent-browser open "http://localhost:5173/decks"
agent-browser snapshot

# 期待: デッキページでも個人情報がマスクされている

# 配信者モードをOFFにする
agent-browser click @streamer-mode-toggle
agent-browser snapshot

# 期待: 通常表示に戻る

agent-browser screenshot
```

### 備考
- 配信者モードの設定が全ページで一貫して適用されることを確認
- ローカルストレージまたはセッションストレージに設定が保存されることを確認

---

## カバレッジ

| テストID | 機能 | 正常系 | 異常系 | E2E対応 |
|----------|------|--------|--------|---------|
| TC-STAT-001 | 総合勝率表示 | ✅ | - | ✅ |
| TC-STAT-002 | デッキ別勝率表示 | ✅ | - | ✅ |
| TC-STAT-003 | デッキ相性表表示 | ✅ | - | ✅ |
| TC-STAT-004 | フィルタリング | ✅ | - | ✅ |
| TC-STAT-005 | ターン順別勝率 | ✅ | - | ✅ |
| TC-STAT-006 | コイントス勝率 | ✅ | - | ✅ |
| TC-STAT-007 | OBSオーバーレイ | ✅ | - | ✅ |
| TC-STAT-008 | 統計共有設定 | ✅ | - | ✅ |
| TC-STAT-009 | 共有範囲設定 | ✅ | - | ✅ |
| TC-STAT-010 | 配信者モード | ✅ | - | ✅ |

## テスト実行順序の推奨

1. TC-STAT-001（総合勝率表示） - 基本的な統計表示の確認
2. TC-STAT-002（デッキ別勝率表示） - デッキ別統計の確認
3. TC-STAT-003（デッキ相性表表示） - 相性表の確認
4. TC-STAT-004（フィルタリング） - フィルタ機能の確認
5. TC-STAT-005（ターン順別勝率） - ターン順統計の確認
6. TC-STAT-006（コイントス勝率） - コイントス統計の確認
7. TC-STAT-010（配信者モード） - プライバシー機能の確認
8. TC-STAT-007（OBSオーバーレイ） - 配信者向け機能の確認
9. TC-STAT-008（統計共有設定） - 共有機能の確認
10. TC-STAT-009（共有範囲設定） - 共有詳細設定の確認

## 注意事項

- 統計計算の正確性を確認するため、テストデータを慎重に準備すること
- OBSオーバーレイはOBSソフトウェアに組み込んでの動作確認も推奨
- 共有URL機能はセキュリティの観点から、トークンの推測困難性を確認すること
