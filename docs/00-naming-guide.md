---
depends_on: [./00-format-guide.md]
tags: [governance, naming, convention, code-style]
ai_summary: "コード・DB・APIにおける命名規約を定義する規範"
---

# 命名規範

> Status: Active
> 最終更新: 2026-01-23

コード、データベース、APIにおける命名規約を定義する。ドキュメントのファイル命名については[フォーマット規範](./00-format-guide.md)を参照。

---

## レイヤー別規約

| レイヤー | ケース | 例 |
|---------|--------|-----|
| DBカラム | snake_case | `user_id`, `game_mode`, `dueled_at` |
| DBテーブル | snake_case（複数形） | `users`, `decks`, `duels` |
| TypeScript変数・関数 | camelCase | `gameMode`, `wonCoinToss` |
| TypeScript型・インターフェース | PascalCase | `DuelResult`, `GameMode` |
| Reactコンポーネント | PascalCase | `DuelTable`, `StatsCard` |
| Zodスキーマ | camelCase + Schema | `createDuelSchema`, `updateDeckSchema` |
| 定数・Enum値 | UPPER_CASE | `RANK`, `RATE`, `EVENT`, `DC` |
| APIパス | kebab-case | `/shared-statistics`, `/value-sequence` |
| ファイル名（コード） | camelCase | `useScreenAnalysis.ts`, `authStore.ts` |
| ファイル名（コンポーネント） | PascalCase | `DuelTable.tsx`, `StatsCard.tsx` |

---

## ブーリアン命名

### DBカラム

`is_` または `has_` プレフィックスを付与する。

| OK | NG |
|----|-----|
| `is_admin` | `admin` |
| `is_opponent_deck` | `opponent_deck` |
| `is_first` | `first` |
| `has_expired` | `expired` |

### TypeScript

動詞・形容詞で意図を表現する。`is`/`has`/`can`/`should` プレフィックスを使用する。

| OK | NG |
|----|-----|
| `isFirst` | `first` |
| `hasExpired` | `expired` |
| `canEdit` | `editable` |

---

## Enum・定数

### ゲームモード

アプリケーション全体で以下の値を使用する。

| 値 | 意味 |
|----|------|
| `RANK` | ランクマッチ |
| `RATE` | レートマッチ |
| `EVENT` | イベントマッチ |
| `DC` | デュエリストカップ |

### 対戦結果

| 値 | 意味 |
|----|------|
| `win` | 勝利 |
| `loss` | 敗北 |

---

## DB ↔ TypeScript 変換

Drizzle ORMが自動でsnake_case → camelCase変換を行う。手動マッピングは不要。

| DBカラム | TypeScriptプロパティ |
|---------|---------------------|
| `user_id` | `userId` |
| `game_mode` | `gameMode` |
| `is_first` | `isFirst` |
| `dueled_at` | `dueledAt` |
| `rate_value` | `rateValue` |

---

## APIレスポンス

APIレスポンスのJSONキーは**camelCase**を使用する。DBのsnake_caseをそのまま返さない。

```json
{
  "id": "uuid",
  "userId": "uuid",
  "gameMode": "RANK",
  "isFirst": true,
  "dueledAt": "2026-01-23T00:00:00Z"
}
```

---

## 禁止パターン

| パターン | 理由 | 代替 |
|---------|------|------|
| 略語の多用 | 可読性低下 | `usr` → `user`, `msg` → `message` |
| 型名に`I`プレフィックス | TypeScript慣習に反する | `IUser` → `User` |
| 否定形の変数名 | 二重否定で混乱する | `isNotActive` → `isActive`（反転して使用） |
| 汎用名 | 意図不明 | `data`, `info`, `item` → 具体的な名前 |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [フォーマット規範](./00-format-guide.md) | ドキュメントファイルの命名規則 |
| [Git規範](./00-git-guide.md) | ブランチ名・コミットメッセージの命名 |
| [データモデル](./03-details/data-model.md) | DBスキーマ定義（命名の実例） |
