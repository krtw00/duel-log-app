# 10-decisions - アーキテクチャ決定記録（ADR）

このセクションでは、技術選択の理由と検討過程を記録します。

## ADR一覧

| ファイル | 決定内容 | ステータス |
|---------|---------|----------|
| [001-fastapi-backend.md](./001-fastapi-backend.md) | FastAPIをバックエンドフレームワークとして採用 | 採用済み |
| [002-supabase-auth.md](./002-supabase-auth.md) | Supabaseを認証・DBサービスとして採用 | 採用済み |
| [003-vuetify-ui.md](./003-vuetify-ui.md) | Vuetify 3をUIコンポーネントライブラリとして採用 | 採用済み |

## ADRとは

**Architecture Decision Record (ADR)** は、重要な設計・技術選択の理由を記録するドキュメントです。

### ADRに含める内容

1. **ステータス**: 提案中、採用済み、廃止済み
2. **コンテキスト**: 決定が必要になった背景・要件
3. **検討した選択肢**: 比較検討した代替案
4. **決定**: 選択した内容
5. **理由**: その選択をした理由
6. **結果**: メリット・デメリット・学び

## 新しいADRを追加する場合

1. `docs/10-decisions/NNN-title.md` を作成（NNNは連番）
2. 上記テンプレートに従って記述
3. このREADME.mdにリンクを追加

## 参考リンク

- [ADR GitHub Organization](https://adr.github.io/)
- [Michael Nygard's ADR article](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
