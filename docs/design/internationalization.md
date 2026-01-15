# 多言語対応（i18n）設計書

## 1. 概要

### 1.1 目的
Duel Log Appを国際化し、日本語・英語・韓国語の3言語でUIを提供する。

### 1.2 対象範囲
- **対象**: フロントエンドUI（ボタン、ラベル、メニュー、メッセージ等）
- **対象外**: バックエンドAPIメッセージ、ユーザー生成コンテンツ（デッキ名等）

### 1.3 対応言語と優先順位
| 優先度 | 言語 | ロケールコード | 状態 |
|--------|------|----------------|------|
| - | 日本語 | `ja` | 既存（現在のデフォルト） |
| 1 | 英語 | `en` | Phase 1で実装 |
| 2 | 韓国語 | `ko` | Phase 2で実装 |

---

## 2. 技術選定

### 2.1 採用ライブラリ
**typesafe-i18n**

選定理由:
- **完全な型安全性**: キー、パラメータ、複数形すべてがTypeScriptで型チェックされる
- **typoの即時検出**: 存在しないキーを参照するとコンパイルエラー
- **未翻訳キーの検出**: 型レベルで不足を検出可能
- **Vue 3対応**: Composition APIと統合
- **軽量**: バンドルサイズが小さい

### 2.2 インストール
```bash
cd frontend
npm install typesafe-i18n
```

### 2.3 翻訳運用方式
**Claude Code + 翻訳エージェント**

翻訳者を必要とせず、Claude Codeの翻訳エージェントを使用して機械翻訳を行う。

メリット:
- 外部サービス（Crowdin等）不要
- 追加コストなし
- TCG用語集をエージェントに組み込み可能
- 開発フローに統合（会話で完結）

---

## 3. ディレクトリ構造

```
frontend/
├── src/
│   ├── i18n/
│   │   ├── index.ts              # typesafe-i18n設定・初期化
│   │   ├── i18n-types.ts         # 自動生成される型定義
│   │   ├── i18n-util.ts          # 自動生成されるユーティリティ
│   │   ├── formatters.ts         # カスタムフォーマッター
│   │   ├── ja/
│   │   │   └── index.ts          # 日本語（ベース言語）
│   │   ├── en/
│   │   │   └── index.ts          # 英語
│   │   └── ko/
│   │       └── index.ts          # 韓国語
│   ├── composables/
│   │   └── useLocale.ts          # 言語切り替えロジック
│   └── ...
```

---

## 4. 翻訳ファイル設計

### 4.1 ファイル形式
TypeScript形式を採用。型安全性を最大限に活かす。

### 4.2 キー命名規則
```
{ページ/機能}.{コンポーネント}.{要素}
```

### 4.3 翻訳ファイル例

**ja/index.ts（日本語 - ベース言語）**
```typescript
import type { BaseTranslation } from '../i18n-types'

const ja = {
  common: {
    loading: '読み込み中...',
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
    edit: '編集',
    add: '追加',
    confirm: '確認',
    reset: 'リセット',
    update: '更新',
    error: 'エラーが発生しました',
    success: '成功しました',
    dataFetchError: 'データの取得に失敗しました',
    year: '年',
    month: '月',
  },
  nav: {
    dashboard: 'ダッシュボード',
    decks: 'デッキ管理',
    statistics: '統計',
    profile: 'プロフィール',
    admin: '管理者画面',
    logout: 'ログアウト',
  },
  auth: {
    login: {
      title: 'ログイン',
      email: 'メールアドレス',
      password: 'パスワード',
      submit: 'ログイン',
      forgotPassword: 'パスワードを忘れた場合',
      noAccount: 'アカウントをお持ちでない方は',
      register: '新規登録',
      termsAgreement: 'ログインすることで',
      termsLink: '利用規約',
      termsAgreementEnd: 'に同意したものとみなされます',
    },
    register: {
      title: '新規登録',
      subtitle: 'Create Your Account',
      username: 'ユーザー名',
      email: 'メールアドレス',
      password: 'パスワード',
      confirmPassword: 'パスワード（確認）',
      submit: '登録',
      hasAccount: 'すでにアカウントをお持ちの方は',
    },
    forgotPassword: {
      title: 'パスワードリセット',
    },
    streamerMode: {
      label: '配信者モード',
      hint: '入力内容を非表示にし、再ログイン時にメールアドレスを保持します',
    },
  },
  dashboard: {
    title: 'ダッシュボード',
  },
  decks: {
    title: 'デッキ管理',
    myDecks: '自分のデッキ',
    opponentDecks: '相手のデッキ',
    addDeck: '追加',
    deckName: 'デッキ名',
    noDeck: 'デッキが登録されていません',
    noDeckHint: '「追加」ボタンからデッキを登録しましょう',
    registeredDate: '登録日',
    archive: {
      title: '月次リセット機能',
      description: '新弾リリース時など、全デッキを一括アーカイブできます。アーカイブしても過去の対戦記録は保持されます。',
      button: '全デッキをアーカイブ',
    },
  },
  duels: {
    title: '対戦記録',
    addDuel: '対戦を記録',
    result: {
      win: '勝利',
      lose: '敗北',
      draw: '引き分け',
    },
    turnOrder: {
      label: '先攻/後攻',
      first: '先攻',
      second: '後攻',
    },
    coinToss: {
      win: '勝ち',
      lose: '負け',
    },
  },
  statistics: {
    title: '統計情報',
    filter: {
      title: '統計フィルター',
      period: '期間',
      periodAll: '全期間',
      periodRange: '範囲指定',
      rangeStart: '開始（試合目）',
      rangeEnd: '終了（試合目）',
      myDeck: '自分のデッキ',
    },
    gameMode: {
      rank: 'ランク',
      rate: 'レート',
      event: 'イベント',
      dc: 'DC',
    },
    matchup: '相性表',
    distribution: 'デッキ分布',
  },
  profile: {
    title: 'プロフィール編集',
    username: 'ユーザー名',
    email: 'メールアドレス',
    newPassword: '新しいパスワード (変更する場合のみ)',
    newPasswordHint: '8文字以上、72文字以下',
    confirmPassword: '新しいパスワードの確認',
    streamerMode: {
      title: '配信者モード',
      description: '有効にすると、アプリ内のメールアドレスが自動的にマスクされます。配信や録画時のプライバシー保護に便利です。',
      enable: '配信者モードを有効にする',
      emailMaskedHint: '配信者モードが有効なため、メールアドレスはマスクされています',
    },
    experimental: {
      title: '実験的機能',
      badge: 'テスト',
      screenAnalysis: {
        description: '画面解析機能を有効にすると、対戦記録作成時に画面キャプチャによる自動入力機能が使用できます。この機能は開発中のため、誤判定が発生する可能性があります。',
        enable: '画面解析機能を有効にする',
      },
    },
    accountDeletion: {
      title: 'アカウント削除',
      warning: 'この操作は元に戻せません。アカウントを削除すると、すべてのデッキと対戦履歴が完全に削除されます。',
      button: 'アカウントを削除する',
    },
    dataManagement: {
      title: 'データ管理',
      description: '全データをCSVファイルとしてエクスポート（バックアップ）したり、インポート（復元）したりできます。',
      export: 'エクスポート',
      import: 'インポート',
    },
  },
  obs: {
    title: 'OBSオーバーレイ',
    copyUrl: 'URLをコピー',
    preview: 'プレビュー',
    noToken: 'URLにトークンが含まれていません',
    ranks: {
      beginner: 'ビギナー',
      bronze: 'ブロンズ',
      silver: 'シルバー',
      gold: 'ゴールド',
      platinum: 'プラチナ',
      diamond: 'ダイヤ',
      master: 'マスター',
    },
  },
  validation: {
    required: '必須項目です',
    email: '有効なメールアドレスを入力してください',
    minLength: '{min}文字以上で入力してください',
    maxLength: '{max}文字以内で入力してください',
    passwordMatch: 'パスワードが一致しません',
    username: 'ユーザー名は3文字以上で入力してください',
  },
  help: {
    title: 'ヘルプ',
    bugReport: 'バグを報告',
    featureRequest: '機能をリクエスト',
    contact: 'お問い合わせ',
    twitter: 'Twitter/X',
    version: 'バージョン',
  },
} satisfies BaseTranslation

export default ja
```

**en/index.ts（英語）**
```typescript
import type { Translation } from '../i18n-types'

const en = {
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    confirm: 'Confirm',
    reset: 'Reset',
    update: 'Update',
    error: 'An error occurred',
    success: 'Success',
    dataFetchError: 'Failed to fetch data',
    year: 'Year',
    month: 'Month',
  },
  nav: {
    dashboard: 'Dashboard',
    decks: 'Decks',
    statistics: 'Statistics',
    profile: 'Profile',
    admin: 'Admin',
    logout: 'Logout',
  },
  // ... 以下同様
} satisfies Translation

export default en
```

---

## 5. TCG用語集

機械翻訳で不自然になりやすいTCG専門用語の統一訳語。翻訳エージェントはこの用語集に従う。

| 日本語 | 英語 | 韓国語 | 備考 |
|--------|------|--------|------|
| 先攻 | Going First | 선공 | "First Turn"ではなく"Going First" |
| 後攻 | Going Second | 후공 | "Second Turn"ではなく"Going Second" |
| コイントス | Coin Toss | 코인 토스 | |
| デッキ | Deck | 덱 | |
| 勝率 | Win Rate | 승률 | "Win Percentage"ではない |
| 勝利 | Win | 승리 | |
| 敗北 | Lose | 패배 | "Loss"ではなく"Lose" |
| 引き分け | Draw | 무승부 | |
| 相性表 | Matchup Chart | 상성표 | |
| 対戦 | Duel | 듀얼 | "Match"や"Game"ではなく"Duel" |
| ランク | Ranked | 랭크 | ゲームモード名 |
| レート | Rating | 레이트 | ゲームモード名 |
| 配信者モード | Streamer Mode | 스트리머 모드 | |
| OBSオーバーレイ | OBS Overlay | OBS 오버레이 | |
| ビギナー | Beginner | 비기너 | ランク名 |
| ブロンズ | Bronze | 브론즈 | ランク名 |
| シルバー | Silver | 실버 | ランク名 |
| ゴールド | Gold | 골드 | ランク名 |
| プラチナ | Platinum | 플래티넘 | ランク名 |
| ダイヤ | Diamond | 다이아몬드 | ランク名 |
| マスター | Master | 마스터 | ランク名 |

---

## 6. 実装設計

### 6.1 typesafe-i18n初期化（`src/i18n/index.ts`）

```typescript
import { initI18n } from './i18n-util'
import { loadLocale } from './i18n-util.sync'

export type SupportedLocale = 'ja' | 'en' | 'ko'

export const SUPPORTED_LOCALES: SupportedLocale[] = ['ja', 'en', 'ko']

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  ja: '日本語',
  en: 'English',
  ko: '한국어',
}

// ブラウザ言語から初期言語を決定
function getDefaultLocale(): SupportedLocale {
  const saved = localStorage.getItem('locale') as SupportedLocale
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    return saved
  }

  const browserLang = navigator.language.split('-')[0]
  if (SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) {
    return browserLang as SupportedLocale
  }

  return 'ja'
}

const defaultLocale = getDefaultLocale()
loadLocale(defaultLocale)

export const i18n = initI18n(defaultLocale)
```

### 6.2 言語切り替えComposable（`src/composables/useLocale.ts`）

```typescript
import { ref, computed } from 'vue'
import { setLocale, locale } from '@/i18n/i18n-util'
import { loadLocale } from '@/i18n/i18n-util.sync'
import { SUPPORTED_LOCALES, LOCALE_NAMES, type SupportedLocale } from '@/i18n'

export function useLocale() {
  const currentLocale = computed(() => locale.get() as SupportedLocale)

  async function changeLocale(newLocale: SupportedLocale) {
    await loadLocale(newLocale)
    setLocale(newLocale)
    localStorage.setItem('locale', newLocale)
    document.documentElement.lang = newLocale
  }

  return {
    currentLocale,
    supportedLocales: SUPPORTED_LOCALES,
    localeNames: LOCALE_NAMES,
    changeLocale,
  }
}
```

### 6.3 コンポーネントでの使用

```vue
<script setup lang="ts">
import { useI18nContext } from '@/i18n/i18n-vue'

const { LL } = useI18nContext()
</script>

<template>
  <div>
    <!-- 基本的な翻訳（型安全！） -->
    <h1>{{ LL.statistics.title() }}</h1>

    <!-- パラメータ付き翻訳（パラメータも型安全！） -->
    <p>{{ LL.validation.minLength({ min: 8 }) }}</p>
  </div>
</template>
```

### 6.4 型安全性のデモ

```typescript
// ✅ OK - 正しいキー
LL.statistics.title()

// ❌ コンパイルエラー - typo
LL.statistics.titl()

// ❌ コンパイルエラー - 存在しないキー
LL.statistics.nonExistent()

// ✅ OK - パラメータ付き
LL.validation.minLength({ min: 8 })

// ❌ コンパイルエラー - パラメータが足りない
LL.validation.minLength()

// ❌ コンパイルエラー - パラメータ名が間違っている
LL.validation.minLength({ minimum: 8 })
```

---

## 7. 翻訳運用フロー

### 7.1 Claude Code翻訳エージェントを使用

翻訳作業は `.claude/agents/i18n-translator.md` に定義された翻訳エージェントが行う。

**運用フロー:**

```
1. 開発者が ja/index.ts に日本語キーを追加
2. Claude Codeに「i18n翻訳して」と依頼
3. 翻訳エージェントが以下を実行:
   - ja/index.ts を読み取り
   - en/index.ts, ko/index.ts と比較
   - 不足キーを特定
   - TCG用語集に従って翻訳
   - 各ファイルを更新
4. TypeScriptの型チェックで整合性を確認
```

### 7.2 翻訳エージェントの呼び出し例

```
ユーザー: 「新しいi18nキーを追加したので翻訳して」

Claude Code:
  1. .claude/agents/i18n-translator.md のガイドラインを参照
  2. ja/index.ts を読み取り
  3. en/index.ts, ko/index.ts と比較
  4. 不足キーを翻訳して追加
  5. 完了報告
```

### 7.3 翻訳品質の担保

- **TCG用語集**: エージェントが用語集に従うことで一貫性を確保
- **型チェック**: typesafe-i18nの型システムでキーの整合性を保証
- **レビュー**: 翻訳結果は開発者がPR時に確認

---

## 8. 実装フェーズ

### Phase 1: 基盤構築と英語対応

**タスク**:
1. [ ] typesafe-i18nのインストールと初期設定
2. [ ] 翻訳ファイル（ja/index.ts, en/index.ts）の作成
3. [ ] main.tsへの統合
4. [ ] useLocale composableの作成
5. [ ] 言語切り替えUIの実装（AppBarに配置）
6. [ ] 既存コンポーネントの国際化対応
   - [ ] AppBar.vue（ナビゲーション、メニュー）
   - [ ] LoginView.vue, RegisterView.vue（認証画面）
   - [ ] DashboardView.vue（ダッシュボード関連）
   - [ ] DecksView.vue（デッキ管理）
   - [ ] StatisticsView.vue, StatisticsFilter.vue（統計情報）
   - [ ] ProfileView.vue（プロフィール、設定）
   - [ ] OBSOverlayView.vue（OBSオーバーレイ）
7. [ ] バリデーションメッセージの国際化
8. [ ] テストの実施

### Phase 2: 韓国語対応

**タスク**:
1. [ ] ko/index.ts の作成
2. [ ] 翻訳エージェントで翻訳実行
3. [ ] 翻訳レビュー
4. [ ] テストの実施

### Phase 3: 改善と最適化

**タスク**:
1. [ ] 遅延読み込みの検討（言語ファイルが大きくなった場合）
2. [ ] 不足している翻訳の警告システム（開発時のみ）

---

## 9. 考慮事項

### 9.1 OBSオーバーレイの言語

OBSオーバーレイはクエリパラメータで言語を指定できるようにする:
```
/obs-overlay?token=xxx&lang=en
```

### 9.2 SEOへの影響

SPAのためSEOへの影響は限定的だが、必要に応じて:
- `<html lang="xx">`属性を動的に更新
- metaタグの言語指定

### 9.3 RTL（右から左）言語

現在の対象言語（日本語、英語、韓国語）はすべてLTRのため、RTL対応は不要。

---

## 10. 参考リンク

- [typesafe-i18n公式ドキュメント](https://github.com/ivanhofer/typesafe-i18n)
- [typesafe-i18n Vue統合](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/adapter-vue)
