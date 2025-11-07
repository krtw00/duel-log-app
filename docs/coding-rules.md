# Duel Log App コーディング規約

## 1. 言語別フォーマッター・リンター・型チェック

### Python (バックエンド)

| ツール | 役割 | 設定ファイル | 主な設定 |
|--------|------|------------|---------|
| **Black** | コードフォーマット | `backend/pyproject.toml` | 行長 88字 |
| **Ruff** | リンター＆フォーマッター | `backend/pyproject.toml` | E, W, F, I, C, B ルール有効 |
| **mypy** | 型チェック | なし（軽量実行） | `--ignore-missing-imports --no-strict-optional` |

**実行コマンド:**
```bash
# 自動修正を含めたリンティング
ruff check . --fix

# フォーマット
black .

# 型チェック
mypy backend/app --ignore-missing-imports --no-strict-optional
```

### TypeScript / Vue (フロントエンド)

| ツール | 役割 | 設定ファイル | 主な設定 |
|--------|------|------------|---------|
| **Prettier** | コードフォーマッター | `frontend/.prettierrc` | シングルクォート、行長 100字 |
| **ESLint** | リンター | `frontend/eslint.config.js` | Vue 3 + TypeScript 対応 |
| **TypeScript** | 型チェック | `frontend/tsconfig.json` | strict モード有効 |

**実行コマンド:**
```bash
# リンティング
npm run lint --prefix frontend

# フォーマット
npm run format --prefix frontend

# 型チェック
npm run build --prefix frontend
```

---

## 2. 命名規則

### Python (バックエンド)

| 対象 | ケース | 例 |
|------|--------|-----|
| モジュール・ファイル | `snake_case` | `deck_service.py` |
| 関数・変数 | `snake_case` | `get_user_duels()`, `user_id` |
| クラス | `PascalCase` | `DeckService`, `User` |
| 定数 | `UPPER_SNAKE_CASE` | `MAX_DUEL_RECORDS` |

**アンチパターン:**
```python
# ❌ camelCase 関数名は使用禁止
def getUserDuels():
    pass

# ✅ snake_case を使用
def get_user_duels():
    pass
```

### TypeScript / Vue (フロントエンド)

| 対象 | ケース | 例 |
|------|--------|-----|
| ファイル・関数・変数 | `snake_case` | `use_duel_form.ts`, `fetch_statistics()` |
| Vue コンポーネント | `PascalCase.vue` | `DuelFormDialog.vue` |
| 型・インターフェース | `PascalCase` | `DuelStats`, `MatchupData` |

**アンチパターン:**
```typescript
// ❌ camelCase ファイル名は使用禁止
// featureName.vue (古い習慣)

// ✅ snake_case ファイル名を使用
// feature_name.vue

// ❌ camelCase 関数は使用禁止
function fetchUserData() {}

// ✅ snake_case 関数を使用
function fetch_user_data() {}
```

---

## 3. 例外処理

### バックエンド (FastAPI)

**カスタム例外の使用:**
```python
from app.core.exceptions import AppException

# ✅ 既知のエラーはカスタム例外で対応
if not deck:
    raise AppException(
        detail="デッキが見つかりません",
        status_code=404
    )

# ❌ 汎用の Exception は使用禁止
# raise Exception("An error occurred")
```

**例外ハンドラの自動処理:**
- `400 Bad Request`: バリデーションエラー（Pydantic）
- `401 Unauthorized`: 認証トークン無効
- `403 Forbidden`: 権限不足
- `404 Not Found`: リソース存在しない
- `422 Unprocessable Entity`: スキーマバリデーション失敗
- `500 Internal Server Error`: 予期しないエラー

詳細は `docs/error-handling.md` を参照。

### フロントエンド (Vue)

**API エラーハンドリング:**
```typescript
// ✅ Axios インターセプターで自動処理
// - 401: ログイン画面へリダイレクト
// - 5xx: トースト通知で表示

// ローカルなバリデーションエラー：
if (!isValidEmail(email)) {
  errors.email = 'Invalid email format'
}
```

---

## 4. 依存管理方針

### バックエンド

- **ロック管理**: `requirements.txt` で固定バージョンを指定
- **セキュリティ**: `safety` でセキュリティ脆弱性をスキャン
- **依存削減**: 不要な依存は即座に削除
- **メジャーバージョン更新**: 事前テスト・リリースノート確認が必須

**例外処理:**
```bash
# 依存のアップデート
pip install --upgrade <package-name>

# セキュリティチェック
safety check
```

### フロントエンド

- **ロック管理**: `package-lock.json` で固定バージョンを指定
- **監査**: `npm audit` でセキュリティ脆弱性をスキャン
- **Dependabot**: 自動更新 PR はレビュー後にマージ

---

## 5. テスト方針

### テスト必須の場面

| 対象 | テスト種別 | 最小カバレッジ |
|------|-----------|-------------|
| ビジネスロジック（サービス層） | ユニット | 80% |
| API エンドポイント | 統合 | すべてのパターン |
| Vue コンポーネント | コンポーネント | 主要パス |

### テスト実行コマンド

**バックエンド:**
```bash
# 全テスト実行（カバレッジ付き）
pytest

# 特定ファイルのみ
pytest tests/test_deck_service.py

# ウォッチモード
pytest --watch
```

**フロントエンド:**
```bash
# ユニットテスト
npm run test:unit

# ウォッチモード
npm test

# カバレッジ付き
npm run test:unit -- --coverage
```

### テスト記述例

**Python (Pytest):**
```python
def test_create_deck_success(db_session, test_user):
    """デッキ作成成功ケース"""
    deck_in = DeckCreate(name="Fire Deck", is_opponent=False)
    deck = deck_service.create_user_deck(db_session, test_user.id, deck_in)
    
    assert deck.name == "Fire Deck"
    assert deck.user_id == test_user.id
```

**TypeScript (Vitest):**
```typescript
describe('DuelForm', () => {
  it('should validate email format', () => {
    const form = mount(DuelForm)
    const input = form.find('input[type="email"]')
    
    input.setValue('invalid-email')
    expect(form.vm.errors.email).toBeTruthy()
  })
})
```

---

## 6. ドキュメント化

### Python (バックエンド)

**Docstring (Google スタイル):**
```python
def get_user_duels(
    db: Session, user_id: int, limit: int = 100
) -> List[Duel]:
    """ユーザーの対戦履歴を取得します。
    
    Args:
        db: SQLAlchemy セッション
        user_id: ユーザー ID
        limit: 取得する対戦数（デフォルト: 100）
    
    Returns:
        対戦履歴のリスト
    
    Raises:
        ValueError: user_id が 0 以下の場合
    """
    if user_id <= 0:
        raise ValueError("user_id must be positive")
    return db.query(Duel).filter(Duel.user_id == user_id).limit(limit).all()
```

### TypeScript / Vue (フロントエンド)

**JSDoc:**
```typescript
/**
 * ユーザーの対戦統計を取得します
 * @param userId - ユーザーID
 * @param period - 集計期間（'monthly' | 'recent' | 'all'）
 * @returns 統計情報
 * @throws APIError - サーバーエラー時
 */
export async function fetch_statistics(
  userId: number,
  period: 'monthly' | 'recent' | 'all'
): Promise<Statistics> {
  // 実装
}
```

---

## 7. Git・PR 運用

### コミットメッセージ (Conventional Commits)

**フォーマット:** `<type>(<scope>): <subject>`

```
feat(backend): add CSV import functionality
fix(frontend): correct login button styling
docs(api): update endpoint documentation
refactor(services): extract duplicate logic
test(deck-service): add edge case tests
chore(deps): bump ruff from 0.1.0 to 0.2.0
```

### PR チェックリスト

- [ ] テストがすべてパスしている
- [ ] 新規コードのテストが追加されている
- [ ] コードがフォーマット・リンティングをパスしている
- [ ] Docstring が記載されている（複雑な関数）
- [ ] `CHANGELOG.md` が更新されている（機能追加時）

### ブランチ命名規則

```
feature/GH-123-add-user-profile
fix/GH-456-correct-login-error
refactor/extract-common-utilities
docs/update-deployment-guide
```

---

## 8. 禁止事項

### 全言語共通

- ❌ コミット履歴の改変（`--force-push`）
- ❌ 本番データベースに対する直接クエリ実行
- ❌ API キー・シークレットをコミット
- ❌ `console.log()` / `print()` をプロダクションコードに残す
- ❌ TODO コメントを残したままマージ（テストコードは除く）

### Python

- ❌ ワイルドカード import（`from module import *`）
- ❌ `exec()` / `eval()` の使用
- ❌ 大域変数の変更

### TypeScript / Vue

- ❌ `any` 型の使用（`unknown` で型安全を確保）
- ❌ 副作用のある computed プロパティ
- ❌ 非同期処理の await 忘れ

---

## 9. pre-commit hooks

本プロジェクトではコミット時に自動チェックが実行されます。

**有効なフック:**
- Black・Ruff (Python コード)
- Prettier (フロントエンド)
- ファイル末尾の改行・空白削除
- YAML/JSON 構文チェック

**セットアップ:**
```bash
pip install pre-commit
pre-commit install
```

すべてのチェックをパスしない限り、コミットはブロックされます。

---

## 10. 参考リンク

- [Conventional Commits](https://www.conventionalcommits.org/ja/)
- [PEP 8 (Python Style Guide)](https://pep8-ja.readthedocs.io/)
- [Vue.js Style Guide](https://ja.vuejs.org/style-guide/)
- [error-handling.md](./error-handling.md) - エラーハンドリング設計
- [development-guide.md](./development-guide.md) - 開発プロセス全般
