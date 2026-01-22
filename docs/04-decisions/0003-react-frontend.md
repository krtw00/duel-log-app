---
depends_on: []
tags: [adr, frontend, react]
ai_summary: "React + shadcn/ui採用の決定記録"
---

# ADR 0003: React/shadcn-uiをフロントエンドとして採用

> Status: Active
> 最終更新: 2026-01-23

## ステータス

**採用済み** (2025-01)

## コンテキスト

Duel Log AppのフロントエンドUIフレームワークとコンポーネントライブラリを選定する必要がある。

### 要件

- TypeScriptネイティブ
- 豊富なUIコンポーネント
- ダークモード対応
- レスポンシブデザイン
- AI支援（コード生成）との相性

### 検討した選択肢

1. **React + shadcn/ui** - コンポーネントライブラリ + TanStack
2. **Vue + Vuetify** - Material Designコンポーネント
3. **React + MUI** - Material UI for React

## 決定

**React + shadcn/ui + TanStack**を採用する。

## 理由

### React + shadcn/uiの利点

| 観点 | React + shadcn/ui |
|------|-------------------|
| **AI支援** | AIコード生成の品質が最高（学習データ量最大） |
| **エコシステム** | React エコシステムが最大規模 |
| **TypeScript** | TSXが標準、型推論が強力 |
| **カスタマイズ** | shadcn/uiはコピー方式で完全制御可能 |
| **状態管理** | TanStack Query + Zustandで宣言的 |

### 他の選択肢を選ばなかった理由

| フレームワーク | 見送り理由 |
|--------------|-----------|
| Vue + Vuetify | AIコード生成品質がReact未満、エコシステムが小さい |
| React + MUI | バンドルサイズが大きい、スタイルのオーバーライドが煩雑 |

## 結果

### メリット

- AI支援による開発速度向上（Copilot、Claude等との相性）
- TanStack Queryでサーバー状態管理が宣言的
- shadcn/uiのコンポーネントは所有コードとして完全カスタマイズ可能

### デメリット

- shadcn/uiはコピー方式のためアップデートが手動
- Reactの学習曲線（Hooks、レンダリング最適化）

## 関連ドキュメント

- [フロントエンド構成](../02-architecture/structure.md)
- [SSoTガイド](../03-details/flows.md)
- [Hono バックエンド](./0002-hono-backend.md)

## 参考リンク

- [React公式ドキュメント](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs/)
