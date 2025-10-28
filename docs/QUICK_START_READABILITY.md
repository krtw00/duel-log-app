# 可読性向上クイックスタートガイド

## 🎯 このガイドの目的

今すぐ始められる、コード可読性向上のための実践的な手順をまとめています。

**所要時間:** 30分で最初の改善を完了できます

---

## ✅ Phase 1 の最初の一歩（30分）

### ステップ1: 環境確認（5分）

```bash
# プロジェクトルートで実行
cd /home/b20a0686/duel-log-app

# バックエンドのリンターチェック
cd backend
ruff check app/services/

# フロントエンドのリンターチェック
cd ../frontend
npm run lint

# 問題がある場合は修正
cd ../backend
ruff check app/services/ --fix

cd ../frontend
npm run lint -- --fix
```

### ステップ2: 最初のdocstring追加（10分）

**対象:** `backend/app/services/general_stats_service.py`

1. ファイルを開く
2. `_calculate_general_stats` 関数を見つける
3. 以下のdocstringを追加:

```python
def _calculate_general_stats(self, duels: List[Duel]) -> Dict[str, Any]:
    """
    デュエルのリストから基本的な統計情報を計算する

    Args:
        duels: 統計計算対象の対戦記録リスト

    Returns:
        基本統計情報の辞書。以下のキーを含む:
        - total_duels: 総対戦数
        - win_count: 勝利数
        - lose_count: 敗北数
        - win_rate: 勝率（%）
        - first_turn_total: 先攻回数
        - first_turn_wins: 先攻時勝利数
        - first_turn_win_rate: 先攻時勝率（%）
        - second_turn_total: 後攻回数
        - second_turn_wins: 後攻時勝利数
        - second_turn_win_rate: 後攻時勝率（%）
        - coin_total: コイントス勝利回数
        - coin_wins: コイントス勝利時の勝利数
        - coin_win_rate: コイントス勝利時の勝率（%）
        - go_first_rate: 先攻を引く割合（%）

    計算アルゴリズム:
        1. 総対戦数を計算
        2. 勝敗を result フラグで分類（True=勝利、False=敗北）
        3. 先攻/後攻を first_or_second フラグで分類（True=先攻、False=後攻）
        4. 各カテゴリーの勝率を計算（0で除算を回避）
    """
```

### ステップ3: インラインコメント追加（10分）

同じファイル内で、複雑なロジックにコメントを追加:

```python
# 改善前
first_turn_duels = [d for d in duels if d.first_or_second is True]
second_turn_duels = [d for d in duels if d.first_or_second is False]

# 改善後
# 先攻/後攻でデュエルを分類（first_or_second: True=先攻, False=後攻）
first_turn_duels = [d for d in duels if d.first_or_second is True]
second_turn_duels = [d for d in duels if d.first_or_second is False]

# 先攻時の統計を計算
first_turn_total = len(first_turn_duels)
first_turn_wins = sum(1 for d in first_turn_duels if d.result is True)
first_turn_win_rate = (first_turn_wins / first_turn_total) * 100 if first_turn_total > 0 else 0
```

### ステップ4: 変更を確認（5分）

```bash
# リンターチェック
cd backend
ruff check app/services/general_stats_service.py

# テストが通ることを確認
pytest tests/services/test_general_stats_service.py -v

# 問題なければコミット
git add app/services/general_stats_service.py
git commit -m "docs(services): general_stats_serviceに詳細docstringとコメント追加

- _calculate_general_stats関数に詳細な引数・戻り値の説明を追加
- 複雑なロジックにインラインコメントを追加
- 可読性向上のための改善（Phase 1）"
```

**🎉 おめでとうございます！最初の改善が完了しました！**

---

## 📋 次に取り組むべきファイル（優先度順）

### バックエンド

1. ✅ `general_stats_service.py` ← 今完了！
2. ⬜ `deck_distribution_service.py`（推定時間: 30分）
3. ⬜ `time_series_service.py`（推定時間: 30分）
4. ⬜ `deck_service.py`（推定時間: 45分）

### フロントエンド

1. ⬜ `DashboardView.vue`（推定時間: 30分）
2. ⬜ `DuelFormDialog.vue`（推定時間: 20分）
3. ⬜ `ProfileView.vue`（推定時間: 15分）

---

## 🛠️ よくある質問

### Q: どの関数にdocstringを追加すべき？

**A:** 以下のいずれかに該当する関数:
- 引数が3つ以上
- ロジックが5行以上
- ネストした辞書/配列を返す
- 他のサービスから呼ばれる（パブリックメソッド）

### Q: インラインコメントはどこに追加すべき？

**A:** 以下の箇所:
- 複雑なアルゴリズム（5行以上のロジック）
- ネストしたループや条件分岐
- マジックナンバー/マジックストリングの意味
- 「なぜそうするか」が明確でない箇所

### Q: コメントの長さは？

**A:**
- docstring: できるだけ詳細に（Args, Returns, 処理フローを記載）
- インラインコメント: 1行で簡潔に（長くても2-3行）

### Q: 日本語と英語どちらで書く？

**A:**
- **現状:** 日本語で統一されている
- **推奨:** 引き続き日本語で記述（チーム全員が日本語話者のため）
- **将来:** 英語への移行を検討する場合は、まとめて対応

---

## 📊 進捗の可視化

### GitHub Issues でタスク管理

1. **ラベルを作成:**
   - `documentation` - ドキュメント関連
   - `readability` - 可読性向上
   - `phase-1`, `phase-2`, `phase-3` - フェーズ管理

2. **Issueテンプレート:**

```markdown
## ファイル
`backend/app/services/deck_distribution_service.py`

## タスク
- [ ] `_calculate_deck_distribution_from_duels` に詳細docstring追加
- [ ] ループロジックにインラインコメント追加（3-5箇所）
- [ ] リンターチェック通過
- [ ] テスト実行・通過確認

## 推定時間
30分

## 優先度
P1（Phase 1）

## チェックリスト
- [ ] docstringにArgs, Returnsを記載
- [ ] 複雑なロジックにコメント追加
- [ ] `ruff check` 通過
- [ ] `pytest` 通過
- [ ] コードレビュー依頼
```

3. **Project Board 作成:**
   - Kanban形式: `To Do`, `In Progress`, `Review`, `Done`

---

## 🎨 コードレビューのポイント

### レビュワーチェックリスト

#### docstring/JSDoc
- [ ] Args（引数）の説明がある
- [ ] Returns（戻り値）の説明がある
- [ ] 戻り値の構造が明確（特に辞書/オブジェクト）
- [ ] 複雑なロジックの処理フローが説明されている

#### インラインコメント
- [ ] 複雑なアルゴリズムにコメントがある
- [ ] 「なぜ」が説明されている（「何を」ではなく）
- [ ] コメントが古くなっていない（実装と一致）

#### 命名
- [ ] 変数/関数名が明確
- [ ] ブール値に適切なプレフィックス（`is_`, `has_`, `should_`）
- [ ] マジックナンバーに定数名

---

## 🚀 効率化のTips

### 1. VSCode拡張機能の活用

**Python:**
- `Python Docstring Generator` - docstringテンプレート自動生成
- `Ruff` - リアルタイムリンティング

**TypeScript/Vue:**
- `Document This` - JSDoc自動生成
- `ESLint` - リアルタイムリンティング

### 2. スニペット登録

**VSCodeのユーザースニペット設定:**

`python.json`:
```json
{
  "Google Style Docstring": {
    "prefix": "docstring",
    "body": [
      "\"\"\"",
      "${1:関数の簡潔な説明}",
      "",
      "Args:",
      "    ${2:arg1}: ${3:説明}",
      "",
      "Returns:",
      "    ${4:戻り値の説明}",
      "\"\"\"",
    ]
  }
}
```

`typescript.json`:
```json
{
  "JSDoc Function": {
    "prefix": "jsdoc",
    "body": [
      "/**",
      " * ${1:関数の説明}",
      " *",
      " * @param ${2:param} - ${3:説明}",
      " * @returns ${4:戻り値の説明}",
      " */"
    ]
  }
}
```

### 3. AI支援ツールの活用

**GitHub Copilot / Claude Code:**
- docstringのドラフト生成
- コメント追加の提案
- 既存コードの説明生成

**注意:** AIが生成したコメントは必ず人間がレビュー・修正してください。

---

## 📈 1週間の目標

### 個人目標（チームメンバー1人あたり）

- [ ] 5つの関数にdocstring追加
- [ ] 3つのファイルにインラインコメント追加（各5-10箇所）
- [ ] 1つのVueコンポーネントにドキュメント追加
- [ ] 2回のコードレビュー参加

### チーム目標（3人チームの場合）

- [ ] 15の関数にdocstring追加
- [ ] 10のファイルにコメント追加
- [ ] 3つのVueコンポーネントにドキュメント追加
- [ ] 週次レビュー会を開催

---

## 🎯 成功の指標

### 定量的指標

```bash
# Pythonのdocstringカバレッジチェック
cd backend
ruff check --select D app/

# 改善前: 50件のエラー
# 改善後: 10件のエラー（80%改善！）
```

### 定性的指標

- **コードレビュー時間の短縮:** 理解が早くなる
- **新規メンバーのオンボーディング:** ドキュメントを見れば理解できる
- **バグの早期発見:** ドキュメントと実装の不一致に気づける

---

## 📚 さらに詳しく

- **詳細ガイド:** `docs/code-readability-guide.md`
- **ロードマップ:** `docs/readability-improvement-roadmap.md`
- **開発ガイド:** `docs/development-guide.md`

---

## 💬 困ったときは

### チーム内で相談

- Slackチャンネル: `#code-quality`（作成推奨）
- 週次ミーティングで質問

### 外部リソース

- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [Vue.js Style Guide](https://vuejs.org/style-guide/)

---

## ✅ 今日のアクション

1. ✅ このガイドを読む ← 完了！
2. ⬜ `general_stats_service.py` を改善（30分）
3. ⬜ 変更をコミット
4. ⬜ チームに共有
5. ⬜ 次のファイルを選ぶ

**Let's get started! 🚀**
