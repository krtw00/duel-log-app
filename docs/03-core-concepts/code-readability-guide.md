# コード可読性ガイド

コードベースを人間が読みやすく、編集・査読しやすくするための指針。

---

## 現状評価

総合スコア: **7/10**

| カテゴリ | スコア | 状態 |
|---------|--------|------|
| モジュールドキュメント | 8/10 | Good |
| 関数ドキュメント | 6/10 | 要改善 |
| インラインコメント | 4/10 | Poor |
| コード構成 | 9/10 | Excellent |
| 命名規則 | 8/10 | Good |
| 型安全性 | 9/10 | Excellent |
| エラーハンドリング | 8/10 | Good |

---

## 命名規則

### Python

| 種類 | 規則 | 例 |
|------|------|-----|
| 関数/変数 | snake_case | `get_user()`, `calculate_stats()` |
| ブール値 | is_/has_/should_ | `is_going_first`, `has_permission` |
| クラス | PascalCase | `DeckService`, `MatchupService` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |

### TypeScript/Vue

| 種類 | 規則 | 例 |
|------|------|-----|
| 変数/関数 | camelCase | `fetchStatistics()`, `updateData()` |
| ブール値 | is/has/should | `isEnabled`, `hasPermission` |
| コンポーネント | PascalCase.vue | `DuelFormDialog.vue` |
| Composables | useCamelCase.ts | `useStatsCalculation()` |
| 型 | PascalCase | `DuelStats`, `MatchupData` |

---

## コメント規約

### Python Docstring (Google Style)

```python
def complex_function(arg1: int, arg2: str) -> Dict[str, Any]:
    """
    関数の簡潔な説明

    Args:
        arg1: 引数1の説明
        arg2: 引数2の説明

    Returns:
        戻り値の構造と説明
    """
```

### TypeScript JSDoc

```typescript
/**
 * 関数の簡潔な説明
 *
 * @param arg1 - 引数1の説明
 * @returns 戻り値の説明
 */
```

---

## 改善対象ファイル

### バックエンド（優先度高）

| ファイル | 改善内容 |
|----------|----------|
| `services/matchup_service.py` | 詳細docstring追加 |
| `services/general_stats_service.py` | 詳細docstring追加 |
| `services/deck_distribution_service.py` | 詳細docstring追加 |

### フロントエンド（優先度高）

| ファイル | 改善内容 |
|----------|----------|
| `views/StatisticsView.vue` | コンポーネントドキュメント |
| `views/DashboardView.vue` | コンポーネントドキュメント |
| `composables/useStatsCalculation.ts` | JSDoc追加 |

---

## チェックリスト

### 新規関数作成時

- [ ] 関数名は動詞で始まり、目的が明確か
- [ ] 引数3つ以上/複雑なロジックの場合、docstring/JSDocを記述
- [ ] 型ヒント/型アノテーションを記述

### コードレビュー時

- [ ] 命名規則に従っているか
- [ ] 複雑な箇所にコメントがあるか
- [ ] マジックナンバーに定数名がついているか
- [ ] 重複コードがないか

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| @./design-principles.md | 設計原則 |
| @./error-handling.md | エラーハンドリング |
| @../02-architecture/ | システム構成 |

## 参考リソース

- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- [Vue 3 Style Guide](https://vuejs.org/style-guide/)
- [PEP 8](https://peps.python.org/pep-0008/)
