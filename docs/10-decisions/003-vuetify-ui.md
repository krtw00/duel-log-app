# ADR 003: Vuetify 3をUIコンポーネントライブラリとして採用

## ステータス

**採用済み** (2024-01)

## コンテキスト

Duel Log AppのフロントエンドUIコンポーネントライブラリを選定する必要がある。

### 要件

- Vue 3 Composition APIとの互換性
- Material Designベースのコンポーネント
- ダークモード対応
- レスポンシブデザイン
- テーブル、フォーム、ダイアログ等の豊富なコンポーネント

### 検討した選択肢

1. **Vuetify 3** - Material Designコンポーネントライブラリ
2. **Quasar** - フルスタックVueフレームワーク
3. **PrimeVue** - 豊富なUIコンポーネント
4. **Tailwind CSS + Headless UI** - ユーティリティファースト

## 決定

**Vuetify 3**を採用する。

## 理由

### Vuetify 3の利点

| 観点 | Vuetify 3 |
|------|-----------|
| **コンポーネント数** | 80+ のコンポーネント |
| **Material Design** | Google Material Design 3準拠 |
| **ダークモード** | テーマシステムで簡単切り替え |
| **TypeScript** | 完全なTypeScriptサポート |
| **ドキュメント** | 充実した日本語ドキュメント |

### 他の選択肢を選ばなかった理由

| ライブラリ | 見送り理由 |
|-----------|-----------|
| Quasar | 学習曲線が急、独自の概念が多い |
| PrimeVue | デザインの一貫性がVuetifyより劣る |
| Tailwind + Headless UI | コンポーネント実装コストが高い |

## 結果

### メリット

- 統一されたMaterial Designで一貫したUI
- v-data-table等の高機能コンポーネントで開発効率向上
- ダークモード/ライトモードの切り替えが容易

### デメリット

- バンドルサイズが大きい（Tree shakingで軽減）
- Vuetify独自のスタイル調整が必要な場合がある

### 使用している主要コンポーネント

| コンポーネント | 用途 |
|---------------|------|
| v-data-table | 対戦履歴一覧、デッキ一覧 |
| v-card | カード形式の情報表示 |
| v-dialog | モーダルダイアログ |
| v-form + v-text-field | フォーム入力 |
| v-btn | ボタン |
| v-select | セレクトボックス |
| v-tabs | タブ切り替え |
| v-app-bar | ナビゲーションバー |

## 関連ドキュメント

- @../02-architecture/frontend-architecture.md

## 参考リンク

- [Vuetify 3公式ドキュメント](https://vuetifyjs.com/)
- [Material Design 3](https://m3.material.io/)
