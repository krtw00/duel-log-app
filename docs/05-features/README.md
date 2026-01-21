# 機能設計

各機能の設計ドキュメント。

---

## 実装済み機能

| ファイル | 機能 | 状態 |
|---------|------|------|
| @./sharing-feature-design.md | 統計情報共有 | ✅ 完全実装 |
| @./archive-deck-merge-design.md | デッキアーカイブ・マージ | ✅ 完全実装 |
| @./admin-panel-design.md | 管理者画面 | ⚠️ 部分実装 |
| @./screen-recording-analysis.md | 画面録画分析 | ⚠️ 部分実装 |
| @./obs-overlay-design.md | OBSオーバーレイ | ⛔ 廃止予定（配信者ポップアップに移行） |

---

## 計画中機能（未実装）

| ファイル | 機能 | 状態 |
|---------|------|------|
| @./opening-hand-analysis-design.md | 初手カード勝率分析 | ❌ 未実装 |
| @./feedback-and-contact.md | フィードバック機能 | ❌ 未実装 |
| @./internationalization.md | 多言語対応（i18n） | ❌ 未実装 |
| @./mobile-support.md | モバイル対応 | ❌ 未実装 |

---

## 設計書なしの実装済み機能

| 機能 | 説明 |
|------|------|
| CSVインポート/エクスポート | データのバックアップ・復元 |
| 配信者モード | プライバシー保護 |
| 配信者ポップアップ | OBSブラウザソース用統計表示（旧OBSオーバーレイの後継） |

---

## 対象読者

| 状況 | 推奨 |
|------|------|
| 新機能実装 | 該当機能の設計書を参照 |
| 機能拡張 | 既存設計書 + @../03-core-concepts/design-principles.md |
| 仕様確認 | 該当機能の設計書 |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| @../03-core-concepts/design-principles.md | 設計原則 |
| @../06-interfaces/api-reference.md | API仕様 |
| @../02-architecture/ | システム構成 |
