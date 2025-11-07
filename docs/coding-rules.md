# Duel Log App — コーディング規約まとめ

## 1. 言語別フォーマッタ・リンター・型

### バックエンド (Python 3.11+)

| 項目 | ツール | 設定ファイル | コマンド |
|------|--------|------------|---------|
| **フォーマッター** | Black | `backend/pyproject.toml` | `black .` |
| **リンター** | Ruff | `backend/pyproject.toml` | `ruff check . --fix` |
| **型チェック** | 推奨（Mypy等） | — | （手動実行） |

**設定詳細:**
- 行長: **88文字**
- Python対象: py311+
- Ruff選択ルール: `E, W, F, I, C, B`（除外: E501, B008, C901）

### フロントエンド (TypeScript / Vue 3)

| 項目 | ツール | 設定ファイル | コマンド |
|------|--------|------------|---------|
| **フォーマッター** | Prettier | `frontend/.prettierrc` | `npm run format` |
| **リンター** | ESLint | `frontend/eslint.config.js` | `npm run lint` |
| **型チェック** | TypeScript + vue-tsc | `frontend/tsconfig.json` | `npx vue-tsc --noEmit` |

**設定詳細:**
- 行長: **100文字**
- 引用符: **シングルクォート** (`'`)
- 末尾カンマ: **常に付与** (`all`)
- JSDoc: 関数・クラス・メソッドに `@param`, `@returns` の記載を推奨

---

## 2. 命名規則

**プロジェクト全体の方針:** `snake_case` への段階的な統一

### Python (バックエンド)

| 対象 | 規則 | 例 |
|------|------|-----|
| **モジュール・ファイル** | `snake_case` | `deck_service.py`, `user_model.py` |
| **関数・メソッド** | `snake_case` | `get_user_duels()`, `calculate_win_rate()` |
| **変数** | `snake_case` | `user_id`, `deck_name`, `total_wins` |
| **クラス** | `PascalCase` | `DeckService`, `User`, `Duel` |
| **定数** | `UPPER_SNAKE_CASE` | `MAX_DUEL_RECORDS`, `DEFAULT_TIMEOUT` |
| **プライベート属性** | `_snake_case` | `_db_session` |

### TypeScript / Vue (フロントエンド)

| 対象 | 規則 | 例 |
|------|------|-----|
| **ファイル名** | `snake_case` | `use_duel_form.ts`, `duel_store.ts` |
| **関数・変数** | `snake_case` | `fetch_statistics()`, `duel_data` |
| **コンポーネント** | `PascalCase.vue` | `DuelFormDialog.vue`, `StatisticsChart.vue` |
| **型・インターフェース** | `PascalCase` | `DuelStats`, `MatchupData`, `UserProfile` |
| **定数** | `UPPER_SNAKE_CASE` | `MAX_PAGE_SIZE`, `DEFAULT_PERIOD_TYPE` |
| **プライベート** | `_snake_case` | `_internal_cache` |

**移行戦略:** 既存の `camelCase` コードは機能追加時に段階的に `snake_case` へ置き換え

---

## 3. 例外処理

### バックエンド (Python / FastAPI)

**原則:**
1. **具体的な例外から実装** — 広い例外クラスは避ける
2. **Pydantic例外を活用** — バリデーションエラーは自動処理
3. **FastAPI例外ハンドラ** — グローバルハンドラで統一応答

**例:**
```python
from fastapi import HTTPException, status
from pydantic import ValidationError

# Bad
try:
    result = service.get_user(user_id)
except Exception:
    raise HTTPException(status_code=500)

# Good
try:
    result = service.get_user(user_id)
except UserNotFoundError:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found"
    )
except ValueError as e:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(e)
    )
```

### フロントエンド (Vue / TypeScript)

**原則:**
1. **型安全性を優先** — 例外より戻り値型で表現（Result型パターン推奨）
2. **ユーザーに見える例外のみキャッチ** — 開発者ツール向けはコンソール出力
3. **API呼び出し時のエラーはインターセプターで処理**

**例:**
```typescript
// Bad
try {
  const data = await api.fetchDuels();
  console.log(data);
} catch (e) {
  alert('Error');
}

// Good
try {
  const data = await api.fetchDuels();
  return { success: true, data };
} catch (error) {
  if (error instanceof AxiosError && error.response?.status === 401) {
    authStore.logout();
  }
  return { success: false, error: error.message };
}
```

---

## 4. 依存関係管理方針

### バックエンド

- **パッケージマネージャ:** pip / `requirements.txt`
- **ロック機構:** `docker-compose` で統一環境（バージョン固定）
- **メジャーバージョン更新:** チーム協議後、`alembic` マイグレーション検証

**主要依存:**
- `fastapi` (最新安定版)
- `sqlalchemy 2.0+` (型安全性のため)
- `pydantic v2` (バリデーション)
- `pytest` (テスト)

### フロントエンド

- **パッケージマネージャ:** npm / `package-lock.json`
- **更新ポリシー:** 月1回程度のセキュリティ更新
- **破壊的変更:** メジャーバージョンは慎重に検討

**主要依存:**
- `vue 3.x` (Composition API)
- `typescript 5.x+`
- `vitest` (テスト)
- `vuetify 3.x` (UI)
- `pinia` (状態管理)

---

## 5. テスト方針

### バックエンド (Pytest)

**ファイル構成:**
```
backend/tests/
├── test_auth.py
├── test_deck_service.py
├── test_statistics_api.py
└── ...
```

**実行:**
```bash
pytest                                    # 全テスト
pytest --cov=app --cov-report=html       # カバレッジ付き
pytest tests/test_auth.py::test_login    # 特定テスト
```

**規約:**
- テストファイル: `test_*.py`
- テスト関数: `def test_*()`
- テストクラス: `class Test*()`
- **目標カバレッジ:** 80% 以上

### フロントエンド (Vitest)

**ファイル構成:**
```
frontend/src/
├── components/
│   ├── DuelForm.vue
│   └── DuelForm.test.ts
└── ...
```

**実行:**
```bash
npm run test              # 全テスト
npm run test -- --ui      # UI表示
npm run test:coverage     # カバレッジ
```

**規約:**
- テストファイル: `*.test.ts` / `*.spec.ts`
- **目標カバレッジ:** 70% 以上（UI重点の場合は緩和可）

---

## 6. ドキュメント化

### バックエンド (Python)

**Docstring形式:** Googleスタイル

```python
def calculate_win_rate(
    total_wins: int,
    total_losses: int,
) -> float:
    """
    Calculate win rate from total wins and losses.

    Args:
        total_wins: Total number of wins.
        total_losses: Total number of losses.

    Returns:
        Win rate as a decimal (0.0 to 1.0).

    Raises:
        ValueError: If both wins and losses are zero.
    """
    if total_wins + total_losses == 0:
        raise ValueError("Cannot calculate rate with zero games")
    return total_wins / (total_wins + total_losses)
```

### フロントエンド (TypeScript / Vue)

**JSDoc形式:**

```typescript
/**
 * Fetch duel statistics for a given user.
 *
 * @param userId - The ID of the user
 * @param periodType - The period type (monthly, recent, from_start)
 * @returns The duel statistics
 * @throws {AxiosError} If the API request fails
 */
async function fetch_statistics(
  userId: string,
  periodType: 'monthly' | 'recent' | 'from_start',
): Promise<StatisticsData> {
  // ...
}
```

---

## 7. Git・PR運用

### ブランチ命名規則

**形式:** `<type>/<issue-id>-<description>`

| type | 用途 | 例 |
|------|------|-----|
| `feature` | 新機能 | `feature/GH-456-add-user-profile` |
| `fix` | バグ修正 | `fix/GH-123-login-error` |
| `hotfix` | 緊急修正（main から分岐） | `hotfix/GH-999-security-patch` |
| `refactor` | リファクタリング | `refactor/extract-common-logic` |
| `docs` | ドキュメント | `docs/update-deployment-guide` |
| `chore` | 依存更新・ツール変更 | `chore/upgrade-dependencies` |

### コミットメッセージ

**形式:** `<type>(<scope>): <subject>`

```
feat(api): add user statistics endpoint
fix(frontend): correct login button styling
docs(readme): update setup instructions
refactor(services): extract common validation logic
test(backend): add test for deck calculation
chore(deps): upgrade sqlalchemy to 2.0.24
```

### PR プロセス

1. **ブランチ作成:** `develop` から機能ブランチを作成
2. **開発・コミット:** Conventional Commits に従う
3. **pre-commit フック実行:** 自動でフォーマット・リンティング
4. **PR作成:** `develop` へのプルリクエスト
5. **レビュー・CI:** テスト・リンティング通過を確認
6. **マージ:** Squash or Merge（慣例に従う）
7. **リリース:** `develop` → `main` へのPR（セマンティックバージョニング）

---

## 8. 禁止事項・アンチパターン

### 共通

| ❌ 禁止 | ✅ 代替案 |
|--------|---------|
| ハードコード化された設定値 | 環境変数 (`.env`) または定数 |
| グローバル状態の直接操作 | 状態管理パターン (Pinia / サービス層) |
| 広い except 句 (`except:`) | 具体的な例外クラスの指定 |
| 関数の副作用（隠れた状態変更） | 純粋関数・明示的な戻り値 |

### バックエンド (Python)

| ❌ 禁止 | ✅ 代替案 |
|--------|---------|
| SQLクエリの文字列連結 | SQLAlchemy ORM / パラメータバインド |
| `datetime.now()` の直接使用 | `datetime.now(timezone.utc)` |
| インポート時の副作用 | 遅延ロード・ファクトリパターン |
| 複数の責務を持つ関数 | 単一責務で関数分割 |

### フロントエンド (Vue / TypeScript)

| ❌ 禁止 | ✅ 代替案 |
|--------|---------|
| 任意の `any` 型 | `unknown` → 型絞り込み |
| グローバルスコープへのアクセス | Piniaストア・Props |
| 直接DOM操作 (`document.querySelector`) | Vue Template参照 / `ref` |
| Magic Number・String | 名前付き定数 |

---

## 参考資料

- **開発ガイド:** `docs/development-guide.md`
- **コーディング規約詳細:** `docs/coding-conventions.md`
- **Pre-commit設定:** `.pre-commit-config.yaml`
- **バックエンド設定:** `backend/pyproject.toml`
- **フロントエンド設定:** `frontend/eslint.config.js`, `frontend/.prettierrc`
