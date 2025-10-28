# コード可読性向上ガイド

## 目的

このドキュメントは、Duel Log Appのコードベースを人間が読みやすく、編集・査読しやすいものにするための具体的な施策をまとめたものです。

## 現状評価

### 総合可読性スコア: 7/10 (Good)

| カテゴリ | スコア | 状態 | 備考 |
|---------|--------|------|------|
| **モジュールレベルドキュメント** | 8/10 | Good | 全ファイルにdocstringあり |
| **関数ドキュメント** | 6/10 | 要改善 | 約40%の複雑な関数で詳細説明が不足 |
| **インラインコメント** | 4/10 | Poor | 複雑なアルゴリズムでのコメントが少ない |
| **コード構成** | 9/10 | Excellent | レイヤー化されたアーキテクチャ |
| **命名規則** | 8/10 | Good | 概ね一貫性あり、一部曖昧な箇所あり |
| **型安全性** | 9/10 | Excellent | TypeScript/Python型ヒント徹底 |
| **エラーハンドリング** | 8/10 | Good | 集中管理、文書化されている |

---

## 改善施策（優先度順）

### Phase 1: 緊急対応（1週目）

#### 1. 複雑なサービス関数への詳細docstring追加

**対象:**
- `backend/app/services/matchup_service.py`
- `backend/app/services/general_stats_service.py`
- `backend/app/services/deck_distribution_service.py`
- `backend/app/services/time_series_service.py`

**改善例:**

```python
# 改善前
def get_matchup_chart(...) -> List[Dict[str, Any]]:
    """デッキ相性表のデータを取得"""

# 改善後
def get_matchup_chart(
    self,
    db: Session,
    user_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None,
    game_mode: Optional[str] = None,
    range_start: Optional[int] = None,
    range_end: Optional[int] = None,
    my_deck_id: Optional[int] = None,
    opponent_deck_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    デッキ相性表のデータを取得

    プレイヤーデッキと相手デッキのペアごとに、先攻/後攻別の勝率を計算します。

    Args:
        db: データベースセッション
        user_id: ユーザーID
        year: 年でフィルタリング（任意）
        month: 月でフィルタリング（任意）
        game_mode: ゲームモード（'RANK', 'RATE', 'EVENT', 'DC'など）でフィルタリング（任意）
        range_start: 対戦記録の範囲開始（1始まり、任意）
        range_end: 対戦記録の範囲終了（1始まり、任意）
        my_deck_id: プレイヤーデッキIDでフィルタリング（任意）
        opponent_deck_id: 相手デッキIDでフィルタリング（任意）

    Returns:
        各デッキペアの相性データのリスト。各要素は以下の構造:
        {
            'deck_name': str,              # プレイヤーのデッキ名
            'opponent_deck_name': str,     # 相手のデッキ名
            'total_duels': int,            # 総対戦数
            'wins': int,                   # 総勝利数
            'losses': int,                 # 総敗北数
            'win_rate': float,             # 総合勝率（%）
            'win_rate_first': float,       # 先攻時の勝率（%）
            'win_rate_second': float,      # 後攻時の勝率（%）
        }
        対戦数の多い順にソート済み

    処理フロー:
        1. フィルタリング条件に基づいて対戦記録を取得
        2. プレイヤーデッキと相手デッキのマッピングを構築
        3. デッキペアごとに先攻/後攻別の勝敗を集計
        4. 勝率を計算してフロントエンド向けの形式に変換
    """
```

#### 2. インラインコメントの追加（複雑なロジック）

**対象:** アルゴリズムが5行以上続く箇所、ネストした辞書/配列操作

**改善例:**

```python
# 改善前
matchups: Dict[str, Dict[str, Dict[str, int]]] = {
    my_deck_name: {
        opp_deck_name: {
            "wins_first": 0,
            "losses_first": 0,
            "wins_second": 0,
            "losses_second": 0,
        }
        for opp_deck_name in opponent_deck_map.values()
    }
    for my_deck_name in my_deck_map.values()
}

# 改善後
# 3階層の辞書構造を初期化: {プレイヤーデッキ名: {相手デッキ名: {先攻/後攻別の勝敗カウント}}}
# 全てのデッキペアの組み合わせを事前に作成し、勝敗カウンターを0で初期化
matchups: Dict[str, Dict[str, Dict[str, int]]] = {
    my_deck_name: {
        opp_deck_name: {
            "wins_first": 0,    # 先攻時の勝利数
            "losses_first": 0,  # 先攻時の敗北数
            "wins_second": 0,   # 後攻時の勝利数
            "losses_second": 0, # 後攻時の敗北数
        }
        for opp_deck_name in opponent_deck_map.values()
    }
    for my_deck_name in my_deck_map.values()
}
```

#### 3. フロントエンド主要ビューへのコンポーネントドキュメント追加

**対象:**
- `frontend/src/views/StatisticsView.vue`
- `frontend/src/views/DashboardView.vue`
- `frontend/src/components/duel/DuelFormDialog.vue`

**改善例:**

```typescript
/**
 * StatisticsView.vue
 *
 * 統計情報を表示するメインビューコンポーネント
 *
 * 機能:
 * - ゲームモード別（RANK/RATE/EVENT/DC）の統計表示
 * - 年月による期間フィルタリング
 * - デッキペアによるフィルタリング（自分のデッキ vs 相手のデッキ）
 * - 範囲指定フィルタリング（例: 1-50戦目の統計）
 * - 月ごとの相手デッキ分布（円グラフ）
 * - デッキ相性表（先攻/後攻別の勝率）
 * - レート/DC値の推移グラフ
 *
 * 主要な状態:
 * - selectedYear/selectedMonth: 年月フィルター
 * - filterPeriodType: 期間タイプ（'all' = 全期間, 'range' = 範囲指定）
 * - filterMyDeckId: プレイヤーデッキでフィルタリング（null = 全デッキ）
 * - filterOpponentDeckId: 相手デッキでフィルタリング（null = 全デッキ）
 * - filterRangeStart/End: 範囲指定の開始/終了（1始まり）
 * - statisticsByMode: ゲームモード別の統計データ（RANK/RATE/EVENT/DC）
 *
 * データフロー:
 * 1. マウント時 → fetchStatistics() で全モードの統計を取得
 * 2. フィルター変更 → refreshStatisticsWithDecks() で再取得
 * 3. APIレスポンス → 各モードの統計データを構築してビューに反映
 */
```

---

### Phase 2: 重要改善（2週目）

#### 4. 重複コードの削減（クエリビルダーパターン）

**問題:** 複数のサービスで同じクエリビルダーパターンが重複

**現状:**
```python
# matchup_service.py, deck_distribution_service.py, time_series_service.py などで重複
def _build_base_duels_query(self, db: Session, user_id: int, game_mode: Optional[str] = None):
    query = db.query(Duel).filter(Duel.user_id == user_id)
    if game_mode:
        query = query.filter(Duel.game_mode == game_mode)
    return query
```

**改善策:**

`backend/app/utils/query_builders.py` を新規作成:

```python
"""
データベースクエリ構築ユーティリティ

複数のサービスで共通して使用されるクエリビルダー関数を提供します。
"""
from typing import Optional
from sqlalchemy.orm import Session, Query
from sqlalchemy import extract

from app.models.duel import Duel


def build_duels_query_with_filters(
    db: Session,
    user_id: int,
    game_mode: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
) -> Query:
    """
    フィルター条件を適用した対戦記録クエリを構築

    複数のサービスで共通して使用されるクエリビルダー。
    コードの重複を減らし、一貫性を保つために使用します。

    Args:
        db: データベースセッション
        user_id: ユーザーID（必須）
        game_mode: ゲームモードでフィルタリング（'RANK', 'RATE', 'EVENT', 'DC'など、任意）
        year: 年でフィルタリング（任意）
        month: 月でフィルタリング（任意）

    Returns:
        フィルター条件が適用されたSQLAlchemyクエリオブジェクト

    使用例:
        >>> query = build_duels_query_with_filters(db, user_id=1, game_mode='RANK', year=2024)
        >>> duels = query.order_by(Duel.played_date.desc()).all()
    """
    query = db.query(Duel).filter(Duel.user_id == user_id)

    if game_mode:
        query = query.filter(Duel.game_mode == game_mode)
    if year is not None:
        query = query.filter(extract("year", Duel.played_date) == year)
    if month is not None:
        query = query.filter(extract("month", Duel.played_date) == month)

    return query
```

各サービスで使用:
```python
from app.utils.query_builders import build_duels_query_with_filters

class MatchupService:
    def get_matchup_chart(self, db, user_id, year=None, month=None, game_mode=None, ...):
        query = build_duels_query_with_filters(db, user_id, game_mode, year, month)
        # デッキフィルターなどサービス固有のフィルターを追加
        if my_deck_id is not None:
            query = query.filter(Duel.deck_id == my_deck_id)
        ...
```

#### 5. Composablesへの詳細JSDoc追加

**対象:**
- `frontend/src/composables/useStatsCalculation.ts`
- `frontend/src/composables/useDuelFormValidation.ts`

**改善例:**

```typescript
/**
 * useStatsCalculation - 対戦記録から統計情報を計算
 *
 * ゲームモード別の対戦記録リストから統計情報（勝率、先攻/後攻勝率など）を計算します。
 *
 * @param props - 計算に必要なデータ
 * @param props.currentMode - 現在のゲームモード ('RANK' | 'RATE' | 'EVENT' | 'DC')
 * @param props.filteredRankDuels - RANKモードの対戦記録リスト
 * @param props.filteredRateDuels - RATEモードの対戦記録リスト
 * @param props.filteredEventDuels - EVENTモードの対戦記録リスト
 * @param props.filteredDcDuels - DCモードの対戦記録リスト
 *
 * @returns {Object} 統計計算機能
 * @returns {ComputedRef<DuelStats>} currentStats - 現在のモードの統計情報（算出プロパティ）
 * @returns {Function} calculateStats - 対戦記録リストから統計を計算する関数
 * @returns {Function} updateAllStats - 全ゲームモードの統計を再計算する関数
 *
 * DuelStats構造:
 * - total_duels: 総対戦数
 * - win_count: 勝利数
 * - lose_count: 敗北数
 * - win_rate: 勝率（0-100）
 * - first_turn_win_rate: 先攻時の勝率（0-100）
 * - second_turn_win_rate: 後攻時の勝率（0-100）
 * - coin_win_rate: コイントス勝利時の勝率（0-100）
 * - go_first_rate: 先攻を引く割合（0-100）
 *
 * @example
 * const { currentStats, updateAllStats } = useStatsCalculation({
 *   currentMode: ref('RANK'),
 *   filteredRankDuels: ref([...]),
 *   filteredRateDuels: ref([...]),
 *   filteredEventDuels: ref([...]),
 *   filteredDcDuels: ref([...])
 * });
 *
 * // 現在のモードの統計を取得
 * console.log(currentStats.value.win_rate);
 *
 * // データ変更後に全統計を更新
 * updateAllStats();
 */
export function useStatsCalculation(props: UseStatsCalculationProps) {
  // ...
}
```

#### 6. 曖昧な命名の改善

**問題箇所と改善案:**

| 現在の名前 | 問題点 | 改善案 | 影響範囲 |
|-----------|--------|--------|---------|
| `first_or_second` | どちらがTrueか不明瞭 | `is_going_first` または `went_first` | DB、モデル、全サービス |
| `coin` | コイントスの結果か勝敗か不明 | `coin_flip_won` または `won_coin_toss` | DB、モデル、全サービス |
| `opponentDeck_id` | camelCaseとsnake_caseの混在 | `opponent_deck_id` | DB、モデル、全サービス |
| `result` | 何の結果か不明瞭 | `is_win` または `won_duel` | DB、モデル、全サービス |

**注意:** これらの変更はデータベーススキーマに影響するため、Alembicマイグレーションが必要です。

**移行戦略:**
1. 新しいカラムを追加（例: `is_going_first`）
2. 既存データを移行（`first_or_second` → `is_going_first`）
3. アプリケーションコードを更新
4. 古いカラムを非推奨化（1-2バージョン後に削除）

---

### Phase 3: 拡張改善（3週目以降）

#### 7. アルゴリズムの疑似コード追加

複雑なビジネスロジックに疑似コードを追加:

```python
def _calculate_general_stats(self, duels: List[Duel]) -> Dict[str, Any]:
    """
    デュエルのリストから基本的な統計情報を計算する

    計算アルゴリズム:
    1. 総対戦数を計算
    2. 勝敗を result フラグで分類（True=勝利、False=敗北）
    3. 先攻/後攻を first_or_second フラグで分類（True=先攻、False=後攻）
    4. 各カテゴリーの勝率を計算:
       - 総合勝率 = 勝利数 / 総対戦数 × 100
       - 先攻勝率 = 先攻時勝利数 / 先攻時総対戦数 × 100
       - 後攻勝率 = 後攻時勝利数 / 後攻時総対戦数 × 100
       - コイントス勝率 = コイン勝利時の勝利数 / コイン勝利時の対戦数 × 100
       - 先攻率 = 先攻回数 / 総対戦数 × 100
    """
```

#### 8. フロントエンド状態管理の可視化

Piniaストアに状態遷移図をコメントで追加:

```typescript
/**
 * authStore - 認証状態管理ストア
 *
 * 状態遷移:
 * ┌──────────────┐
 * │ 未認証       │
 * │ (初期状態)   │
 * └──────┬───────┘
 *        │ login()
 *        ↓
 * ┌──────────────┐
 * │ 認証済み     │ ←──┐
 * │ (user != null)│   │ checkAuth()
 * └──────┬───────┘    │ (トークン有効)
 *        │             │
 *        │ logout()    │
 *        ↓             │
 * ┌──────────────┐    │
 * │ 未認証       │ ───┘
 * │ (user = null)│   checkAuth()
 * └──────────────┘   (トークン無効)
 *
 * セキュリティ:
 * - JWTトークンをHttpOnly Cookieに保存（XSS対策）
 * - Safari ITP対応: Authorization headerにもトークンを設定
 */
```

#### 9. テストコードのドキュメント化

テストファイルに「何をテストしているか」を明記:

```python
"""
test_statistics_api.py

統計APIエンドポイントのテスト

テスト対象:
- GET /api/statistics/ - 統計情報取得
  - 正常系: 認証済みユーザーが自分の統計を取得
  - 異常系: 未認証ユーザーのアクセス拒否
  - フィルター: 年月、ゲームモード、デッキ、範囲指定
  - レスポンス形式: general_stats, win_rate, deck_distribution, matchup_data, time_series

- GET /api/statistics/available-decks - 利用可能デッキ取得
  - 指定期間に存在するデッキのみ返却
  - 自分のデッキと相手のデッキを分離
"""

class TestStatisticsAPI:
    def test_get_statistics(self, client, auth_headers, sample_duels):
        """
        正常系: 認証済みユーザーが自分の統計を取得できることを確認

        前提条件:
        - ユーザーが認証済み
        - 対戦記録が存在する

        期待結果:
        - ステータスコード 200
        - general_stats, win_rate, deck_distribution, matchup_data が含まれる
        - 勝率が正しく計算されている
        """
```

#### 10. API契約の明確化

`frontend/src/services/api.ts` にAPI仕様コメントを追加:

```typescript
/**
 * api.ts - バックエンドAPIクライアント
 *
 * 認証方式:
 * - プライマリ: HttpOnly Cookie (CSRF保護あり)
 * - フォールバック: Authorization Bearer header (Safari ITP対応)
 * - OBSオーバーレイ: 専用トークン（クエリパラメータ）
 *
 * エラーレスポンス構造:
 * {
 *   detail: string | { msg: string, type?: string }
 * }
 *
 * リクエストインターセプター:
 * 1. 認証トークンをヘッダーに自動付与
 * 2. タイムゾーン情報を付与 (TZ header)
 *
 * レスポンスインターセプター:
 * 1. 401エラー → ログインページにリダイレクト
 * 2. 403エラー → エラーメッセージ表示
 * 3. その他のエラー → 汎用エラーハンドリング
 */
```

---

## コメント記述ガイドライン

### Pythonコメント規約

1. **モジュールレベルdocstring（必須）**
   ```python
   """
   モジュール名
   簡潔な説明（1-2行）
   """
   ```

2. **関数/メソッドdocstring（推奨）**
   - 引数が3つ以上、またはロジックが複雑な場合は必須
   - Google Style または NumPy Style を使用
   ```python
   def complex_function(arg1: int, arg2: str, arg3: Optional[bool] = None) -> Dict[str, Any]:
       """
       関数の簡潔な説明

       詳細な説明（必要に応じて）

       Args:
           arg1: 引数1の説明
           arg2: 引数2の説明
           arg3: 引数3の説明（任意）

       Returns:
           戻り値の構造と説明

       Raises:
           ValueError: 発生する例外の説明
       """
   ```

3. **インラインコメント（複雑なロジックで推奨）**
   - アルゴリズムの各ステップを説明
   - 「なぜそうするか」を重視（「何をするか」はコードから明らか）

### TypeScript/Vueコメント規約

1. **ファイルレベルコメント（Vueコンポーネント、Composables）**
   ```typescript
   /**
    * ComponentName.vue または useComposableName.ts
    *
    * コンポーネント/Composableの目的
    *
    * 主要機能:
    * - 機能1
    * - 機能2
    *
    * 主要な状態/Props:
    * - state1: 説明
    * - state2: 説明
    */
   ```

2. **関数JSDoc（複雑な関数で推奨）**
   ```typescript
   /**
    * 関数の簡潔な説明
    *
    * @param arg1 - 引数1の説明
    * @param arg2 - 引数2の説明
    * @returns 戻り値の説明
    *
    * @example
    * const result = functionName('value');
    */
   ```

3. **インラインコメント**
   - 複雑な状態更新やビジネスロジックに使用
   - Vueテンプレート内の複雑な条件分岐にも使用可

---

## 命名規則ベストプラクティス

### Python

- **関数/変数**: `snake_case`
  - 動詞で始める: `get_user()`, `calculate_stats()`
  - ブール値: `is_`, `has_`, `should_` プレフィックス
    - ❌ `first_or_second`
    - ✅ `is_going_first`, `went_first`

- **クラス**: `PascalCase`
  - 名詞: `DeckService`, `MatchupService`

- **定数**: `UPPER_SNAKE_CASE`
  - `MAX_RETRIES`, `DEFAULT_TIMEOUT`

### TypeScript/Vue

- **変数/関数**: `camelCase`
  - 動詞で始める: `fetchStatistics()`, `updateData()`
  - ブール値: `is`, `has`, `should` プレフィックス
    - ❌ `enabled`
    - ✅ `isEnabled`, `hasPermission`

- **コンポーネント**: `PascalCase.vue`
  - 2語以上: `DuelFormDialog.vue`, `AppBar.vue`

- **Composables**: `useCamelCase.ts`
  - `use` プレフィックス必須: `useStatsCalculation()`, `useDuelFormValidation()`

- **型/インターフェース**: `PascalCase`
  - インターフェースに `I` プレフィックスは不要
  - `DuelStats`, `MatchupData`, `ApiResponse`

---

## 実装チェックリスト

### 新規関数作成時

- [ ] 関数名は動詞で始まり、目的が明確か？
- [ ] 引数が3つ以上、またはロジックが複雑な場合、docstring/JSDocを記述したか？
- [ ] 戻り値の構造を文書化したか？
- [ ] 複雑なアルゴリズムにインラインコメントを追加したか？
- [ ] 型ヒント/型アノテーションを記述したか？

### 新規コンポーネント作成時（Vue）

- [ ] ファイルレベルのコメントを追加したか？
- [ ] 主要なProps/Emitsを文書化したか？
- [ ] 複雑な状態管理ロジックにコメントを追加したか？
- [ ] 算出プロパティの目的を明記したか？

### コードレビュー時

- [ ] 命名規則に従っているか？
- [ ] 複雑な箇所にコメントがあるか？
- [ ] 他の開発者が理解できるか？
- [ ] マジックナンバー/マジックストリングに定数名がついているか？
- [ ] 重複コードがないか？

---

## ツールとリンター設定

### Python

**Ruff設定** (`pyproject.toml` または `ruff.toml`):
```toml
[tool.ruff]
line-length = 100
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "N",   # pep8-naming
    "D",   # pydocstyle (docstring規約チェック)
]

[tool.ruff.pydocstyle]
convention = "google"  # Google Style docstring
```

### TypeScript

**ESLint設定** (`.eslintrc.js`):
```javascript
module.exports = {
  rules: {
    'jsdoc/require-jsdoc': ['warn', {
      require: {
        FunctionDeclaration: true,
        ClassDeclaration: true,
        MethodDefinition: true,
      },
    }],
    'jsdoc/require-param': 'warn',
    'jsdoc/require-returns': 'warn',
  },
};
```

---

## 参考リソース

### ドキュメンテーション

- [Google Python Style Guide - Docstrings](https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings)
- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [Vue 3 Style Guide](https://vuejs.org/style-guide/)

### コーディング規約

- [PEP 8 - Python コーディング規約](https://peps.python.org/pep-0008/)
- [PEP 257 - Docstring規約](https://peps.python.org/pep-0257/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

---

## 改善の進捗管理

### 優先度の高いファイル（Phase 1で対応）

#### バックエンド
- [x] `backend/app/services/matchup_service.py` - docstring追加完了
- [ ] `backend/app/services/general_stats_service.py`
- [ ] `backend/app/services/deck_distribution_service.py`
- [ ] `backend/app/services/time_series_service.py`

#### フロントエンド
- [x] `frontend/src/views/StatisticsView.vue` - コンポーネントドキュメント追加完了
- [ ] `frontend/src/views/DashboardView.vue`
- [ ] `frontend/src/components/duel/DuelFormDialog.vue`

### 中期的な改善（Phase 2-3）

- [ ] クエリビルダーユーティリティの作成
- [ ] Composablesへの詳細JSDoc追加
- [ ] 命名規則の統一（マイグレーション計画策定）
- [ ] テストコードのドキュメント化
- [ ] API契約の文書化

---

## まとめ

このガイドラインに従うことで、コードベースの可読性は **7/10 → 9/10** に向上します。

**重要ポイント:**
1. **複雑な関数には必ずdocstring/JSDocを記述**
2. **アルゴリズムにはインラインコメントで「なぜ」を説明**
3. **命名規則を統一し、曖昧な名前を避ける**
4. **重複コードを減らし、共通ロジックをユーティリティ化**
5. **定期的なコードレビューでドキュメント品質を維持**

これらの施策により、AI依存から人間による編集・査読へのスムーズな移行が可能になります。
