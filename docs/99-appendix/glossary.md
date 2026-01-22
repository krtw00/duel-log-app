---
depends_on: []
tags: [appendix, glossary]
ai_summary: "ドメイン・技術用語の定義集"
---

# 用語集

> Status: Active
> 最終更新: 2026-01-23

Duel Log App で使用される用語の定義

---

## 概要

| 項目 | 内容 |
|------|------|
| 目的 | 用語定義のSSoT |
| 対象読者 | 開発者 / AIエージェント |

---

## ドメイン用語

### マスターデュエル関連

| 用語 | 定義 |
|------|------|
| **Duel（デュエル）** | マスターデュエルの1回の対戦。勝敗、先後攻、使用デッキ等を記録 |
| **Deck（デッキ）** | ユーザーが使用するカードの束。名前と説明を持つ |
| **First Turn（先攻）** | 対戦で先にターンを開始するプレイヤー |
| **Second Turn（後攻）** | 対戦で後にターンを開始するプレイヤー |
| **Coin Toss（コイントス）** | 先後攻を決めるためのコイン投げ |
| **Matchup（相性）** | デッキ間の有利不利関係 |

### ゲームモード

| 用語 | 定義 |
|------|------|
| **RANK** | ランクマッチ（ティア制、シーズン制） |
| **RATE** | レーティングマッチ（数値レート制） |
| **EVENT** | イベントマッチ（期間限定） |
| **DC** | デュエリストカップ（特別イベント） |

### 統計用語

| 用語 | 定義 |
|------|------|
| **Win Rate（勝率）** | 勝利数 / 総対戦数 × 100% |
| **First Turn Win Rate** | 先攻時の勝率 |
| **Matchup Matrix** | デッキ間の相性を行列で表示 |
| **Streak（連勝/連敗）** | 連続した勝利または敗北 |

---

## 技術用語

### アーキテクチャ

| 用語 | 定義 |
|------|------|
| **SSoT** | Single Source of Truth。データの唯一の真実の情報源 |
| **RLS** | Row Level Security。PostgreSQLの行レベルアクセス制御 |
| **Edge Functions** | CDNエッジで実行されるサーバーレス関数 |
| **JIT Provisioning** | Just-In-Time。初回アクセス時にユーザーを自動作成 |

### フロントエンド

| 用語 | 定義 |
|------|------|
| **SPA** | Single Page Application。ページ遷移なしで動作するWebアプリ |
| **shadcn/ui** | Tailwind CSSベースのコンポーネントライブラリ（コピー&ペースト方式） |
| **TanStack Router** | 型安全なReactルーティングライブラリ |
| **TanStack Query** | サーバー状態管理ライブラリ。フェッチ・キャッシュ・同期を自動化 |
| **Zustand** | 軽量なReactクライアント状態管理ライブラリ |
| **Server State** | サーバーから取得したデータ（TanStack Queryで管理） |
| **Client State** | クライアントのみのUI状態（Zustandで管理） |
| **Query Invalidation** | キャッシュを無効化して再取得をトリガー |
| **Hooks** | Reactの状態・副作用を管理する関数 |

### バックエンド

| 用語 | 定義 |
|------|------|
| **Hono** | Edge対応の軽量TypeScript Webフレームワーク |
| **Drizzle ORM** | 型安全なTypeScript ORM。スキーマ定義とクエリビルダーを提供 |
| **Middleware** | リクエスト処理の前後に実行される共通処理 |
| **Service Layer** | ビジネスロジックを実装する層 |
| **ORM** | Object-Relational Mapping。DBをオブジェクトとして操作 |
| **Schema** | データの型定義（Zod, Drizzle） |
| **Biome** | Lint + Format統合ツール。ESLint + Prettierの代替 |

### 認証

| 用語 | 定義 |
|------|------|
| **JWT** | JSON Web Token。認証に使用されるトークン形式 |
| **OAuth** | 第三者サービスを使った認証プロトコル |
| **HttpOnly Cookie** | JSからアクセスできないCookie（XSS対策） |

---

## 機能用語

### 画面録画分析

| 用語 | 定義 |
|------|------|
| **ROI** | Region of Interest。分析対象の画面領域 |
| **FSM** | Finite State Machine。状態遷移を管理する仕組み |
| **OCR** | Optical Character Recognition。画像からテキストを認識（Tesseract.js） |
| **HSV色解析** | 色ベースのヒューリスティック判定（勝敗画面の王冠検出） |

### 配信者機能

| 用語 | 定義 |
|------|------|
| **Streamer Popup** | 配信者向けの統計表示ポップアップ |
| **Chroma Key** | クロマキー合成用の背景色設定 |
| **Session Stats** | 配信開始からの統計 |
| **Streamer Mode** | プライバシー保護のためのマスク表示 |

### 共有機能

| 用語 | 定義 |
|------|------|
| **Share Token** | 統計共有用の一意なURL-safeトークン（22文字） |
| **Shared Statistics** | URL経由で閲覧可能な統計情報 |

---

## 略語

| 略語 | 正式名称 | 説明 |
|------|---------|------|
| **ADR** | Architecture Decision Record | 設計決定の記録 |
| **API** | Application Programming Interface | システム間のインターフェース |
| **CI/CD** | Continuous Integration/Deployment | 継続的統合・デプロイ |
| **CORS** | Cross-Origin Resource Sharing | クロスオリジンリソース共有 |
| **CRUD** | Create, Read, Update, Delete | 基本的なデータ操作 |
| **JWT** | JSON Web Token | 認証トークン形式 |
| **ORM** | Object-Relational Mapping | オブジェクト関係マッピング |
| **PR** | Pull Request | コード変更のレビュー依頼 |
| **RLS** | Row Level Security | 行レベルセキュリティ |
| **SPA** | Single Page Application | シングルページアプリ |
| **SSoT** | Single Source of Truth | 唯一の真実の情報源 |
| **MD** | Master Duel | 遊戯王マスターデュエル |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [プロジェクト概要](../01-overview/summary.md) | プロジェクト概要 |
