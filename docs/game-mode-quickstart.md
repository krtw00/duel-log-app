# ランク/レート/イベント機能 - クイックスタートガイド

## すぐに試す（4ステップ）

### ステップ1: マイグレーション実行

```bash
docker-compose exec backend alembic upgrade head
```

### ステップ2: バックエンド再起動

```bash
docker-compose restart backend
```

### ステップ3: フロントエンド再起動

```bash
cd frontend
npm run dev
```

### ステップ4: ブラウザでテスト

http://localhost:5173 にアクセス

---

## 新機能の確認

### 1. タブ切り替え
ダッシュボード上部に3つのタブが表示されます：
- 👑 **ランク** - ランクマッチの記録
- 📈 **レート** - レートマッチの記録  
- ⭐ **イベント** - イベントの記録

### 2. モード別統計
各タブで独立した統計が表示されます：
- 総試合数
- 勝率
- コイン勝率
- 先行率
- 先攻勝率
- 後攻勝率

### 3. 対戦記録の追加

**ランクモードの記録**:
```
1. 「対戦記録を追加」をクリック
2. ダイアログ上部で「ランク」タブを選択
3. ランク（B2～M1）を選択
4. 保存
```

**レートモードの記録**:
```
1. 「対戦記録を追加」をクリック
2. ダイアログ上部で「レート」タブを選択
3. レート数値（例: 2500）を入力
4. 保存
```

**イベントモードの記録**:
```
1. 「対戦記録を追加」をクリック
2. ダイアログ上部で「イベント」タブを選択
3. ランク/レートは不要
4. 保存
```

---

## 実装ファイル一覧

### バックエンド（4ファイル）
- ✅ `alembic/versions/9f8a2d3e4b5c_add_game_mode_and_rate_value_to_duels.py`
- ✅ `app/models/duel.py`
- ✅ `app/schemas/duel.py`

### フロントエンド（5ファイル）
- ✅ `src/types/index.ts`
- ✅ `src/utils/ranks.ts`
- ✅ `src/components/duel/DuelFormDialog.vue`
- ✅ `src/components/duel/DuelTable.vue`
- ✅ `src/views/DashboardView.vue`

### ドキュメント（2ファイル）
- ✅ `docs/game-mode-implementation.md`
- ✅ `docs/game-mode-quickstart.md`

---

## トラブルシューティング

### マイグレーションエラーが出る

```bash
# 現在のマイグレーション状態を確認
docker-compose exec backend alembic current

# もう一度実行
docker-compose exec backend alembic upgrade head
```

### フロントエンドでエラーが出る

```bash
# TypeScriptのビルドエラーを確認
cd frontend
npm run build

# エラーがあればnode_modulesを再インストール
rm -rf node_modules
npm install
npm run dev
```

### データが表示されない

```bash
# ブラウザのキャッシュをクリア
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# それでもダメならブラウザの開発者ツールでエラー確認
F12 > Console タブ
```

---

## 既存データについて

既存の対戦記録は自動的に「ランク」モードとして扱われます。
データの損失はありません。

---

## 次に実装すると良い機能

1. **レート推移グラフ**
   - Chart.jsでレートの変動を可視化

2. **ランク別勝率分析**
   - どのランク帯で勝率が高いか分析

3. **イベント名の追加**
   - イベントごとに名前を付けて管理

4. **フィルター機能**
   - 期間指定での絞り込み
   - デッキ別フィルター

実装完了です！
