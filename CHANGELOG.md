## [3.0.3](https://github.com/krtw00/duel-log-app/compare/v3.0.2...v3.0.3) (2026-01-14)


### 🐛 Bug Fixes

* **lint:** Code Scanning警告を修正 ([2543db5](https://github.com/krtw00/duel-log-app/commit/2543db5e3a818bc880d966b3b98badd63cca4417))

## [3.0.2](https://github.com/krtw00/duel-log-app/compare/v3.0.1...v3.0.2) (2026-01-14)


### 🐛 Bug Fixes

* **security:** debugログから機密情報の可能性がある出力を削除 ([5812c2e](https://github.com/krtw00/duel-log-app/commit/5812c2e1b62ce5a4e09b71e5be8293179d5bc32a))

## [3.0.1](https://github.com/krtw00/duel-log-app/compare/v3.0.0...v3.0.1) (2026-01-13)


### 🐛 Bug Fixes

* **frontend:** upgrade vitest to v4 and fix build config ([c6a8b24](https://github.com/krtw00/duel-log-app/commit/c6a8b24df92358f21502cb0c76a7296e07144d5e))

## [3.0.0](https://github.com/krtw00/duel-log-app/compare/v2.0.25...v3.0.0) (2026-01-13)


### ⚠ BREAKING CHANGES

* **auth:** Remove password reset endpoints from backend

- Remove /auth/forgot-password and /auth/reset-password endpoints
  (now handled by Supabase Auth in frontend)
- Remove /auth/login endpoint (Supabase Auth handles authentication)
- Keep /auth/logout for legacy cookie clearing
- Keep /auth/obs-token for OBS overlay authentication
- Remove PasswordResetToken model and migration to drop table
- Remove Resend email service dependency
- Remove mail-related settings from config
- Update tests to reflect removed functionality

Frontend already uses Supabase Auth for password reset flow.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>

### ✨ Features

* **backend:** add Supabase Auth support ([f8f71f5](https://github.com/krtw00/duel-log-app/commit/f8f71f5f214ae46309a06b2857531be967673c35))
* **frontend:** add streamer popup window feature ([82c3e4e](https://github.com/krtw00/duel-log-app/commit/82c3e4eb771dca2a0cde22e0af80ef185e5c4658))


### 🐛 Bug Fixes

* **types:** auth user型にenable_screen_analysisを追加 ([8c88d2a](https://github.com/krtw00/duel-log-app/commit/8c88d2a7f58d9c69060bd56e22f9bac3bea01ecc))


### ♻️ Code Refactoring

* **auth:** migrate from Resend to Supabase Auth ([560d8a0](https://github.com/krtw00/duel-log-app/commit/560d8a0e579f62f5a5554b93d80bd60d3013c549))

## [2.0.25](https://github.com/krtw00/duel-log-app/compare/v2.0.24...v2.0.25) (2026-01-13)


### 🐛 Bug Fixes

* **lint:** resolve ruff linting errors ([c4c9c40](https://github.com/krtw00/duel-log-app/commit/c4c9c40278efe4d89ee89ff4ca6e57f94bc79416))

## [2.0.24](https://github.com/krtw00/duel-log-app/compare/v2.0.23...v2.0.24) (2026-01-13)


### 🐛 Bug Fixes

* **auth:** resolve black screen issue on OAuth callback and login ([54e9708](https://github.com/krtw00/duel-log-app/commit/54e97081ffb796e39850175946797a3c5935e6b3))

## [2.0.23](https://github.com/krtw00/duel-log-app/compare/v2.0.22...v2.0.23) (2026-01-13)


### 🐛 Bug Fixes

* **auth:** handle PKCE code exchange in OAuth callback ([d13d091](https://github.com/krtw00/duel-log-app/commit/d13d091ec2a6a4fdb4329e281c07ee3cd9a5c517))

## [2.0.22](https://github.com/krtw00/duel-log-app/compare/v2.0.21...v2.0.22) (2026-01-13)


### 🐛 Bug Fixes

* **auth:** correct JWKS endpoint URL for Supabase ([4c88fce](https://github.com/krtw00/duel-log-app/commit/4c88fce48d778ceafe50301a5120d5a51b81492b))

## [2.0.21](https://github.com/krtw00/duel-log-app/compare/v2.0.20...v2.0.21) (2026-01-13)


### 🐛 Bug Fixes

* **auth:** support ES256 algorithm for Supabase JWT verification ([ec64b27](https://github.com/krtw00/duel-log-app/commit/ec64b275d53460c24563db5b855f24cd1479c705))

## [2.0.20](https://github.com/krtw00/duel-log-app/compare/v2.0.19...v2.0.20) (2026-01-13)


### 🐛 Bug Fixes

* correct url normalization regex ([f96a746](https://github.com/krtw00/duel-log-app/commit/f96a74639309058eb0ef6714048f83fbb2d91c73))

## [2.0.19](https://github.com/krtw00/duel-log-app/compare/v2.0.18...v2.0.19) (2026-01-13)


### 🐛 Bug Fixes

* use obs token for overlay ([a2c0b95](https://github.com/krtw00/duel-log-app/commit/a2c0b9526fd8c151808cb94c576cc628b4201ce6))

## [2.0.18](https://github.com/krtw00/duel-log-app/compare/v2.0.17...v2.0.18) (2026-01-13)


### 🐛 Bug Fixes

* improve supabase token verification diagnostics ([a5fbee7](https://github.com/krtw00/duel-log-app/commit/a5fbee712281860707ec7c03ae144852d19af733))

## [2.0.17](https://github.com/krtw00/duel-log-app/compare/v2.0.16...v2.0.17) (2026-01-13)


### 🐛 Bug Fixes

* correct supabase jwt verification ([0168776](https://github.com/krtw00/duel-log-app/commit/01687763fc00a28269a480c8fdde99969cf7ac5d))

## [2.0.16](https://github.com/krtw00/duel-log-app/compare/v2.0.15...v2.0.16) (2026-01-13)


### 🐛 Bug Fixes

* **auth:** switch to PyJWT for Supabase token verification ([05facec](https://github.com/krtw00/duel-log-app/commit/05facecedae1f36662550997a987ffe59594c3b0))

## [2.0.15](https://github.com/krtw00/duel-log-app/compare/v2.0.14...v2.0.15) (2026-01-13)


### 🐛 Bug Fixes

* **auth:** base64-decode Supabase JWT secret before verification ([c81be77](https://github.com/krtw00/duel-log-app/commit/c81be7746ddf05f34d9df492b551e8523e07af31))

## [2.0.14](https://github.com/krtw00/duel-log-app/compare/v2.0.13...v2.0.14) (2026-01-13)


### 🐛 Bug Fixes

* **auth:** add JIT Provisioning for Supabase users ([132917d](https://github.com/krtw00/duel-log-app/commit/132917dd2f025214a4bdafd6ec34f3780104feff))

## [2.0.13](https://github.com/krtw00/duel-log-app/compare/v2.0.12...v2.0.13) (2026-01-13)


### 🐛 Bug Fixes

* **deps:** add missing resend package for email functionality ([230553d](https://github.com/krtw00/duel-log-app/commit/230553de853e05e89d9100e25ca2061fa7877209))

## [2.0.12](https://github.com/krtw00/duel-log-app/compare/v2.0.11...v2.0.12) (2026-01-13)


### 🐛 Bug Fixes

* **lint:** remove extraneous f-string prefix ([0e4d30d](https://github.com/krtw00/duel-log-app/commit/0e4d30dc23e0c3cd38ae638401aa1f7db3427788))

## [2.0.11](https://github.com/krtw00/duel-log-app/compare/v2.0.10...v2.0.11) (2026-01-13)


### 🐛 Bug Fixes

* **deploy:** always check schema state and stamp to head when current ([f67e406](https://github.com/krtw00/duel-log-app/commit/f67e406559890e14eddb8a01d1aaa3de637b0923))

## [2.0.10](https://github.com/krtw00/duel-log-app/compare/v2.0.9...v2.0.10) (2026-01-13)


### 🐛 Bug Fixes

* **docker:** improve Docker Integration Tests reliability ([1d5163c](https://github.com/krtw00/duel-log-app/commit/1d5163c58286e8117c95cb47d5cf39089bccb9f6))

## [2.0.9](https://github.com/krtw00/duel-log-app/compare/v2.0.8...v2.0.9) (2026-01-13)


### 🐛 Bug Fixes

* **ci:** add Supabase env vars for backend tests ([93bc0ff](https://github.com/krtw00/duel-log-app/commit/93bc0ffa52e99249281855cf1ee6553b1b150f2a))

## [2.0.8](https://github.com/krtw00/duel-log-app/compare/v2.0.7...v2.0.8) (2026-01-13)


### 🐛 Bug Fixes

* **lint:** remove unused import and fix import order ([78e95ec](https://github.com/krtw00/duel-log-app/commit/78e95ec17a8ac46e236209859c7aae711a77f77f))

## [2.0.7](https://github.com/krtw00/duel-log-app/compare/v2.0.6...v2.0.7) (2026-01-13)


### 🐛 Bug Fixes

* **ci:** use requirements-dev.txt and add Supabase env vars ([80aec5f](https://github.com/krtw00/duel-log-app/commit/80aec5f2d9c1a2c1394b9f66f52d82aac9abea3f))

## [2.0.6](https://github.com/krtw00/duel-log-app/compare/v2.0.5...v2.0.6) (2026-01-13)


### 🐛 Bug Fixes

* **alembic:** detect schema state to correctly stamp merge migration ([24c4114](https://github.com/krtw00/duel-log-app/commit/24c41141710aedc6e9f90eef9bbccb1f437bd42b))

## [2.0.5](https://github.com/krtw00/duel-log-app/compare/v2.0.4...v2.0.5) (2026-01-13)


### 🐛 Bug Fixes

* **alembic:** create merge migration to resolve multiple heads ([331e3bf](https://github.com/krtw00/duel-log-app/commit/331e3bf71773d05ab45332482176cb8a5f2d6ca6))


### ♻️ Code Refactoring

* **start.py:** use 'head' instead of hardcoded revision ([c5a5963](https://github.com/krtw00/duel-log-app/commit/c5a59632303f4e38dc927b9d2f3180b04c11eefd))

## [2.0.4](https://github.com/krtw00/duel-log-app/compare/v2.0.3...v2.0.4) (2026-01-13)


### 🐛 Bug Fixes

* **deploy:** resolve alembic multiple heads and optimize build ([0ee9adc](https://github.com/krtw00/duel-log-app/commit/0ee9adca47af90db6b1ae00bf50717bc708b099f))

## [2.0.3](https://github.com/krtw00/duel-log-app/compare/v2.0.2...v2.0.3) (2026-01-13)


### 🐛 Bug Fixes

* **backend:** stamp database to head when tables exist but no version recorded ([025936a](https://github.com/krtw00/duel-log-app/commit/025936a9adc0b567b4e637f2a093aa95f8d99b15))


### 📝 Documentation

* add Supabase OAuth setup guide and frontend .gitignore ([96e39e2](https://github.com/krtw00/duel-log-app/commit/96e39e2edd5ece3cbaa66033c824ada0bfbf1a4f))

## [2.0.2](https://github.com/krtw00/duel-log-app/compare/v2.0.1...v2.0.2) (2026-01-13)


### ♻️ Code Refactoring

* **config:** メール関連の環境変数をオプションに変更 ([c24ccbe](https://github.com/krtw00/duel-log-app/commit/c24ccbece21b513d389167e11595fe97c6077589))

## [2.0.1](https://github.com/krtw00/duel-log-app/compare/v2.0.0...v2.0.1) (2026-01-13)


### 📝 Documentation

* Supabase移行後のデプロイメント設定ドキュメントを追加 ([5a387dc](https://github.com/krtw00/duel-log-app/commit/5a387dc1cca5cf98273168201910385859ce1ebd))

## [2.0.0](https://github.com/krtw00/duel-log-app/compare/v1.10.1...v2.0.0) (2026-01-13)


### ⚠ BREAKING CHANGES

* **auth:** User.id is now UUID string instead of integer

## Frontend Changes
- Add @supabase/supabase-js SDK
- Create Supabase client configuration (src/lib/supabase.ts)
- Update auth store to use Supabase Auth (signInWithPassword, signUp, etc.)
- Add OAuth login support (Google, Discord)
- Create AuthCallbackView for OAuth redirect handling
- Update RegisterView, LoginView, ForgotPasswordView, ResetPasswordView
- Update API service to use Supabase access tokens

## Type Changes
- User.id: number → string (UUID)
- Deck.user_id: number → string
- Duel.user_id: number → string

## Test Updates
- Update auth.test.ts to mock Supabase client
- Update test fixtures with UUID strings for user_id
- Configure vitest with Supabase environment variables

## Migration Scripts
- Add scripts for migrating data from Neon to Supabase
- Include migration mapping for ID conversions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>

### ✨ Features

* **auth:** フロントエンド認証をSupabase Authへ移行 ([66e057a](https://github.com/krtw00/duel-log-app/commit/66e057a3d274eee2707dbd4dd6937c8a621eb6c7))
* **backend:** add Supabase Auth support ([16e013b](https://github.com/krtw00/duel-log-app/commit/16e013bfed801e4f2d2ca954ffed951f80b6fa7d))


### 🐛 Bug Fixes

* **frontend:** prevent white screen when Supabase env vars missing ([8bf5347](https://github.com/krtw00/duel-log-app/commit/8bf5347f959e1503e6e0fd5684c286530ea00cf1))
* **types:** auth user型にenable_screen_analysisを追加 ([5dfc5e1](https://github.com/krtw00/duel-log-app/commit/5dfc5e1a5dd26b88fa4f8ff98b35bf614169a379))
* **types:** 認証ストアのユーザー型にenable_screen_analysisを追加 ([4b22ec1](https://github.com/krtw00/duel-log-app/commit/4b22ec126309698c77cca69264287378cca611db))


### 📝 Documentation

* i18n とフィードバック機能の設計ドキュメントを追加 ([7f8e1b9](https://github.com/krtw00/duel-log-app/commit/7f8e1b9960344d930b26686e4824f8cf1013370f))

## 1.0.0 (2026-01-13)


### ⚠ BREAKING CHANGES

* **auth:** User.id is now UUID string instead of integer

## Frontend Changes
- Add @supabase/supabase-js SDK
- Create Supabase client configuration (src/lib/supabase.ts)
- Update auth store to use Supabase Auth (signInWithPassword, signUp, etc.)
- Add OAuth login support (Google, Discord)
- Create AuthCallbackView for OAuth redirect handling
- Update RegisterView, LoginView, ForgotPasswordView, ResetPasswordView
- Update API service to use Supabase access tokens

## Type Changes
- User.id: number → string (UUID)
- Deck.user_id: number → string
- Duel.user_id: number → string

## Test Updates
- Update auth.test.ts to mock Supabase client
- Update test fixtures with UUID strings for user_id
- Configure vitest with Supabase environment variables

## Migration Scripts
- Add scripts for migrating data from Neon to Supabase
- Include migration mapping for ID conversions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
* **ci:** CI/CD pipeline now requires additional secrets:
- CODECOV_TOKEN (optional): For code coverage reports
- PROJECT_TOKEN: Already configured for issue tracking

### ✨ Features

* admin GUI with user-based 認証を追加 ([8ac38fd](https://github.com/krtw00/duel-log-app/commit/8ac38fdb780a5613187c8c872666d736a40f35ca))
* **admin:** Vuetify-based 管理画面 UIを実装 ([dd474ad](https://github.com/krtw00/duel-log-app/commit/dd474adcbf91efd79c0e821df86fb547f74b5a5d))
* **admin:** ユーザー管理フロントエンドを実装 ([941c44a](https://github.com/krtw00/duel-log-app/commit/941c44a3fb163e7f2679628c210b3535adb7a74c))
* **auth:** フロントエンド認証をSupabase Authへ移行 ([66e057a](https://github.com/krtw00/duel-log-app/commit/66e057a3d274eee2707dbd4dd6937c8a621eb6c7))
* auto set turn order from coin ([b31465a](https://github.com/krtw00/duel-log-app/commit/b31465a873f5e9ae3d303fd0f8b7a8e6b460ce7f))
* **backend,frontend:** レート/DC値の小数点対応とOBS表示追加 ([d673b27](https://github.com/krtw00/duel-log-app/commit/d673b2708d8215c939e62ad5ef4e86066e6c8194))
* **backend:** archived decks用のauto-mergeを実装 ([79700af](https://github.com/krtw00/duel-log-app/commit/79700afc38656303ba317d543fc4d69dd96f424a))
* **backend:** merge duplicate archived decksにスクリプトを追加 ([b355a7c](https://github.com/krtw00/duel-log-app/commit/b355a7c84449bad6035e2255c68e169bb79d9e23))
* **backend:** Return すべてのgame モード statistics in shared エンドポイント ([afaf2ca](https://github.com/krtw00/duel-log-app/commit/afaf2ca229c968417454c143241b467a0afa72c9))
* **backend:** 命名規則統一化 - Phase 2完了 ([fccbcb0](https://github.com/krtw00/duel-log-app/commit/fccbcb0a2def22aa8c5e06de18a534484bae8529))
* **backend:** 管理画面用のユーザー管理 APIを実装 ([0b92ece](https://github.com/krtw00/duel-log-app/commit/0b92ecee1fe087b4340977b2d700b1694a72ff4a))
* **ci:** CodeQLセキュリティ分析を日本語化 ([ef0e591](https://github.com/krtw00/duel-log-app/commit/ef0e59105fc585c7afe8738341592424f88fbfce))
* **ci:** comprehensive CI/CD pipeline enhancementsを追加 ([fbc6570](https://github.com/krtw00/duel-log-app/commit/fbc6570a153c6a20c49bc4dda1ed53d2ce4bbd79))
* **ci:** Localize PR auto-review messages to Japanese ([97483b7](https://github.com/krtw00/duel-log-app/commit/97483b77278114204fb4cd9bbe4824aabd7693ef))
* coin default トグル near add デュエル ([07ab507](https://github.com/krtw00/duel-log-app/commit/07ab50705c55242d5521bc009ad03e137cb4f4c0))
* colorize matchup win rates ([11e6fe2](https://github.com/krtw00/duel-log-app/commit/11e6fe2be8b4118966846dbfbd81f55101b6c7a4))
* colorize matchup win rates in statistics view ([ed35460](https://github.com/krtw00/duel-log-app/commit/ed35460e4d39c5dc939eba96db48b61fcac8e34a))
* colorize my デッキ win rates ([4ac7322](https://github.com/krtw00/duel-log-app/commit/4ac7322e1e02fdffc8d63566890941d5db66a0c7))
* **docs:** フェーズ2の可読性改善を完了 ([f748d10](https://github.com/krtw00/duel-log-app/commit/f748d1037813c84e3a4c87a117a37e047b76b96f))
* **docs:** フェーズ3の可読性改善を完了 ([fb6c349](https://github.com/krtw00/duel-log-app/commit/fb6c3499583501ea592d10f4c69def082136a668))
* **e2e:** comprehensive Playwright E2E テスト suiteを追加 ([16d9eb1](https://github.com/krtw00/duel-log-app/commit/16d9eb12f42f0e2fff806ed4245dd33616ff4df2))
* **frontend:** Align SharedStatisticsView with Dashboard と Statistics views ([b02c1c7](https://github.com/krtw00/duel-log-app/commit/b02c1c7e41786632494713f2ab6e1aa0bae19193))
* **frontend:** Align SharedStatisticsView with Dashboard と Statistics views ([69b43f9](https://github.com/krtw00/duel-log-app/commit/69b43f929929fe37a0ca50ca22d2756835431ad9))
* **frontend:** OBSオーバーレイにライト/ダークモードテーマ切り替え機能を追加 ([524603b](https://github.com/krtw00/duel-log-app/commit/524603b988d3d9907092536e12c283f19eaf044a))
* **frontend:** OBSオーバーレイにレート/DC表示項目を追加 ([200eee0](https://github.com/krtw00/duel-log-app/commit/200eee0a49346adfa8891bb13d37fb07bf92f2a9))
* **frontend:** OBS設定のゲームモードを必須化し初期値をランクに設定 ([58bca0d](https://github.com/krtw00/duel-log-app/commit/58bca0d912e73f941a11f50d385cf2f6d39e17da))
* **frontend:** persist new decks from edit dialog ([935b6e3](https://github.com/krtw00/duel-log-app/commit/935b6e3d8a227d294400427373a5677aa43aae0c))
* **frontend:** persist new decks from edit dialog ([fb5c713](https://github.com/krtw00/duel-log-app/commit/fb5c7139636d6a940923148dbe2ba46f33e76ddb))
* **frontend:** unify snake_case naming convention ([ed06961](https://github.com/krtw00/duel-log-app/commit/ed06961129628b081f65b36a7ea6872129a87367))
* **frontend:** Unify statistics filter across すべてのviews ([a018c10](https://github.com/krtw00/duel-log-app/commit/a018c1074dc6a4e6e5d2ed0f479649823dd8d26f))
* **frontend:** デュエル entry 画面解析を追加 ([78f280e](https://github.com/krtw00/duel-log-app/commit/78f280eddcf45688c6d505f2cbed1d310a280bb9))
* **frontend:** ログアウト後にログイン画面へ遷移するように修正 ([79b4dc3](https://github.com/krtw00/duel-log-app/commit/79b4dc31e9cbe5c53e0dfda0c851143bdeb4f738))
* **frontend:** 対戦記録の命名規則を改善 ([6e55173](https://github.com/krtw00/duel-log-app/commit/6e55173685edb15e07eb873e9812f3e86fa53b06))
* **frontend:** 画面解析機能向けに説明を追加 ([15785c6](https://github.com/krtw00/duel-log-app/commit/15785c66a15d0bb5a41bbe6d6aff64e58146ed12))
* **frontend:** 画面解析機能向けに説明を追加 ([9fef6c1](https://github.com/krtw00/duel-log-app/commit/9fef6c12cddfd95f262d2536ede28988ef515204))
* **github:** 日本語バグトラッキングシステムを追加 ([fe0ec20](https://github.com/krtw00/duel-log-app/commit/fe0ec20acf23e0fb1352aa3bd3e935baf3ff9629))
* improve win-rate color coding ([d2f22f6](https://github.com/krtw00/duel-log-app/commit/d2f22f6d23726858e69bcad50efc11e2372d0964))
* invert win-rate colors (advantage=blue) ([6c21d46](https://github.com/krtw00/duel-log-app/commit/6c21d462e9e27749ba5626ea40a0d978c76b7d83))
* keep statistics tab across navigation ([8e7527f](https://github.com/krtw00/duel-log-app/commit/8e7527f3895f554965f6ce72f17d4dc62d6a3189))
* **ml:** TensorFlow.js image classification modelsを追加 ([b611820](https://github.com/krtw00/duel-log-app/commit/b611820ddf997b0b452688de7ea65601f4cbd9cc))
* OBS連携機能のパーセンテージ表示を修正 ([af028be](https://github.com/krtw00/duel-log-app/commit/af028bec8219ca69f4203e56781e28a64806d008))
* **screen-analysis:** OKボタン検出を結果ロック機構に置き換え ([47a4c7e](https://github.com/krtw00/duel-log-app/commit/47a4c7e96bff468280d267524289c12bf2a5c954))
* **screen-analysis:** TensorFlow.js image classification プロトタイプを追加 ([c39840a](https://github.com/krtw00/duel-log-app/commit/c39840a34856d382dee9cf84ad7ceb527fe53ba2))
* **screen-analysis:** turnChoice と okButtonにMIPMAP approachを適用 ([4fc128a](https://github.com/krtw00/duel-log-app/commit/4fc128a1cb74a6aabf0c8d7f091187783d108d1a))
* **screen-analysis:** variable 画面解像度 (1280x720-3840x2160)に対応 ([d92622b](https://github.com/krtw00/duel-log-app/commit/d92622b7e895d3ff6111367b8243cfcd1506330c))
* **screen-analysis:** テンプレートマッチングのすべてのゲーム解像度に対応 ([978571a](https://github.com/krtw00/duel-log-app/commit/978571a84b9b025cc2ef443e5863682d6a2d9b02))
* **screen-analysis:** マルチ解像度テンプレートマッチング用のMIPMAP approachを実装 ([f1b0d86](https://github.com/krtw00/duel-log-app/commit/f1b0d86470b355e149c462b00f6f8b544cc9b177))
* **screen-analysis:** 低解像度向けにGaussian blur と dynamic sigma scalingを追加 ([aaaa7b1](https://github.com/krtw00/duel-log-app/commit/aaaa7b1b8ee1b4873de9b0f30db874cdbc054002))
* **settings:** 画面解析機能のトグルを追加 ([199ceff](https://github.com/krtw00/duel-log-app/commit/199ceff220ddea31a781874a1e8b87e539af9513))
* shared statisticsにapp logo linkを追加 ([26c5a69](https://github.com/krtw00/duel-log-app/commit/26c5a698a26f0dda62585cee31eb2d89abb14ac6))
* shared statisticsにapp logo linkを追加 ([d56092c](https://github.com/krtw00/duel-log-app/commit/d56092cb7f9c12a6e274bc5b4d355f117815d940))
* **shared:** main app from shared statistics page ([#162](https://github.com/krtw00/duel-log-app/issues/162))にlinkを追加 ([918f032](https://github.com/krtw00/duel-log-app/commit/918f0322b02d037f370d58f254538d2ab0b01b15))
* show percentage in pie tooltip ([9688657](https://github.com/krtw00/duel-log-app/commit/9688657221cf58ec0377b65aeedaf4b91824bafb))
* **statistics:** refactor value sequence charts ([cf65e3f](https://github.com/krtw00/duel-log-app/commit/cf65e3f73140a59b6ff497e1bb01c95ab190241b))
* **ui:** MLモードトグルと学習データ収集UIを追加 ([ae6007f](https://github.com/krtw00/duel-log-app/commit/ae6007f7822b7237c05c5b9693d8cab71b5aba1a))
* プロジェクトツールと設定ファイルを追加 ([a8f667a](https://github.com/krtw00/duel-log-app/commit/a8f667a10855d2e39059ccbf8cc90ea2e54f34a1))
* 共有統計ページのフィルタリングとOBSオーバーレイの改善 ([d7fc22d](https://github.com/krtw00/duel-log-app/commit/d7fc22db63517402554e6d339c52e8af8b7f3c06))
* 新規戦績登録モーダルに最新のデッキ情報を自動反映 ([abe04f5](https://github.com/krtw00/duel-log-app/commit/abe04f5aa09bdb754fd3be58eabd56276f8d44e8))
* 統計画面に月間対戦一覧を追加 ([cecbc07](https://github.com/krtw00/duel-log-app/commit/cecbc078e665387bea22ee02adb9d973fdfcdb5a))


### 🐛 Bug Fixes

* **alembic:** alembicの多重ヘッド問題を修正 ([dd446b0](https://github.com/krtw00/duel-log-app/commit/dd446b012ef18a948854a1e11f373beb9910884d))
* allow archived decks ([bd07b75](https://github.com/krtw00/duel-log-app/commit/bd07b75620d8a83c90b6dbf79142d906aab3bc06))
* **api:** 307 リダイレクトを避けるため、/me エンドポイントから末尾スラッシュを削除 ([0fe93b3](https://github.com/krtw00/duel-log-app/commit/0fe93b3a26424d463f9c2b13628a7aa8dd60438a))
* **api:** ensure nested デッキ objects in デュエル response ([309698c](https://github.com/krtw00/duel-log-app/commit/309698c40b0ae35b07f2a77c36c130a4d03f1b1f))
* **api:** 対戦履歴表示の不具合を修正 ([f740265](https://github.com/krtw00/duel-log-app/commit/f740265175c22cd5a59899530caccbc002e3eeb5))
* **api:** 対戦履歴表示の不具合を完全に修正 ([5a196bd](https://github.com/krtw00/duel-log-app/commit/5a196bd59ba1772db519bfdbe717125563d26331))
* **auth:** correct UnauthorizedException parameter usage in deps.py ([916b1f9](https://github.com/krtw00/duel-log-app/commit/916b1f929b3d47b247ac8d256fe6294097f504f9))
* **auth:** MacOS環境での統計ページ認証エラーを修正 ([4f209a3](https://github.com/krtw00/duel-log-app/commit/4f209a3156ae97aeb3dc5ce182f344fe6350e53c))
* **auth:** すべてのリクエストで localStorage のトークンを Authorization ヘッダーに追加 ([5be31de](https://github.com/krtw00/duel-log-app/commit/5be31def2a5664df72115735627a5bc232da3bbe))
* **auth:** ページロード時の Cookie タイミング問題で 401 が発生した際の自動ログアウト回避 ([44792ad](https://github.com/krtw00/duel-log-app/commit/44792adcad147ff80d18ca53cc4348a3236eb47c))
* **auth:** 未使用の shouldUseAuthorizationHeader 関数を削除 ([e53025c](https://github.com/krtw00/duel-log-app/commit/e53025cdd499f370d7798fb694cde04adc197a97))
* **backend:** Alembicの履歴分岐を解消 ([b240999](https://github.com/krtw00/duel-log-app/commit/b2409990322fb0b3184389298d57ad8055c758fb))
* **backend:** align services with renamed デュエル fields ([5d2b75b](https://github.com/krtw00/duel-log-app/commit/5d2b75b7642523336df2ef8c878e795eb34186fe))
* **backend:** align テスト with renamed デュエル fields ([c9b42b8](https://github.com/krtw00/duel-log-app/commit/c9b42b8a18542a01a472452ccd2796497dd5a8fe))
* **backend:** align デュエル fields with naming convention ([7f8399c](https://github.com/krtw00/duel-log-app/commit/7f8399c67bf1fe3ffbf3cd0f5776867bbd7a68a1))
* **backend:** align デュエル fields with naming convention ([8eb47eb](https://github.com/krtw00/duel-log-app/commit/8eb47eba640f0f4f9926c2965c5c6fdebd6359a9))
* **backend:** auto-stamp db when alembic_version is missing ([8a7b843](https://github.com/krtw00/duel-log-app/commit/8a7b8437b6a50ff49c3bba43821a9f653c56fac3))
* **backend:** bcrypt 5.0.0のパスワード長制限に対応 ([#184](https://github.com/krtw00/duel-log-app/issues/184)) ([58dbfef](https://github.com/krtw00/duel-log-app/commit/58dbfef76ceccca046a0be7f76948ad0b68a306d)), closes [#163](https://github.com/krtw00/duel-log-app/issues/163)
* **backend:** correct DuelWithDeckNames schema for response validation ([d118e7c](https://github.com/krtw00/duel-log-app/commit/d118e7c0b059ff658a76e3e995fa1953a2d7886a))
* **backend:** correct keyword argument in get_user_duels call ([d6d09d6](https://github.com/krtw00/duel-log-app/commit/d6d09d6b2e7c219ab7996c05425dc6fcf6e22276))
* **backend:** correct opponent_deck_id field name in merge スクリプト ([3861bb6](https://github.com/krtw00/duel-log-app/commit/3861bb639e44da3ccaf6fa8851777b77d5b155eb))
* **backend:** Correct opponentDeck attribute access in shared_statistics エンドポイント ([b45fbb2](https://github.com/krtw00/duel-log-app/commit/b45fbb2fd97eabea2b7edb1255330facb3ceffa1))
* **backend:** Correct opponentDeck_id to opponent_deck_id in shared_statistics エンドポイント ([1245afa](https://github.com/krtw00/duel-log-app/commit/1245afa002eb53cdf5e75a896befdc2f670551aa))
* **backend:** correct syntax error in shared_statistics_service ([4b16863](https://github.com/krtw00/duel-log-app/commit/4b16863f6fe0f237c45067e903523ca805dfe938))
* **backend:** correctly serialize デュエル objects in statistics response ([695f6a2](https://github.com/krtw00/duel-log-app/commit/695f6a23aedad7afbd8765aaa2e96a79d2225b3d))
* **backend:** DBカラム名の不一致によるエラーを修正 ([99745fc](https://github.com/krtw00/duel-log-app/commit/99745fc0b0c221581ed94c8ff55d31a0ffdccf32))
* **backend:** DuelWithDeckNames schemaにcomputed_fieldを追加 ([a301228](https://github.com/krtw00/duel-log-app/commit/a301228846445b8e3490164ccb910ac8f9108272))
* **backend:** exception chaining in admin routerを追加 ([7937555](https://github.com/krtw00/duel-log-app/commit/7937555d8aa3676881f211a4d175f27f7071a834))
* **backend:** exit on migration failure in start.py ([628ba99](https://github.com/krtw00/duel-log-app/commit/628ba99912bba9ef2738017906d95947b75aaa54))
* **backend:** import joinedload in duel_service ([5b734f0](https://github.com/krtw00/duel-log-app/commit/5b734f08b37a4d76c284a70a106599ba27f99b2c))
* **backend:** import statistics_service in statistics router ([9bdc9d7](https://github.com/krtw00/duel-log-app/commit/9bdc9d7ebc68ffdd0f9a85d5b264c455489753a7))
* **backend:** include デッキ names in デュエル list エンドポイント ([ee32df7](https://github.com/krtw00/duel-log-app/commit/ee32df7cc9ef2e6586dfbf019e58cac2ce9c90fc))
* **backend:** mypy型チェックエラーを修正 ([#183](https://github.com/krtw00/duel-log-app/issues/183)) ([fe4aec6](https://github.com/krtw00/duel-log-app/commit/fe4aec6689d9fda63f1c6f423275a6214149c9d5)), closes [#163](https://github.com/krtw00/duel-log-app/issues/163) [#162](https://github.com/krtw00/duel-log-app/issues/162)
* **backend:** pass filter params to shared statistics エンドポイント ([c0364a5](https://github.com/krtw00/duel-log-app/commit/c0364a5ed55cc12ec35ee00c17b95b08bc9adcdc))
* **backend:** pass range filter params to shared statistics エンドポイント ([e394e4e](https://github.com/krtw00/duel-log-app/commit/e394e4e1cc55e75da873996e4fd1e9ca5fbe8bb0))
* **backend:** query_builders内の古いフィールド名参照を修正 ([a51302e](https://github.com/krtw00/duel-log-app/commit/a51302e28a1dc8fa7a5c0d42e49ca6e4380e515e))
* **backend:** resolve AttributeError in shared statistics エンドポイント ([7d6e8c5](https://github.com/krtw00/duel-log-app/commit/7d6e8c5155c6773cf38f070f0ac1402362b9299f))
* **backend:** resolve lintエラー in merge スクリプト ([3cb63ee](https://github.com/krtw00/duel-log-app/commit/3cb63ee39a3f1cceaa6dcb930d127e6f8baff527))
* **backend:** return statistics data in shared link エンドポイント ([0134d3d](https://github.com/krtw00/duel-log-app/commit/0134d3d08b9c7b2702cfd21896026d278ceb4b3f))
* **backend:** ruff lintエラー in admin codeを修正 ([5ce10ff](https://github.com/krtw00/duel-log-app/commit/5ce10ff0dce4b3e3a0f5c0b538822e07cb7ffbe9))
* **backend:** ruff lintエラー in admin codeを修正 ([8401311](https://github.com/krtw00/duel-log-app/commit/8401311c7929dba9eb3b8307d4b7b51001ccc1a6))
* **backend:** SharedStatisticsResponse schemaを追加 ([10fd2f3](https://github.com/krtw00/duel-log-app/commit/10fd2f3d2874c080a13c3a3bc1606e2afa667f97))
* **backend:** statistics_serviceのフィールド名をopponentDeck_idに統一 ([10dcc69](https://github.com/krtw00/duel-log-app/commit/10dcc697b5ead1a0bb333c02bdaa2f261897356b))
* **backend:** unused import in merge スクリプトを削除 ([bd40d60](https://github.com/krtw00/duel-log-app/commit/bd40d60046ffbb86e7f3d2df0938d016e05d566f))
* **backend:** use correct field name in merge スクリプト ([2398fff](https://github.com/krtw00/duel-log-app/commit/2398fff94be9ae5a8eef2aa7cbc9996f20cb4232))
* **backend:** use snake_case for opponent_deck_id query ([d65711d](https://github.com/krtw00/duel-log-app/commit/d65711d0bbfb4f1db46e84f143950cd76fc5c13c))
* **backend:** クエリビルダの属性エラーを修正 ([149a240](https://github.com/krtw00/duel-log-app/commit/149a240e33eefb25d0dd88592d07cd15a0d95e91))
* **backend:** テスト失敗と 非推奨警告を修正 ([c736a0f](https://github.com/krtw00/duel-log-app/commit/c736a0f0964340658a6f09c8586a79536d6c6705))
* **backend:** テスト失敗と 非推奨警告を修正 ([e5d650a](https://github.com/krtw00/duel-log-app/commit/e5d650a170ea0c70e0c5ec8c7d2d29c448bc29c3))
* **backend:** マイグレーションのdown_revisionを修正 ([90d1b6c](https://github.com/krtw00/duel-log-app/commit/90d1b6cb51acb6cef848a6786c9c14911eed044a))
* **backend:** モデルとDBスキーマのフィールド名を統一 ([2bcb74e](https://github.com/krtw00/duel-log-app/commit/2bcb74e634d3973b9bc77aa98fbed54e90185ece))
* **backend:** 対戦履歴取得時のバリデーションエラーを修正 ([fbe9a46](https://github.com/krtw00/duel-log-app/commit/fbe9a46e3f488e4070220157d9c88f9e722a0e6d))
* **backend:** 本番DBスキーマ(camelCase)に完全対応 ([4bfb738](https://github.com/krtw00/duel-log-app/commit/4bfb738192d669bc0b5c25598335eb661bf8d270))
* **backend:** 本番環境のDBスキーマに合わせて競合するマイグレーションを削除 ([ce436ab](https://github.com/krtw00/duel-log-app/commit/ce436abbc2759f07a3437850f59a249fa98e6b33))
* **ci:** allow e2e バックエンド cors for preview port ([2da2171](https://github.com/krtw00/duel-log-app/commit/2da21710e5efffe25cf1a39c88fa3008d20cfedb))
* **ci:** Banditスキャンから開発用スクリプトを除外 ([647683e](https://github.com/krtw00/duel-log-app/commit/647683ef9b14c197ebe7c9d940417e2b2f1dc4e8))
* **ci:** CI/CDワークフローのエラーを修正 ([66d5828](https://github.com/krtw00/duel-log-app/commit/66d5828b4107f7f7da4f61cf536b58be7efe9453))
* **ci:** CIワークフローのエラーを修正 ([149ebbc](https://github.com/krtw00/duel-log-app/commit/149ebbc37264f404bad02765bf4d57e37c65f597))
* **ci:** Docker/E2Eテストのデータベース接続エラーを修正 ([4b22d5b](https://github.com/krtw00/duel-log-app/commit/4b22d5b5121ec45f8c78d6826f6f965e979374a5))
* **ci:** ESLint v-slotエラーを修正 ([811bd37](https://github.com/krtw00/duel-log-app/commit/811bd37a8ad07ecbb0623516874a6214836872b6))
* **ci:** Pass github-token as input parameter instead of env variable ([496abed](https://github.com/krtw00/duel-log-app/commit/496abed17e0fbfc9efdfafb2aa9a528faa787ca5))
* **ci:** PR auto-review workflow permissions と error handlingを修正 ([6e305c3](https://github.com/krtw00/duel-log-app/commit/6e305c3ad6cdfd95c543154df5e727af8ffd5030))
* **ci:** PR title checkからsubject capitalization restrictionを削除 ([7df94dd](https://github.com/krtw00/duel-log-app/commit/7df94ddf00cc6906ff2b2605d73990139faf0945))
* **ci:** Vercelのビルドエラーを修正し対戦履歴表示の不具合に対応 ([60180b2](https://github.com/krtw00/duel-log-app/commit/60180b2b0b25a70343ab7f8a806e20a4c05e1b1b))
* **ci:** タイムゾーンとSQLite接続エラーを修正 ([9006c7e](https://github.com/krtw00/duel-log-app/commit/9006c7e160ad9ff4212d62807a7a9cc63c5f7511))
* **ci:** フロントエンドテスト・ビルドにVITE_API_URL環境変数を追加 ([4cc3fa4](https://github.com/krtw00/duel-log-app/commit/4cc3fa44cc483e69849bf9524a01291ff46ca887))
* **ci:** フロントエンドのCIテスト失敗を修正 ([6b7a200](https://github.com/krtw00/duel-log-app/commit/6b7a20037741b3d9e0719bb9eb3078833c9484dd))
* **ci:** ヘルスチェックエンドポイント修正とdevelopブランチのCI対応 ([9a7dc75](https://github.com/krtw00/duel-log-app/commit/9a7dc75f8166343131819ad7909190f878683c44))
* **ci:** 環境変数ファイル削除後のCI失敗を修正 ([047c0b5](https://github.com/krtw00/duel-log-app/commit/047c0b5933629bf3e8b2e384b4027d9048971cf7))
* clear stale token when /me fails ([9f0b2b3](https://github.com/krtw00/duel-log-app/commit/9f0b2b3e6ec8815ce5b7612dffeda4d35b6eba84))
* **csv:** CSVインポート機能の修正と改善 ([94ad57e](https://github.com/krtw00/duel-log-app/commit/94ad57e8ad61ce492b1a20406c2f778bf9642584))
* **deps:** FastAPI 0.111.1+用にpython-multipartを追加 ([acf244b](https://github.com/krtw00/duel-log-app/commit/acf244b3d782b9e2ff5bb3bbc21667d6aefadef0))
* **deps:** FastAPI 0.127.0アップグレードに伴う修正 ([5065bea](https://github.com/krtw00/duel-log-app/commit/5065beadd19c92382de7c1a83360e4bee58a153d))
* **deps:** vitest/coverage-v8を3.x系に戻し、型エラーを修正 ([7228a92](https://github.com/krtw00/duel-log-app/commit/7228a92d02c649da9de50468cc2f00cf45925e9c))
* developブランチからmainへの同期（セキュリティ修正・CI改善・Dependabot設定変更含む） ([#145](https://github.com/krtw00/duel-log-app/issues/145)) ([9cd2760](https://github.com/krtw00/duel-log-app/commit/9cd2760ba058976bbe8c7037d788091dfbf73ad7))
* **dev:** make Vite proxy target configurable ([ea068b7](https://github.com/krtw00/duel-log-app/commit/ea068b7104dd7ac76587a780e49bf7e0b6ca84b6))
* **docs:** pre-commit hooksのセットアップ手順を修正 ([631f745](https://github.com/krtw00/duel-log-app/commit/631f745323c3804b0c6c20a71955f677f86b6c95))
* **docs:** 破損したnaming-convention-migration-plan.mdを修正 ([529193c](https://github.com/krtw00/duel-log-app/commit/529193ccc6f5ed8298f742c25a409b4d280b7dd4))
* **duel:** DCタブでDCポイントが表示されない問題を修正 ([041917d](https://github.com/krtw00/duel-log-app/commit/041917d162d7fefe0a6f06f02044d0ce26cc91d4))
* **duel:** DCポイントを整数型に変更 ([dac1491](https://github.com/krtw00/duel-log-app/commit/dac1491ff5ff1278fcae18e2b919cbc5986f4ed0))
* **duel:** EVENTモードの最新デッキ情報取得に対応 ([dcf9b4e](https://github.com/krtw00/duel-log-app/commit/dcf9b4ea16fe8e3cb999c9eb3c9b5fc33d5ee5cf)), closes [#205](https://github.com/krtw00/duel-log-app/issues/205) [#205](https://github.com/krtw00/duel-log-app/issues/205)
* **e2e:** E2E テスト安定性向上 - waitForLoadState を追加 ([cc6d19e](https://github.com/krtw00/duel-log-app/commit/cc6d19ea1fbc304170d8491520a169ed5739409c))
* **e2e:** Playwright CI環境でのナビゲーションリンククリック失敗を解決 ([ec45590](https://github.com/krtw00/duel-log-app/commit/ec45590e32e63e4f22b65ecca28b25d5c9911a60))
* **e2e:** ナビゲーションテスト環境依存問題でスキップ ([0bbe0c4](https://github.com/krtw00/duel-log-app/commit/0bbe0c42b29ef058d1e6542bdfe91916a2d9ee59))
* **e2e:** ナビゲーション要素のクリック失敗を修正 ([4df9993](https://github.com/krtw00/duel-log-app/commit/4df99936edb497f4634b9ca6f0241dcc27417652))
* **e2e:** 認証テスト失敗を修正 - 登録後の自動ログイン処理 ([e2032f1](https://github.com/krtw00/duel-log-app/commit/e2032f115701ccbdf7bcabd9232603e6dc8a26d8))
* enable /api proxy by using vite.config.js ([aa56ffa](https://github.com/krtw00/duel-log-app/commit/aa56ffa5645df5932af288e0bac7d38a67865f04))
* ensure /api baseURL works with leading-slash paths ([f0364fe](https://github.com/krtw00/duel-log-app/commit/f0364fe354348a294fbc67127c7e01d7fa081a12))
* **format:** auth.py の85文字超える行を修正 ([cf3eefe](https://github.com/krtw00/duel-log-app/commit/cf3eefeb9df4187fc3b7e650062700f8d09b7c6f))
* **format:** auth.py の残りの Black フォーマット違反を修正 ([0aabafa](https://github.com/krtw00/duel-log-app/commit/0aabafa6d921edb1d30670ffbd9fe18d7950a8c7))
* **format:** Black の期待するフォーマットに完全準拠 ([bc236b6](https://github.com/krtw00/duel-log-app/commit/bc236b690ae24d8179d1827500e2f1afbb889508))
* **format:** Black フォーマット違反を修正 ([4a44900](https://github.com/krtw00/duel-log-app/commit/4a449003eb46ae9b803692ff301a19ffc84b3be0))
* **frontend:** align apex value sequence typings ([21202f9](https://github.com/krtw00/duel-log-app/commit/21202f965516fc58c991ff00052fa5a72fb094a1))
* **frontend:** align with opponent_deck_id snake_case ([400f6e2](https://github.com/krtw00/duel-log-app/commit/400f6e269542df06c5b7862e8b02625795e1f265))
* **frontend:** avoid バックエンド:8000 in browser dev ([e1e0f0c](https://github.com/krtw00/duel-log-app/commit/e1e0f0cf40da590cdd4726170a6f79eee7e0181f))
* **frontend:** call /statistics without trailing slash ([ffc8f32](https://github.com/krtw00/duel-log-app/commit/ffc8f326e7df0ce3ebc194ce194d5c685a4698cc))
* **frontend:** clear 対戦相手デッキ after デュエル登録 ([da619f7](https://github.com/krtw00/duel-log-app/commit/da619f73f0f64a47f5825dcb0ec03f36040730fd))
* **frontend:** clear 対戦相手デッキと adjust turn defaults ([0548f99](https://github.com/krtw00/duel-log-app/commit/0548f99b5f4acd957626f0b7b027280e1164fb4a))
* **frontend:** correct typo in SharedStatisticsView ([a9dc405](https://github.com/krtw00/duel-log-app/commit/a9dc40526c729ca75f405415c65bb51f47299e15))
* **frontend:** correct テスト data と mocks for CI ([3e754d0](https://github.com/krtw00/duel-log-app/commit/3e754d0238d2530e6f6bbf7d2625d9c4a3200f3e))
* **frontend:** Correct デュエル data display と submission ([09c981a](https://github.com/krtw00/duel-log-app/commit/09c981aa103de66bf3c2c950729abc6bf4ebf534))
* **frontend:** correctly map opponent_deck to opponentDeck ([dc136c0](https://github.com/krtw00/duel-log-app/commit/dc136c0b2adaa1ff95d8ae4c8ead0c6bc4c1369b))
* **frontend:** CSVインポートボタンが反応しない問題を修正 ([df472ed](https://github.com/krtw00/duel-log-app/commit/df472edd4543bc127f22d77b167295865418801f))
* **frontend:** DCポイント入力で小数点を入力できないように修正 ([a051bca](https://github.com/krtw00/duel-log-app/commit/a051bca43a17bdb143784ed48d5816ee0547878d))
* **frontend:** DCポイント入力で小数点を入力できないように修正 ([#227](https://github.com/krtw00/duel-log-app/issues/227)) ([716fc67](https://github.com/krtw00/duel-log-app/commit/716fc676b7dfb7780f646ab9f2a70c134ea9a556)), closes [#225](https://github.com/krtw00/duel-log-app/issues/225)
* **frontend:** default VITE_API_URL for テスト ([98533d7](https://github.com/krtw00/duel-log-app/commit/98533d73138c933aef0428710d2e6f07e8f0dc5e))
* **frontend:** hide archived デッキ options ([32d317a](https://github.com/krtw00/duel-log-app/commit/32d317a3dcb9cac880ccbb550764e45154c71118))
* **frontend:** hide game モード tabs in edit dialog ([79c23d0](https://github.com/krtw00/duel-log-app/commit/79c23d0f6dd177ce4441b96ef37c1ce73d4ab9b9))
* **frontend:** hide 画面解析 in edit dialog ([90ba1ac](https://github.com/krtw00/duel-log-app/commit/90ba1aca923a55bee7efdf42441c6ec50e268388))
* **frontend:** improve 対戦相手デッキ visibility in dark モード ([1827623](https://github.com/krtw00/duel-log-app/commit/182762373e389edf2f14e8f5665b631b4a1c502d))
* **frontend:** missing is_admin field in テストとtypesを追加 ([f2747e4](https://github.com/krtw00/duel-log-app/commit/f2747e408db9bece4e756f5f6f61b623857137b1))
* **frontend:** OBSStatsResponse型にcurrent_rateとcurrent_dcを追加 ([0b59be8](https://github.com/krtw00/duel-log-app/commit/0b59be8c6e9b9d04a3fd1faf4e797d5ead2a6be5))
* **frontend:** OBSオーバーレイページのみ背景を透明化するように修正 ([867c3d7](https://github.com/krtw00/duel-log-app/commit/867c3d74747a3fdad004a66fd04756aaa953af6c))
* **frontend:** OBS設定の表示項目にレートとDCを追加 ([dbdb8a8](https://github.com/krtw00/duel-log-app/commit/dbdb8a87d16adab70dfe7b1980a619681fccd104))
* **frontend:** prevent login → error → リダイレクト loop by making 401 logout conditional\n\n- Only logout on 401 if initialized と either Authorization header or local token existed\n- Avoids over-eager logout on transient post-login requests (cookie timing)\n\nRefs: router guard + /auth/login flow ([233522c](https://github.com/krtw00/duel-log-app/commit/233522cd50f2bf84e88ef0dba9d7ff4018d180b1))
* **frontend:** resolve build errors by updating references ([32ec185](https://github.com/krtw00/duel-log-app/commit/32ec185f94f892962fb1b6f3785c5b5363c9045e))
* **frontend:** resolve infinite loading state on network errors ([0558bf2](https://github.com/krtw00/duel-log-app/commit/0558bf2daddf2c7b0c6f64704a867d518396b6f8))
* **frontend:** resolve vercel build errors ([74573aa](https://github.com/krtw00/duel-log-app/commit/74573aa3dae392cecd88e1796712d45381f0e314))
* **frontend:** resolve vue-tsc type errors ([1501b8f](https://github.com/krtw00/duel-log-app/commit/1501b8fb86710d8a13957583a4f407494dbd755e))
* **frontend:** resolve デッキ id after duplicate ([5abb635](https://github.com/krtw00/duel-log-app/commit/5abb635ae81063d3586dc309f379a5e559ab885c))
* **frontend:** restore saveLastUsedValues ([5986f63](https://github.com/krtw00/duel-log-app/commit/5986f634641a4524d8f44402480985d26f651bbe))
* **frontend:** restore saveLastUsedValues ([8d52a6a](https://github.com/krtw00/duel-log-app/commit/8d52a6a500f95db69f1b47f92fd82bfb26feb339))
* **frontend:** rewrite バックエンド host in browser ([3fd0651](https://github.com/krtw00/duel-log-app/commit/3fd0651d7105d4d7525aa314139b795ee5d4e01f))
* **frontend:** SharedStatisticsView の型エラーを修正 ([1c18771](https://github.com/krtw00/duel-log-app/commit/1c187711c30657bf0c11ddd8f41ce77e03fccbda))
* **frontend:** SharedStatisticsView.テスト.tsのテストを修正 ([924d21e](https://github.com/krtw00/duel-log-app/commit/924d21ec38add20bdaf8df6b4b1d8b473b482f65))
* **frontend:** stray code causing syntax errorを削除 ([bab5602](https://github.com/krtw00/duel-log-app/commit/bab5602c46f1bc79e04e51f55e68d6d66a28ecb3))
* **frontend:** unknown 対戦相手デッキ displayを修正 ([9f79125](https://github.com/krtw00/duel-log-app/commit/9f7912511368305a62a9dce6b211596d30c56fe5))
* **frontend:** unused saveLastUsedValuesを削除 ([e7460db](https://github.com/krtw00/duel-log-app/commit/e7460dbcbcfc6350b8375217d51b357d7b42e75f))
* **frontend:** unused saveLastUsedValuesを削除 ([a898f02](https://github.com/krtw00/duel-log-app/commit/a898f02e78026aecc38287982487c9bf3bb1a8a7))
* **frontend:** unused saveLastUsedValuesを削除 ([18da9d8](https://github.com/krtw00/duel-log-app/commit/18da9d87536bcf2a68d6ced904d103ed47de499a))
* **frontend:** use snake_case for opponent_deck in DuelTable ([5d1bb2f](https://github.com/krtw00/duel-log-app/commit/5d1bb2fe3e26d01a6edd66a173e1affdff2ab7b0))
* **frontend:** useCSVOperationsからunused ref importを削除 ([e56006d](https://github.com/krtw00/duel-log-app/commit/e56006dba89e8ccbd28dd5c870445d30e52389ed))
* **frontend:** イベントタブでの対戦記録追加時にデッキが固定されない問題を修正 ([#205](https://github.com/krtw00/duel-log-app/issues/205)) ([0cff0a9](https://github.com/krtw00/duel-log-app/commit/0cff0a9a034fdb008d058a3c5d3e9901e9090caa)), closes [#46](https://github.com/krtw00/duel-log-app/issues/46) [#46](https://github.com/krtw00/duel-log-app/issues/46)
* **frontend:** デュエル interface to use opponent_deck_idを更新 ([4b663c6](https://github.com/krtw00/duel-log-app/commit/4b663c69648c1721e75697d9c60bf762fe589346))
* **frontend:** フロントエンドの起動とテーマ表示の問題を修正 ([26184a1](https://github.com/krtw00/duel-log-app/commit/26184a1f6e9a56cfdf3382fc001b24bf75c46420))
* **frontend:** ログイン後にログイン画面に戻る不具合を修正 ([69d4379](https://github.com/krtw00/duel-log-app/commit/69d437904fb77135c10f64bfa916c8190d1646ce))
* **frontend:** ログイン画面遷移不具合の修正 ([1f05be8](https://github.com/krtw00/duel-log-app/commit/1f05be8bab660e94f8d65d86313bbb6c143eaabc))
* **frontend:** 共有統計ライトテーマの配色を調整 ([5a3c0b6](https://github.com/krtw00/duel-log-app/commit/5a3c0b61a2a0baa30f22e7459431299de7536b3c))
* **frontend:** 対戦履歴テーブルでデッキ名が表示されない問題を修正 ([332417e](https://github.com/krtw00/duel-log-app/commit/332417e2b362806502417c07d4b417783c8fc4d0))
* harden dev login against bad API URL と CORS ([1d50723](https://github.com/krtw00/duel-log-app/commit/1d50723dcdc667da774148c3a84d736a9778182e))
* keep available decks sorted by name ([3ac1f1b](https://github.com/krtw00/duel-log-app/commit/3ac1f1b8064aeaf2fd1daa3c8d075d9313cbb231))
* **lint:** Ruff F541 エラーを修正 ([b27b6be](https://github.com/krtw00/duel-log-app/commit/b27b6be7d5883d3f4806f07071bdba135f3e2e03))
* make auth e2e selectors deterministic ([b3910a7](https://github.com/krtw00/duel-log-app/commit/b3910a7f83b41d818bf6fba93bc582da66ebd30d))
* make seed dc_value integer ([b50b291](https://github.com/krtw00/duel-log-app/commit/b50b2914b4430c59197f98439c13260cf2b3fd2f))
* migration issues向けにurgent Docker rebuild スクリプトを追加 ([973d0e7](https://github.com/krtw00/duel-log-app/commit/973d0e7955584b2cc7682e6a6adf6abfb82ae89d))
* **migration:** correct column name from duel_date to played_date ([fae740f](https://github.com/krtw00/duel-log-app/commit/fae740fa5d57d2f3ca12dd7cbe84c0359b099f7b))
* **migration:** resolve duplicate index migration error ([1745806](https://github.com/krtw00/duel-log-app/commit/174580685cd9a217231e376ae201da4473e27f46))
* **ml:** TensorFlow.js classification modelsを更新 ([0f07de0](https://github.com/krtw00/duel-log-app/commit/0f07de02b9fd5d5b05b4fae0455bcd3b25fb85cf))
* **obs:** OBSオーバーレイのパーセント表示の小数点位置を修正 ([309c031](https://github.com/krtw00/duel-log-app/commit/309c031114748b27d80ca9d8e2c018cb266ff378))
* **obs:** OBSオーバーレイの表示問題を修正 ([62c050d](https://github.com/krtw00/duel-log-app/commit/62c050d89e0b4a06f5ec124a390fb2d0b5d54a2f))
* OBS連携機能でランク、レート、DCが正しく表示されるように修正 ([6a0ccbd](https://github.com/krtw00/duel-log-app/commit/6a0ccbda965d1fa393a73f88dd40bfab8b4e7a3a))
* prevent false login と proxy API in docker dev ([2aa1231](https://github.com/krtw00/duel-log-app/commit/2aa1231a2e5e6190eb7a2fd4f5812e554ad2a16c))
* reduce デュエル edit dialog lag ([4257bb0](https://github.com/krtw00/duel-log-app/commit/4257bb00010af0ce8b3c9d10e13a609a78f88c0a))
* resolve multiple alembic head revisions error ([a1745ac](https://github.com/krtw00/duel-log-app/commit/a1745acad3b22b0c10e3a1aa602a302596236876))
* resolve timezone-aware datetime comparison issues ([0849a6b](https://github.com/krtw00/duel-log-app/commit/0849a6b8fff8981605b90472ac77d5d3d1d86601))
* route e2e api traffic via ipv4 loopback ([5363ec7](https://github.com/krtw00/duel-log-app/commit/5363ec79fddaceb4d74a82e32da7f407da500eb6))
* **screen-analysis:** コイン検出の誤検出を低減 ([32766c5](https://github.com/krtw00/duel-log-app/commit/32766c5a43983b0e0aa45e018c1f963998721187))
* **screen-analysis:** 閾値を調整し、低解像度向けのdownscaleを削除 ([ffdcad1](https://github.com/krtw00/duel-log-app/commit/ffdcad1efecb72c5cfb2128500dfa368e7a7abf0))
* **security:** Black フォーマッティングエラーを修正 ([ac12ee7](https://github.com/krtw00/duel-log-app/commit/ac12ee7d7acb776557d8b92478dfd3969572791c))
* **security:** CodeQL セキュリティアラート 8 件を完全修正 ([2e4fad7](https://github.com/krtw00/duel-log-app/commit/2e4fad777335f499f314659364c86f0e0c8c8810))
* **security:** CodeQLセキュリティアラート4件を修正 ([2f5e192](https://github.com/krtw00/duel-log-app/commit/2f5e192266f7fde4ba06a400ceb957ce3b3b2f74))
* **security:** CodeQLセキュリティアラート6件を修正 ([e58ede9](https://github.com/krtw00/duel-log-app/commit/e58ede9c3d47e9039ecbd547e45bd11c39cb8a81))
* **security:** duels.py のログインジェクション修正（アラート [#14](https://github.com/krtw00/duel-log-app/issues/14)） ([1ae65d9](https://github.com/krtw00/duel-log-app/commit/1ae65d940a08e4d88c2f529f2e179256d518b725))
* **security:** Jinja2にautoescapeを有効化してXSS脆弱性を対策 ([7d8af3a](https://github.com/krtw00/duel-log-app/commit/7d8af3a88ead7249fc54912cb705c9b8b958a300))
* **security:** scope decks by user ([4227462](https://github.com/krtw00/duel-log-app/commit/42274626b7c7af075fc8a854da51b7713de4da17))
* **security:** セキュリティアラート8件を修正 ([76ac70d](https://github.com/krtw00/duel-log-app/commit/76ac70dc811ac05c02a9e1378fc5fa9c753873d7))
* **security:** 重大なセキュリティ問題と認証テストの追加 ([8a5e2e4](https://github.com/krtw00/duel-log-app/commit/8a5e2e4310aec121cee6a14eb6f418bf75cfda5f))
* **seed:** dummy data generationにtimezone awarenessを追加 ([1abe213](https://github.com/krtw00/duel-log-app/commit/1abe213701894ee61d3d7260a2e3779b00ebb9f7))
* shared statistics month boundaryを調整 ([698e65e](https://github.com/krtw00/duel-log-app/commit/698e65e9f6acfa3ca55c5140aa69ffc3b137160b))
* **shared-link:** data filtering issue causing partial displayを修正 ([88b6a92](https://github.com/krtw00/duel-log-app/commit/88b6a92dafaac620e67f5b0ddeaec912833223d8))
* **share:** resolve data loading issue in shared statistics view ([af66df8](https://github.com/krtw00/duel-log-app/commit/af66df89dd3fc7e203c158b171812708746b5b40))
* show percent in pie hover ([5dbbd55](https://github.com/krtw00/duel-log-app/commit/5dbbd559ca9beaf856282e0ef1b37360096cb1e6))
* sort available decks by total duels ([9df13ad](https://github.com/krtw00/duel-log-app/commit/9df13ad6ecc9bbfc104c3240139af5cd396d5b41))
* sort available decks by total duels ([005dade](https://github.com/krtw00/duel-log-app/commit/005dade7790467a3da08faf1f29d190aaa2edd06))
* stabilize ci と build config ([64d508c](https://github.com/krtw00/duel-log-app/commit/64d508cf88f181942bf920c5e8a995e79dc1d96d))
* stabilize codeql uploads と register form fields ([2f4ef89](https://github.com/krtw00/duel-log-app/commit/2f4ef89065b17365a6dfafd1c23482648ba41c5c))
* stabilize dev auth via /api proxy ([99c898a](https://github.com/krtw00/duel-log-app/commit/99c898a3a121e69ef040714455c318f882583290))
* StatisticsView.vueの未使用変数を削除してビルドエラーを修正 ([835c9e3](https://github.com/krtw00/duel-log-app/commit/835c9e3e1a20fbf0365d90869a26971c6ae3151d))
* **test:** conftest.py の Base インポート場所を修正 ([2e0dfcd](https://github.com/krtw00/duel-log-app/commit/2e0dfcd58e0b1b2ffab31866c622cad7101e5333))
* **test:** resolve pytest import errorにconftest.pyを追加 ([4889c18](https://github.com/krtw00/duel-log-app/commit/4889c18b36c1d7cddcdd68051d7edb42ea1788d7))
* **tests:** mock Resend API to prevent CI failures ([75f6300](https://github.com/krtw00/duel-log-app/commit/75f63008059c524cfea14977872f972ff4868ec9))
* **test:** SQLiteタイムゾーン問題の解決 ([607130c](https://github.com/krtw00/duel-log-app/commit/607130cc0c4187690b7dd18372a62f0228f4171b))
* **tests:** resolve CI テスト失敗 ([579b938](https://github.com/krtw00/duel-log-app/commit/579b938d6c427b5f2099f95b5ca004f3ac5b7274))
* **test:** test_duel_service.pyのタイムゾーンエラーを修正 ([317dd4e](https://github.com/krtw00/duel-log-app/commit/317dd4ed978d17ccba153ef60499976a46a24d8d))
* **test:** test_query_builders.pyのファイル破損を修正 ([69e7166](https://github.com/krtw00/duel-log-app/commit/69e716693e135ee10bf3b91192650ee697d83c46))
* **test:** useLatestDuelValues テストを修正 ([e2ebb22](https://github.com/krtw00/duel-log-app/commit/e2ebb22caac2beb06c8cbf7facc383ebcc3dfac4))
* TypeScriptビルドエラーを修正 ([74b3d63](https://github.com/krtw00/duel-log-app/commit/74b3d6309bf450ba811f3f6b451367e02e7109b9))
* **types:** 認証ストアのユーザー型にenable_screen_analysisを追加 ([4b22ec1](https://github.com/krtw00/duel-log-app/commit/4b22ec126309698c77cca69264287378cca611db))
* use 'alembic upgrade heads' instead of 'head' ([43a3ccc](https://github.com/krtw00/duel-log-app/commit/43a3ccc583bf17f1f7f21afd6a97d734b9c1429c))
* アクション列の表示制御を調整 ([af17fa2](https://github.com/krtw00/duel-log-app/commit/af17fa204770d2c12cfb4345e7cfb293eb5a516f))
* シードデータ投入処理の修正 ([0f9b088](https://github.com/krtw00/duel-log-app/commit/0f9b08801e6103b6418ca85efb889f7086896dee))
* テスト実行の失敗要因を修正 ([e509ab5](https://github.com/krtw00/duel-log-app/commit/e509ab5005ac5041facb4d9ac3281cbece2bdbd6))
* ログアウト処理を全面的に見直し、認証の脆弱性を完全に修正 ([23606ff](https://github.com/krtw00/duel-log-app/commit/23606ffef8c7c86fefb3ed70859dae25ab7b5cdb))
* ログアウト処理を厳格化し、自動再ログインの脆弱性を完全に修正 ([9f6b0fc](https://github.com/krtw00/duel-log-app/commit/9f6b0fcfd9618ae95027a8274c7567b46635c4dd))
* ログアウト後の自動再ログインの脆弱性を修正 ([8217f2e](https://github.com/krtw00/duel-log-app/commit/8217f2ee3bf367f3a6aee3e04de19996d616c1d3))
* ログアウト後の自動再ログインの脆弱性を完全に修正 ([ea1409f](https://github.com/krtw00/duel-log-app/commit/ea1409f3b12ff8b5011dcd4b529be93a0dd6154b))
* ログアウト後も認証状態が維持される問題を修正 ([c29afaa](https://github.com/krtw00/duel-log-app/commit/c29afaa0c7aac58d3e3986abe6290f8efcbf5139))
* 共有リンクの有効期限が1日前になる問題を修正 ([21f5b1b](https://github.com/krtw00/duel-log-app/commit/21f5b1bf08cfdcff1fba3cab4efcb3c94b564060))
* 月の切り替え時間をゲームの仕様(7:59)に合わせて調整 ([96d7499](https://github.com/krtw00/duel-log-app/commit/96d7499af7bcfe25838a7d27fa40e7d449dbd247))
* 月の境界を7:59:00ジャストに変更 ([2334415](https://github.com/krtw00/duel-log-app/commit/233441536bb3c878b85825448ee6d8fb68b54c64))
* 月間対戦一覧の列表示を整理 ([c951da1](https://github.com/krtw00/duel-log-app/commit/c951da1b005507bb2d1e752a0592451755467d0f))
* 本番環境エラー修正（Cookie + NeonDB SSL + start.py最適化） ([6e6f60e](https://github.com/krtw00/duel-log-app/commit/6e6f60e184b990109b6a6d345d1d876730f9d6e9))


### ⚡ Performance Improvements

* avoid full refresh after デュエル save ([ac7c6b0](https://github.com/krtw00/duel-log-app/commit/ac7c6b07af90b1b4bad3f2a3c57716d8db23bd17))
* **ci:** Optimize E2E CI workflow execution time from 20min to 5-7min ([5f61b1e](https://github.com/krtw00/duel-log-app/commit/5f61b1e4063c6913408f0ef7334ca1e3cd04b9eb))
* reuse デッキ list to speed デュエル edit ([8521ab5](https://github.com/krtw00/duel-log-app/commit/8521ab5586263b4c647861a1acddec39d3c764f7))
* パフォーマンスとエラーハンドリングの改善 ([37b08f5](https://github.com/krtw00/duel-log-app/commit/37b08f5dae63acb4298524a6311385739c80c31d))


### ⏪ Reverts

* Revert "refactor(フロントエンド): remove unnecessary decks prop from DuelHistorySection" ([af20fa9](https://github.com/krtw00/duel-log-app/commit/af20fa986a32f188e5a30ad336becf5c1929fe37))
* README.md to previous state ([fec95d1](https://github.com/krtw00/duel-log-app/commit/fec95d1f24f0c32fb4d141fb70fb135be46ee429))


### 📝 Documentation

* agent contributor guideを追加 ([6efd3bb](https://github.com/krtw00/duel-log-app/commit/6efd3bb0fea8aba8e1765d3b4a9ee8ad44acb38e))
* architecture documentsとupdate db-schemaを追加 ([75cebf5](https://github.com/krtw00/duel-log-app/commit/75cebf5eb5d2fdb1bf50f1acef1335d298645993))
* **architecture:** archive merge 機能向けにdesignを追加 ([c6bbbb1](https://github.com/krtw00/duel-log-app/commit/c6bbbb145cf7358758f74ca20f48012d6a48e97c))
* **backend:** deck_service.pyに詳細なdocstringとコメントを追加 ([6ee6e09](https://github.com/krtw00/duel-log-app/commit/6ee6e0946b37f34cce0a02a0ff773ba8507d6e3c))
* **backend:** Phase 1.1 - バックエンドサービスに詳細なdocstringとコメントを追加 ([a2003e7](https://github.com/krtw00/duel-log-app/commit/a2003e708f467eccb63c9cb459adb764c2156eb5))
* **backend:** time_series_service.pyに詳細なdocstringとコメントを追加 ([a558d25](https://github.com/krtw00/duel-log-app/commit/a558d256f92eac23570e22217f6a10a2f241f43a))
* branch name examples to Englishを更新 ([d5d26b7](https://github.com/krtw00/duel-log-app/commit/d5d26b7c5ec023c3a807125c35ceb4670976a51d))
* **ci:** GitHub Copilot設定を最新情報に更新 ([1eb8ba7](https://github.com/krtw00/duel-log-app/commit/1eb8ba7caf0cb5c5f821a19badd3858683934607))
* detailed migration fix instructionsを追加 ([84a4fb0](https://github.com/krtw00/duel-log-app/commit/84a4fb0e4f6e775feaf46504c357c0ecd0df2282))
* **development-guide:** ブランチ命名規則を追記 ([130d67d](https://github.com/krtw00/duel-log-app/commit/130d67dfb8818196fa08ab1168e4130cd9149de5))
* **development-tutorial.md:** チュートリアル新規作成 ([7ad9333](https://github.com/krtw00/duel-log-app/commit/7ad9333214acffa6c31ad27faab012a7240df0ad))
* docs配下の古いコンテキストドキュメントを削除 ([f9aeb4d](https://github.com/krtw00/duel-log-app/commit/f9aeb4d6912733c7ec1ba858b1a494edaef9e81a))
* **frontend:** Composablesに詳細なJSDocを追加 ([f40d0d1](https://github.com/krtw00/duel-log-app/commit/f40d0d1f7fbd10aaed918e37f447a20f800c12df))
* **frontend:** DashboardView.vueにドキュメント追加 ([72e3690](https://github.com/krtw00/duel-log-app/commit/72e369059465d206ad0254db8a2bba38aeb9ed5b))
* **frontend:** DuelFormDialog.vueにドキュメント追加 ([19b47cf](https://github.com/krtw00/duel-log-app/commit/19b47cf62bac7875da1e7b82ba29d3a23a449686))
* GitHub通知設定ガイドを追加 ([a3f4118](https://github.com/krtw00/duel-log-app/commit/a3f4118bd9fa9df5509b84a8a6d4922f0ee9497d))
* i18n とフィードバック機能の設計ドキュメントを追加 ([7f8e1b9](https://github.com/krtw00/duel-log-app/commit/7f8e1b9960344d930b26686e4824f8cf1013370f))
* improve SECRET_KEY generation instructions in .env.example ([151f834](https://github.com/krtw00/duel-log-app/commit/151f8347dd8c487add15d4089e9e8a3c15709711))
* **models:** Phase 1.3 - モデル定義とTypeScript型に詳細なコメントを追加 ([0d72d7b](https://github.com/krtw00/duel-log-app/commit/0d72d7bd4aa47b2b75254c360a9f4598458893ef))
* Phase 1完了を反映したロードマップ更新 ([2d47dde](https://github.com/krtw00/duel-log-app/commit/2d47dde92d56038401149b6ee390bc0b90f84c03))
* Phase 1進捗を可読性向上ロードマップに反映 ([5fb3b26](https://github.com/krtw00/duel-log-app/commit/5fb3b2680a7f333f847daf80f2656150d3f132ee))
* **phase1:** モデルと型定義にドキュメントを追加（命名規則は維持） ([3116793](https://github.com/krtw00/duel-log-app/commit/31167935c2d3885583881eaa4d99c701f32ca53c))
* pre-commit hooksのセットアップ手順をREADMEに追加 ([5f6d84e](https://github.com/krtw00/duel-log-app/commit/5f6d84e870466369fa45d73f5ccd6debb85ed878))
* **readme:** Git運用ルールを追記 ([8ff371f](https://github.com/krtw00/duel-log-app/commit/8ff371f666827b298b8c5bbec1bc39a628d736ac))
* **readme:** OBS機能の説明を更新し、機能一覧を拡充 ([4d6b08d](https://github.com/krtw00/duel-log-app/commit/4d6b08d045b084a34222eb2d02acf2bd997a5378))
* **readme:** WSL開発環境セットアップ手順を更新 ([164f5e3](https://github.com/krtw00/duel-log-app/commit/164f5e3222f4a4b042c431b659de96e2ba6d5a08))
* READMEのOBSオーバーレイ機能に関する記述を更新 ([d335906](https://github.com/krtw00/duel-log-app/commit/d335906a1b8dfc73d938e67daac5888df718f39b))
* **readme:** 技術スタックの情報を更新 ([d047867](https://github.com/krtw00/duel-log-app/commit/d04786739a91116804008ac7584011b19bf7068b))
* **readme:** 開発環境のセットアップ手順を更新 ([717fde0](https://github.com/krtw00/duel-log-app/commit/717fde04754a8780887cd8dc2c4dd771de5e2b5b))
* recommend base64 整形 for SECRET_KEY generation ([1a53ea8](https://github.com/krtw00/duel-log-app/commit/1a53ea88d87fe227d398264750322bae12382096))
* screen recording analysis notesを追加 ([99500e3](https://github.com/krtw00/duel-log-app/commit/99500e37a1740e4bfd8846614b009099fd0746fd))
* **test:** conftest.py のインポート修正を明確にコメント追加 ([ae79765](https://github.com/krtw00/duel-log-app/commit/ae79765d8bd1e7516bd96c82d8c2d1145a4ecefc))
* コーディング規約ドキュメントを生成・整備 ([3b44468](https://github.com/krtw00/duel-log-app/commit/3b44468eb82bbf8a05a8711622f293c0d119e180))
* コーディング規約を追加 ([b75b595](https://github.com/krtw00/duel-log-app/commit/b75b595dea0c9a35d8281d50f1d9dfda909a45be))
* コード可読性向上のための包括的なドキュメントとサンプル実装を追加 ([d2d2a35](https://github.com/krtw00/duel-log-app/commit/d2d2a35116e32e24991311130e6df4989a459a84))
* ドキュメントを最新の実装に合わせて更新 ([5f8184a](https://github.com/krtw00/duel-log-app/commit/5f8184aec10803b84bf902278a0c43760ab39470))
* ドキュメントを用途別に階層化（案A） ([ef53a33](https://github.com/krtw00/duel-log-app/commit/ef53a330bcd39890826c8d12f48027fdf1ffdd7a))
* ドキュメント構成を整理・索引を最新化 ([e9fe822](https://github.com/krtw00/duel-log-app/commit/e9fe82289f86f769f0206ac2ed462133aa235c13))
* ブランチ戦略をGitFlowベースのフローに更新 ([a186180](https://github.com/krtw00/duel-log-app/commit/a1861808b3c8f531c7c94d203fd893bbf549bfda))
* ロードマップのフェーズ完了状況を更新 ([678bf12](https://github.com/krtw00/duel-log-app/commit/678bf121396f10979252875677b9a97de2fcdd78))
* 不要になったドキュメントファイルを削除 ([4136c2a](https://github.com/krtw00/duel-log-app/commit/4136c2aac7f202f03b89b83ac36655627846ae41))
* 不要になった画像認識計画ドキュメントを削除 ([37c0846](https://github.com/krtw00/duel-log-app/commit/37c08465ed67dbb2ee1103af54308d1b5d948c24))
* 命名規則統一化の詳細な移行計画を策定 ([fc91c1f](https://github.com/krtw00/duel-log-app/commit/fc91c1fb9c9be78ead1cd2f9c6ad109d385b2b7a))
* 管理画面とarchive merge 設計ドキュメントを追加 ([d3ff336](https://github.com/krtw00/duel-log-app/commit/d3ff33604e439380fa30cfadc5176b7d8236466a))
* 開発環境のセットアップ手順にフロントエンドのenv設定を追加 ([6771013](https://github.com/krtw00/duel-log-app/commit/6771013d0324cf8f70c992b1e0585032f24a8d81))


### ♻️ Code Refactoring

* **backend:** Create query builder utility for common filters ([f8439a2](https://github.com/krtw00/duel-log-app/commit/f8439a2b35becb2c75c2912a8dd0a4e49c8ebb45))
* **backend:** Duelモデルのカラム名を明確化し、docstring検証を無効化 ([dffe376](https://github.com/krtw00/duel-log-app/commit/dffe376852a25821992a32ea43ced3eb1e038ba7))
* **backend:** Extract CSV processing logic to dedicated service ([ca988fd](https://github.com/krtw00/duel-log-app/commit/ca988fdc670db95f4603fe48a22afa667aa30cfd))
* **backend:** Extract DeckDistributionService from StatisticsService ([81248c2](https://github.com/krtw00/duel-log-app/commit/81248c2c24432458d1fc925f3f61b8472b8e0fb4))
* **backend:** Extract GeneralStatsService from StatisticsService ([369f254](https://github.com/krtw00/duel-log-app/commit/369f254d6f45477e9804b9b456f4e29edc7dec3e))
* **backend:** Extract MatchupService from StatisticsService ([f4ef617](https://github.com/krtw00/duel-log-app/commit/f4ef617a05d9c98dcea61850b3a872f37c88ce3b))
* **backend:** Extract rank conversion logic to utility module ([c726d6f](https://github.com/krtw00/duel-log-app/commit/c726d6fdc2e08613ab383ac215f46a38621d2c00))
* **backend:** Extract TimeSeriesService from StatisticsService ([c77ca7b](https://github.com/krtw00/duel-log-app/commit/c77ca7b3d17a41d0e89c35b28e58df94ce065fe2))
* **backend:** Extract WinRateService from StatisticsService ([1e45ae5](https://github.com/krtw00/duel-log-app/commit/1e45ae57c811b9559d1ba91027c6849e6faf6394))
* **backend:** get_latest_duel_valuesのcode duplicationを低減 ([e061877](https://github.com/krtw00/duel-log-app/commit/e061877b14c60ee7830e042176a9f592c57aba01))
* **backend:** passlib dependency と use bcrypt directly ([#185](https://github.com/krtw00/duel-log-app/issues/185))を削除 ([f600c95](https://github.com/krtw00/duel-log-app/commit/f600c959125648918db0228c17a594c8b5807e9a))
* **backend:** クエリビルダーにヘルパー関数を追加 ([225cccb](https://github.com/krtw00/duel-log-app/commit/225cccbead97acd7d8d066c408f2822b44888ec8))
* **backend:** クエリビルダーユーティリティを作成 ([937d924](https://github.com/krtw00/duel-log-app/commit/937d9247adddcd2c979888ce6a74f54a59e09f8d))
* **backend:** サービスで共通クエリビルダーを使用 ([8c87250](https://github.com/krtw00/duel-log-app/commit/8c872502581725f8dda669364e120344d6aed3d0))
* **backend:** 統計サービスのデッキ分布計算を改善 ([63aa593](https://github.com/krtw00/duel-log-app/commit/63aa5935713db075f65980a50b801749e34238a5))
* **backend:** 統計サービスの直近デッキ分布計算を改善 ([0100e4b](https://github.com/krtw00/duel-log-app/commit/0100e4be2c3f5d34e9b66a0d7b11dab91da7fc03))
* cleanup stats, auth, と layout ([2af65c3](https://github.com/krtw00/duel-log-app/commit/2af65c39c32a9822a0c714fd857a727eea01a56a))
* DashboardView.vueを350行に削減 (1,212行→370行) ([c5b6cf5](https://github.com/krtw00/duel-log-app/commit/c5b6cf5fb2455facd10df95a07636f190ed040d9))
* DashboardView用のComposablesを作成 ([b556ef3](https://github.com/krtw00/duel-log-app/commit/b556ef352e99195f4420c3b26fad844a7e7963ba))
* DashboardView用のUIコンポーネントを作成 ([9757909](https://github.com/krtw00/duel-log-app/commit/975790974544e33d012f5dcc523ef94c7ec5c187))
* **frontend:** console.log/errorを集中ロガーに置き換え ([2ef7541](https://github.com/krtw00/duel-log-app/commit/2ef75410c1517adf9fec80ce211358dcfa7b81ca))
* **frontend:** DuelHistorySectionからunnecessary decks propを削除 ([336e060](https://github.com/krtw00/duel-log-app/commit/336e0607f11ab82ba90e3d06b050727326076c08))
* **frontend:** unnecessary デッキ fetching in DashboardViewを削除 ([fca005b](https://github.com/krtw00/duel-log-app/commit/fca005b574be4f98297c4f9057643754d65e6138))
* **frontend:** デュエル formからgame モード tabsを削除 ([d2c70c9](https://github.com/krtw00/duel-log-app/commit/d2c70c9ee000b4bbc272cf6fd4475f0525df604a))
* **frontend:** フロントエンドの型安全性を向上 ([1d72622](https://github.com/krtw00/duel-log-app/commit/1d72622a9cdca72ec9f64e59dd8101650003be10))
* **ml:** モデル読み込み向けに詳細ログ出力を追加 ([182d0a7](https://github.com/krtw00/duel-log-app/commit/182d0a7511b0f6c163d0f98900e2f1e45142b1ff))
* OBS統計値取得ロジックのリファクタリングとフォーマット改善 ([c349f22](https://github.com/krtw00/duel-log-app/commit/c349f22c81b07504c422ac974851b5ddc3277f8f))
* Phase 4 - 型安全性の強化（Part 1） ([daf5998](https://github.com/krtw00/duel-log-app/commit/daf599805293db183af2596486ae82da4c4fecde))
* Phase 4 - 型安全性の強化（Part 2） ([7bff170](https://github.com/krtw00/duel-log-app/commit/7bff170ec45e1a7e1290998cd6e7d8587d859245))
* Phase 4b & 5 - TypeScript型安全性向上とコンポーネント分割 ([e1cc1f6](https://github.com/krtw00/duel-log-app/commit/e1cc1f6f06226622158fce982f4c884458998738))
* Phase 5 - 大規模コンポーネントの分割（部分実施） ([40241d8](https://github.com/krtw00/duel-log-app/commit/40241d80b5cb72b07f83b98ef6fc17bfdc3532f9))
* Phase 6 - コードの重複削除 ([8d7fa0b](https://github.com/krtw00/duel-log-app/commit/8d7fa0b5f5097700c856fc2baf1df67c986f3508))
* Phase 7-9 - エラーハンドリング統一化、any型削減、テストカバレッジ向上 ([9fee260](https://github.com/krtw00/duel-log-app/commit/9fee26045fbfb8171844fd223f5b3d79a2ada430))
* **phase2:** クエリビルダーを共通化してコード重複を削減 ([4099590](https://github.com/krtw00/duel-log-app/commit/40995906eb5df9cd931b3392d23ff76fb117d738))
* **バックエンド:** 統計サービスの改善とテスト追加 ([aa05dcf](https://github.com/krtw00/duel-log-app/commit/aa05dcf5c8eeb6b95e2a34eabd59264a6c7a985b))
* フロントエンドに共通ユーティリティと型定義を追加 ([24461dd](https://github.com/krtw00/duel-log-app/commit/24461dd33f12815ea0ee562875ef93b52eceab7b))

## [1.10.1](https://github.com/krtw00/duel-log-app/compare/v1.10.0...v1.10.1) (2026-01-12)


### 🐛 Bug Fixes

* **api:** remove trailing slashes from /me endpoints to avoid 307 redirect ([6abdbfd](https://github.com/krtw00/duel-log-app/commit/6abdbfd0edbb85acffe8fa04295add1bd9881222))

## [1.10.0](https://github.com/krtw00/duel-log-app/compare/v1.9.0...v1.10.0) (2026-01-12)


### ✨ Features

* **frontend:** add description for screen analysis feature ([32b82ba](https://github.com/krtw00/duel-log-app/commit/32b82ba60273ed2b9d0e4dc0364aacd78b72767a))
* **ml:** add TensorFlow.js image classification models ([b9425a3](https://github.com/krtw00/duel-log-app/commit/b9425a3253175bfe29c9d32687c12ff89724ffe1))
* **screen-analysis:** add Gaussian blur and dynamic sigma scaling for low resolutions ([71ab5cd](https://github.com/krtw00/duel-log-app/commit/71ab5cd90827c7da68ff99ebdd52727038c1ce00))
* **screen-analysis:** add TensorFlow.js image classification prototype ([b3971ec](https://github.com/krtw00/duel-log-app/commit/b3971ec25ba0e4f56ab2f552d2038d1dd68e8690))
* **screen-analysis:** apply MIPMAP approach to turnChoice and okButton ([d1e5134](https://github.com/krtw00/duel-log-app/commit/d1e51347421666c46f19f1f2485dee2414d43459))
* **screen-analysis:** implement MIPMAP approach for multi-resolution template matching ([05b5498](https://github.com/krtw00/duel-log-app/commit/05b54981f75a08ae3127cf90b25e552defde42af))
* **screen-analysis:** replace OK button detection with result lock mechanism ([f272412](https://github.com/krtw00/duel-log-app/commit/f27241271660ab9053a0057f353a3fff4fcf5878))
* **screen-analysis:** support all game resolutions for template matching ([a9cb093](https://github.com/krtw00/duel-log-app/commit/a9cb09383c8b75ec6db052b5b6c0a50ca3dfb5a6))
* **screen-analysis:** support variable screen resolutions (1280x720-3840x2160) ([a2fa73e](https://github.com/krtw00/duel-log-app/commit/a2fa73e150ac2f972774a84b1a9cd251f7bd7573))
* **settings:** add toggle for screen analysis feature ([c96d639](https://github.com/krtw00/duel-log-app/commit/c96d6399b7cb906d7a8180b021fa812ed6d74e8e))
* **ui:** add ML mode toggle and training data collection UI ([c3c0925](https://github.com/krtw00/duel-log-app/commit/c3c0925d3d6a6e445414b5214a3b4e7b3136c2f1))


### 🐛 Bug Fixes

* **backend:** fix ruff linting errors in admin code ([193bac2](https://github.com/krtw00/duel-log-app/commit/193bac2093fc7af1d8bb48a3132d4b30b7698a09))
* **backend:** fix test failures and deprecation warnings ([473bfff](https://github.com/krtw00/duel-log-app/commit/473bfff49ea4650f29c095b1fed8083e63117cf5))
* **ml:** update TensorFlow.js classification models ([2efdfd6](https://github.com/krtw00/duel-log-app/commit/2efdfd6ec517e9c59d1deef8752d00c5c281dec1))
* **screen-analysis:** adjust thresholds and remove downscale for low resolutions ([f7b3170](https://github.com/krtw00/duel-log-app/commit/f7b317089048c051afba548f63144c8df5211d4f))
* **screen-analysis:** reduce false positives in coin detection ([0022362](https://github.com/krtw00/duel-log-app/commit/002236221f36fff629a9751631ef2907f655cee1))


### 📝 Documentation

* remove obsolete image recognition planning document ([37adb1f](https://github.com/krtw00/duel-log-app/commit/37adb1f55797b1c7b227c4bc5cdb600d98e1031c))


### ♻️ Code Refactoring

* **frontend:** replace console.log/error with centralized logger ([cf94531](https://github.com/krtw00/duel-log-app/commit/cf94531db17a7c785ebd49be30183898198c6268))
* **ml:** add detailed logging for model loading ([68db2c9](https://github.com/krtw00/duel-log-app/commit/68db2c95e33ec3f27279fe7174a99bff3477a822))

## [1.9.0](https://github.com/krtw00/duel-log-app/compare/v1.8.0...v1.9.0) (2026-01-10)


### ✨ Features

* **frontend:** add description for screen analysis feature ([f986255](https://github.com/krtw00/duel-log-app/commit/f9862559d66591c7c2c3802ffafbb369a29f3918))


### 🐛 Bug Fixes

* **backend:** fix ruff linting errors in admin code ([f47e143](https://github.com/krtw00/duel-log-app/commit/f47e14319662fd4132f8547b2e5602cede00c80b))
* **backend:** fix test failures and deprecation warnings ([5d5d890](https://github.com/krtw00/duel-log-app/commit/5d5d89015783619bc32f45acab89293764872b77))

## [1.8.0](https://github.com/krtw00/duel-log-app/compare/v1.7.4...v1.8.0) (2026-01-10)


### ✨ Features

* **admin:** implement user management frontend ([69f4c3a](https://github.com/krtw00/duel-log-app/commit/69f4c3a91bd509b93098526836cc15c973f2133e))
* **admin:** implement Vuetify-based admin panel UI ([99ac6d8](https://github.com/krtw00/duel-log-app/commit/99ac6d8a87843f54b7c430ad46eb4e8cfb0e0f62))
* **backend:** implement auto-merge for archived decks ([012c375](https://github.com/krtw00/duel-log-app/commit/012c375cbd0c28a120aa2c3dcce31b5c5bed62d2))
* **backend:** implement user management API for admin panel ([e649851](https://github.com/krtw00/duel-log-app/commit/e6498514cb7c6f764196e3d19f7ce18d2ff937d0))


### 🐛 Bug Fixes

* **frontend:** clear opponent deck after duel registration ([51a6880](https://github.com/krtw00/duel-log-app/commit/51a68801f3bf2c67d11b7ded8e0c771058e5248e))


### 📝 Documentation

* add admin panel and archive merge design documents ([b3edce1](https://github.com/krtw00/duel-log-app/commit/b3edce1be3e022e0f8ed287e1ec735f7794c1d5d))

## [1.7.4](https://github.com/krtw00/duel-log-app/compare/v1.7.3...v1.7.4) (2026-01-09)


### 🐛 Bug Fixes

* **backend:** correct opponent_deck_id field name in merge script ([943aa18](https://github.com/krtw00/duel-log-app/commit/943aa186bc30574dc285f8524517aad8e1884fb4))

## [1.7.3](https://github.com/krtw00/duel-log-app/compare/v1.7.2...v1.7.3) (2026-01-09)


### 🐛 Bug Fixes

* **backend:** use correct field name in merge script ([4d90636](https://github.com/krtw00/duel-log-app/commit/4d9063623538223df12eb7d3279acdbb2d282219))

## [1.7.2](https://github.com/krtw00/duel-log-app/compare/v1.7.1...v1.7.2) (2026-01-09)


### 🐛 Bug Fixes

* **backend:** add exception chaining in admin router ([0dfe18c](https://github.com/krtw00/duel-log-app/commit/0dfe18ca7b25aefc8f6429f403c80bae33d09e21))

## [1.7.1](https://github.com/krtw00/duel-log-app/compare/v1.7.0...v1.7.1) (2026-01-09)


### 🐛 Bug Fixes

* **frontend:** add missing is_admin field in tests and types ([7d86bbb](https://github.com/krtw00/duel-log-app/commit/7d86bbb6d61a301d5be97fb7901c0ee476115e9f))

## [1.7.0](https://github.com/krtw00/duel-log-app/compare/v1.6.0...v1.7.0) (2026-01-09)


### ✨ Features

* add admin GUI with user-based authentication ([70337c0](https://github.com/krtw00/duel-log-app/commit/70337c0d03a1741574ca3b406033493ce9c1557b))

## [1.6.0](https://github.com/krtw00/duel-log-app/compare/v1.5.0...v1.6.0) (2026-01-09)


### ✨ Features

* **backend:** add script to merge duplicate archived decks ([2cbde05](https://github.com/krtw00/duel-log-app/commit/2cbde0573bb89f640a7ce40ac16af48ae3786bcb))


### 🐛 Bug Fixes

* **backend:** remove unused import in merge script ([99a5cba](https://github.com/krtw00/duel-log-app/commit/99a5cbaded42213bd95d88e2b4f589938924fbaa))
* **backend:** resolve linting errors in merge script ([aa4af99](https://github.com/krtw00/duel-log-app/commit/aa4af9987cd8f82275e97e1d485c3a234b67852e))

## [1.5.0](https://github.com/krtw00/duel-log-app/compare/v1.4.1...v1.5.0) (2026-01-09)


### ✨ Features

* **frontend:** persist new decks from edit dialog ([1417750](https://github.com/krtw00/duel-log-app/commit/14177508b0beba2035de45ed438fde07d09af4b5))


### 🐛 Bug Fixes

* **backend:** auto-stamp db when alembic_version is missing ([d2d58fe](https://github.com/krtw00/duel-log-app/commit/d2d58fe6a288c528916e13bf4adf86c87d7c575d))
* **frontend:** remove unused saveLastUsedValues ([1635d60](https://github.com/krtw00/duel-log-app/commit/1635d60d339cabf2ead0567abcb70bdfc520bd9c))
* **frontend:** restore saveLastUsedValues ([cf53d2c](https://github.com/krtw00/duel-log-app/commit/cf53d2c7da1330264dddd9c4c92e3d9dfdd3e7d8))


### 📝 Documentation

* **architecture:** add design for archive merge feature ([c8fbd27](https://github.com/krtw00/duel-log-app/commit/c8fbd2746ab1b701d0d44b2f8760944c85f6fec7))

## [1.4.1](https://github.com/krtw00/duel-log-app/compare/v1.4.0...v1.4.1) (2026-01-09)


### 🐛 Bug Fixes

* allow archived decks ([cf0b421](https://github.com/krtw00/duel-log-app/commit/cf0b421e341f64c154968713eca8b895fb9b6206))

## [1.4.0](https://github.com/krtw00/duel-log-app/compare/v1.3.3...v1.4.0) (2026-01-09)


### ✨ Features

* **frontend:** persist new decks from edit dialog ([b9109c5](https://github.com/krtw00/duel-log-app/commit/b9109c58af35d13b2285d104c4b85f5dd5277569))


### 🐛 Bug Fixes

* **frontend:** remove unused saveLastUsedValues ([64565f6](https://github.com/krtw00/duel-log-app/commit/64565f6fadf7a858b0012a19add8a5be3593b4aa))
* **frontend:** restore saveLastUsedValues ([0f7bcfb](https://github.com/krtw00/duel-log-app/commit/0f7bcfbd1181c435e895ad507d03efb7d4b8d4c6))

## [1.3.3](https://github.com/krtw00/duel-log-app/compare/v1.3.2...v1.3.3) (2026-01-09)


### 🐛 Bug Fixes

* **frontend:** hide archived deck options ([85a7341](https://github.com/krtw00/duel-log-app/commit/85a734148ad073f6ea6e66a941781c3cc1a99f0e))

## [1.3.2](https://github.com/krtw00/duel-log-app/compare/v1.3.1...v1.3.2) (2026-01-09)


### 🐛 Bug Fixes

* **security:** scope decks by user ([192dd5b](https://github.com/krtw00/duel-log-app/commit/192dd5ba472775e4e85224563a4d945cda7957a5))

## [1.3.1](https://github.com/krtw00/duel-log-app/compare/v1.3.0...v1.3.1) (2026-01-09)


### 🐛 Bug Fixes

* **frontend:** remove unused saveLastUsedValues ([47d0695](https://github.com/krtw00/duel-log-app/commit/47d0695ec499ea4e98d081fe1c5648f0c1d94a52))

## [1.3.0](https://github.com/krtw00/duel-log-app/compare/v1.2.1...v1.3.0) (2026-01-09)


### ✨ Features

* **frontend:** add duel entry screen analysis ([bf91edc](https://github.com/krtw00/duel-log-app/commit/bf91edce4b0a79e19bc21fc95757057b356f9ec2))


### 🐛 Bug Fixes

* **frontend:** hide game mode tabs in edit dialog ([c11caaa](https://github.com/krtw00/duel-log-app/commit/c11caaa65b6995c0e38273d3a0ef88f4f257bb62))
* **frontend:** hide screen analysis in edit dialog ([ce4a12f](https://github.com/krtw00/duel-log-app/commit/ce4a12f9d99a7bd851eb40c94b34e6e59e009725))
* **frontend:** resolve deck id after duplicate ([a0e821a](https://github.com/krtw00/duel-log-app/commit/a0e821ab31dc30dd247312e45e14537dd1bacb68))


### 📝 Documentation

* add screen recording analysis notes ([42f18ae](https://github.com/krtw00/duel-log-app/commit/42f18aeca46a3230c2abb62ed459d260c73bc63f))


### ♻️ Code Refactoring

* **frontend:** remove game mode tabs from duel form ([7d34983](https://github.com/krtw00/duel-log-app/commit/7d349838a253d9ff8be22c7c9ce38d55f609a8ee))

## [1.2.1](https://github.com/krtw00/duel-log-app/compare/v1.2.0...v1.2.1) (2026-01-09)


### 🐛 Bug Fixes

* **frontend:** clear opponent deck and adjust turn defaults ([c64cec9](https://github.com/krtw00/duel-log-app/commit/c64cec92cd3923a383fa2734b288144e19d233d5))

## [1.2.0](https://github.com/krtw00/duel-log-app/compare/v1.1.3...v1.2.0) (2026-01-08)


### ✨ Features

* add app logo link to shared statistics ([ac66947](https://github.com/krtw00/duel-log-app/commit/ac66947ab0689fd84eae45d0fd4cbce51df05682))
* add app logo link to shared statistics ([69796af](https://github.com/krtw00/duel-log-app/commit/69796af6d05d987e10914ebacca413bd74adaa2f))
* auto set turn order from coin ([6121117](https://github.com/krtw00/duel-log-app/commit/612111778b12d3f8ad80a1ec0e0e617071d1ef4f))
* coin default toggle near add duel ([7576bb0](https://github.com/krtw00/duel-log-app/commit/7576bb0fc49616746af152d32512290f05fc29c7))
* colorize matchup win rates ([551d5a7](https://github.com/krtw00/duel-log-app/commit/551d5a73bc026c21abbc3e04df06290b75c6a25d))
* colorize matchup win rates in statistics view ([5a04fff](https://github.com/krtw00/duel-log-app/commit/5a04fffaae5118965c3889fb10eb6ce8bf8900c9))
* colorize my deck win rates ([de4a8ee](https://github.com/krtw00/duel-log-app/commit/de4a8ee093020d73448916f9546616c6ae692274))
* improve win-rate color coding ([876a482](https://github.com/krtw00/duel-log-app/commit/876a482425d733884e31bda6cc2fae80eeb06a88))
* invert win-rate colors (advantage=blue) ([4d75264](https://github.com/krtw00/duel-log-app/commit/4d75264ce53c2575526eecb937088dcf350ed40a))
* keep statistics tab across navigation ([3857890](https://github.com/krtw00/duel-log-app/commit/385789093fa9d179eed24b13eef468a1bcbf78e3))
* show percentage in pie tooltip ([dae83af](https://github.com/krtw00/duel-log-app/commit/dae83af375eae5a3056391034045bff9e1fb905f))


### 🐛 Bug Fixes

* clear stale token when /me fails ([cdfdac4](https://github.com/krtw00/duel-log-app/commit/cdfdac45fdeb1fcd173287f22eedb3a0b21baee0))
* **deps:** FastAPI 0.127.0アップグレードに伴う修正 ([38d099c](https://github.com/krtw00/duel-log-app/commit/38d099c38a08f6de889fb9a0b493a7750b1c0a63))
* **deps:** vitest/coverage-v8を3.x系に戻し、型エラーを修正 ([1ac1892](https://github.com/krtw00/duel-log-app/commit/1ac1892479f7c3f27b459108b9511ce70bc00cbe))
* **dev:** make Vite proxy target configurable ([aee6f09](https://github.com/krtw00/duel-log-app/commit/aee6f09ee8c74d097bf8497f38eb2a4764cbecd0))
* enable /api proxy by using vite.config.js ([8c8e52d](https://github.com/krtw00/duel-log-app/commit/8c8e52d98d8667234c56f728fd87c122f6756671))
* ensure /api baseURL works with leading-slash paths ([a847b29](https://github.com/krtw00/duel-log-app/commit/a847b29557079265703eda1d13fb4f321d8e130b))
* **frontend:** avoid backend:8000 in browser dev ([ffe27ee](https://github.com/krtw00/duel-log-app/commit/ffe27ee42196776e86da4849a1d82adb233b4232))
* **frontend:** call /statistics without trailing slash ([bd07a8f](https://github.com/krtw00/duel-log-app/commit/bd07a8f0dc31621a997eb28d56ab61356b21ac8d))
* **frontend:** DCポイント入力で小数点を入力できないように修正 ([2975ab7](https://github.com/krtw00/duel-log-app/commit/2975ab7c430740464155a52a22f65dc5cb607ea8))
* **frontend:** default VITE_API_URL for tests ([0e380cf](https://github.com/krtw00/duel-log-app/commit/0e380cfbfb232e51fa25c97a5d9e2fe445445deb))
* **frontend:** resolve vue-tsc type errors ([926190e](https://github.com/krtw00/duel-log-app/commit/926190eeb075575089673b62882fc7ed870fd692))
* **frontend:** rewrite backend host in browser ([26f2b74](https://github.com/krtw00/duel-log-app/commit/26f2b74cada6449865057fb084a7c173c12609f9))
* harden dev login against bad API URL and CORS ([75257fc](https://github.com/krtw00/duel-log-app/commit/75257fcdcf20fa54c49dd5dbf252eaaa58dd1624))
* keep available decks sorted by name ([c074b50](https://github.com/krtw00/duel-log-app/commit/c074b50ca7b15784c1cb368418ae6a3a4c16bd92))
* make seed dc_value integer ([fcf7920](https://github.com/krtw00/duel-log-app/commit/fcf792027859c44b62381bab0e9b1994f42d4f49))
* prevent false login and proxy API in docker dev ([67f2c7d](https://github.com/krtw00/duel-log-app/commit/67f2c7dd9ed3142954b6bcc69e0c9f1c3899682b))
* show percent in pie hover ([14869d5](https://github.com/krtw00/duel-log-app/commit/14869d5feba1a6abfea657177b07d9044b9a0e4d))
* sort available decks by total duels ([0b47e78](https://github.com/krtw00/duel-log-app/commit/0b47e78bb3155509084174ef0c42bd02e8ef40a8))
* sort available decks by total duels ([c7790c2](https://github.com/krtw00/duel-log-app/commit/c7790c2cd0b8035e7ca56e5e59e0ffbbb6971af2))
* stabilize ci and build config ([1eeb56c](https://github.com/krtw00/duel-log-app/commit/1eeb56ce425b2d8fe30c7ab25e79030791aed718))
* stabilize dev auth via /api proxy ([4829421](https://github.com/krtw00/duel-log-app/commit/48294214082aa13bfd4fdc9e9aca43206685b23b))


### ♻️ Code Refactoring

* cleanup stats, auth, and layout ([375125e](https://github.com/krtw00/duel-log-app/commit/375125e979eb1f6848bde43beef43ce76d218bfe))

## [1.1.3](https://github.com/krtw00/duel-log-app/compare/v1.1.2...v1.1.3) (2026-01-07)


### 🐛 Bug Fixes

* reduce duel edit dialog lag ([50b9e0b](https://github.com/krtw00/duel-log-app/commit/50b9e0b446fcbecb82530e0568ce515fc6c65699))


### ⚡ Performance Improvements

* avoid full refresh after duel save ([eb19600](https://github.com/krtw00/duel-log-app/commit/eb196007bdc5e65baa31b9d5931d3b985e424509))
* reuse deck list to speed duel edit ([a129e68](https://github.com/krtw00/duel-log-app/commit/a129e68441bbcf6b1cb548f57d63bc822a710ad4))

## [1.1.2](https://github.com/krtw00/duel-log-app/compare/v1.1.1...v1.1.2) (2025-12-25)


### 🐛 Bug Fixes

* **frontend:** DCポイント入力で小数点を入力できないように修正 ([#227](https://github.com/krtw00/duel-log-app/issues/227)) ([ac78c31](https://github.com/krtw00/duel-log-app/commit/ac78c31384e2811f6eb1ced096124313b0dffc85)), closes [#225](https://github.com/krtw00/duel-log-app/issues/225)

## [1.1.1](https://github.com/krtw00/duel-log-app/compare/v1.1.0...v1.1.1) (2025-12-25)


### 🐛 Bug Fixes

* **duel:** DCポイントを整数型に変更 ([21baa17](https://github.com/krtw00/duel-log-app/commit/21baa17e1f251cf9aac0cbd60a4d6e21cc456542))

## [1.1.0](https://github.com/krtw00/duel-log-app/compare/v1.0.6...v1.1.0) (2025-12-19)


### ✨ Features

* **shared:** add link to main app from shared statistics page ([#162](https://github.com/krtw00/duel-log-app/issues/162)) ([192babd](https://github.com/krtw00/duel-log-app/commit/192babdd413a078895bde13a99253d0b40a75713))


### 🐛 Bug Fixes

* **auth:** すべてのリクエストで localStorage のトークンを Authorization ヘッダーに追加 ([f5e31f3](https://github.com/krtw00/duel-log-app/commit/f5e31f34d4b506846f073c2a1de74ecb74b68406))
* **auth:** ページロード時の Cookie タイミング問題で 401 が発生した際の自動ログアウト回避 ([b94b500](https://github.com/krtw00/duel-log-app/commit/b94b500f2d5cdc53451bc65c1ca4f0c5453deaba))
* **auth:** 未使用の shouldUseAuthorizationHeader 関数を削除 ([c006ff6](https://github.com/krtw00/duel-log-app/commit/c006ff6317d9bc96d14575d24abb976f61dc117e))
* **backend:** bcrypt 5.0.0のパスワード長制限に対応 ([#184](https://github.com/krtw00/duel-log-app/issues/184)) ([419183a](https://github.com/krtw00/duel-log-app/commit/419183a10f2d75aa90d2d33ffb583f71e9ad923f)), closes [#163](https://github.com/krtw00/duel-log-app/issues/163)
* **backend:** mypy型チェックエラーを修正 ([#183](https://github.com/krtw00/duel-log-app/issues/183)) ([285ac76](https://github.com/krtw00/duel-log-app/commit/285ac762a31219d904df4f88d838d086834e7739)), closes [#163](https://github.com/krtw00/duel-log-app/issues/163) [#162](https://github.com/krtw00/duel-log-app/issues/162)
* **duel:** DCタブでDCポイントが表示されない問題を修正 ([4b84689](https://github.com/krtw00/duel-log-app/commit/4b84689ccf9e2609cdc8d74612e71aa601ff101d))
* **duel:** EVENTモードの最新デッキ情報取得に対応 ([92b9ec3](https://github.com/krtw00/duel-log-app/commit/92b9ec339286c8e79045a07718471f4c65fad99a)), closes [#205](https://github.com/krtw00/duel-log-app/issues/205) [#205](https://github.com/krtw00/duel-log-app/issues/205)
* **frontend:** prevent login → error → redirect loop by making 401 logout conditional\n\n- Only logout on 401 if initialized AND either Authorization header or local token existed\n- Avoids over-eager logout on transient post-login requests (cookie timing)\n\nRefs: router guard + /auth/login flow ([1170bd1](https://github.com/krtw00/duel-log-app/commit/1170bd19026fd688c2f889213586321828b4e6e6))
* **frontend:** イベントタブでの対戦記録追加時にデッキが固定されない問題を修正 ([#205](https://github.com/krtw00/duel-log-app/issues/205)) ([10a644f](https://github.com/krtw00/duel-log-app/commit/10a644f82842ef1d64e860a64de1817f2c228dd1)), closes [#46](https://github.com/krtw00/duel-log-app/issues/46) [#46](https://github.com/krtw00/duel-log-app/issues/46)
* **frontend:** ログイン後にログイン画面に戻る不具合を修正 ([8b32239](https://github.com/krtw00/duel-log-app/commit/8b322397f7eaf7a679bd69f6bef7a0d32b441937))
* **frontend:** ログイン画面遷移不具合の修正 ([e1b0153](https://github.com/krtw00/duel-log-app/commit/e1b0153666600d7bb97b0e018033247c2aee51bb))
* **test:** useLatestDuelValues テストを修正 ([024fdb0](https://github.com/krtw00/duel-log-app/commit/024fdb0ddf377510a5cd421d3d25c77612263f27))


### ♻️ Code Refactoring

* **backend:** remove passlib dependency and use bcrypt directly ([#185](https://github.com/krtw00/duel-log-app/issues/185)) ([f7114e7](https://github.com/krtw00/duel-log-app/commit/f7114e7b047b3563f2bd6125b3f807629ea55341))

## [1.0.6](https://github.com/krtw00/duel-log-app/compare/v1.0.5...v1.0.6) (2025-11-08)


### 🐛 Bug Fixes

* **e2e:** E2E テスト安定性向上 - waitForLoadState を追加 ([bd81d51](https://github.com/krtw00/duel-log-app/commit/bd81d5148f163977f3552639499d794a7090ad3c))
* **e2e:** Playwright CI環境でのナビゲーションリンククリック失敗を解決 ([5b7454f](https://github.com/krtw00/duel-log-app/commit/5b7454f32ce79e85a9faa387e771532d499bad73))
* **e2e:** ナビゲーション テスト環境依存問題でスキップ ([9e0968e](https://github.com/krtw00/duel-log-app/commit/9e0968e82c416b512051c979dc955e0c04054a5c))
* **e2e:** ナビゲーション要素のクリック失敗を修正 ([78b9f2e](https://github.com/krtw00/duel-log-app/commit/78b9f2e3a6e659b656bd7bd8e64b8792066e8421))
* **e2e:** 認証テスト失敗を修正 - 登録後の自動ログイン処理 ([18c8bd9](https://github.com/krtw00/duel-log-app/commit/18c8bd905d63285e2dd9c50a502121afe08ab463))
* **format:** auth.py の85文字超える行を修正 ([e7ffa6e](https://github.com/krtw00/duel-log-app/commit/e7ffa6ecb111416288dffa8c6b1737853ea45cd2))
* **format:** auth.py の残りの Black フォーマット違反を修正 ([aa3a025](https://github.com/krtw00/duel-log-app/commit/aa3a0250bb67653f4cbe20a809abad8adde9dbcc))
* **format:** Black の期待するフォーマットに完全準拠 ([f12dcb8](https://github.com/krtw00/duel-log-app/commit/f12dcb88d54b3285a218056d2804a4ef86f1910e))
* **format:** Black フォーマット違反を修正 ([5fe41de](https://github.com/krtw00/duel-log-app/commit/5fe41de6c1fe665e823165ddb639d753b01a4a16))
* **lint:** Ruff F541 エラーを修正 ([05fa100](https://github.com/krtw00/duel-log-app/commit/05fa100542db5544e21032c80f1657e48ffc5046))
* **security:** Black フォーマッティング エラーを修正 ([e0f9ae3](https://github.com/krtw00/duel-log-app/commit/e0f9ae3223239242689ad8caa9a4637f5af73295))
* **security:** CodeQL セキュリティアラート 8 件を完全修正 ([d26e1db](https://github.com/krtw00/duel-log-app/commit/d26e1db051abb9d42243eae8ff8dd40679bb85d4))
* **security:** duels.py のログインジェクション修正（アラート [#14](https://github.com/krtw00/duel-log-app/issues/14)） ([cfd4990](https://github.com/krtw00/duel-log-app/commit/cfd4990891a86b0c7b210813428a4f54bb47f158))
* **security:** セキュリティアラート8件を修正 ([995b775](https://github.com/krtw00/duel-log-app/commit/995b77594d46a9eeeea5e5f84b8de4bff76e545f))
* **test:** conftest.py の Base インポート場所を修正 ([aef1cb7](https://github.com/krtw00/duel-log-app/commit/aef1cb77e061917b1de3acba83a4d1b9cbc5e2a0))


### 📝 Documentation

* **test:** conftest.py のインポート修正を明確にコメント追加 ([6a09a2f](https://github.com/krtw00/duel-log-app/commit/6a09a2f266f1e7acc2504ae7e502e6648f3dead5))

## [1.0.5](https://github.com/krtw00/duel-log-app/compare/v1.0.4...v1.0.5) (2025-11-07)


### 🐛 Bug Fixes

* **ci:** allow e2e backend cors for preview port ([707cd48](https://github.com/krtw00/duel-log-app/commit/707cd485fd256ed4d2e1502aa6d6019f5969c43f))
* **deps:** FastAPI 0.111.1+用にpython-multipartを追加 ([abf99db](https://github.com/krtw00/duel-log-app/commit/abf99db9cbdeb84d3b0bc3a93633b0c91ab6e3c8))
* make auth e2e selectors deterministic ([8d291bc](https://github.com/krtw00/duel-log-app/commit/8d291bc74bdbe8927da7fdf111c104d49280552f))
* route e2e api traffic via ipv4 loopback ([0cd4bfb](https://github.com/krtw00/duel-log-app/commit/0cd4bfbf4bbb7fdd5a35ff18786f75f66a1b72ff))
* stabilize codeql uploads and register form fields ([3c3cdad](https://github.com/krtw00/duel-log-app/commit/3c3cdaddffc6e67f0c7f020bd2408c8d7dd7820e))


### ⚡ Performance Improvements

* **ci:** Optimize E2E CI workflow execution time from 20min to 5-7min ([ba423ed](https://github.com/krtw00/duel-log-app/commit/ba423ed5e25aa53cf9a64e03d9f0228285aaec02))


### 📝 Documentation

* docs配下の古いコンテキストドキュメントを削除 ([2c9b4a2](https://github.com/krtw00/duel-log-app/commit/2c9b4a2a043f2a15e02a811aeca9aa10de9a878f))
* ドキュメントを用途別に階層化（案A） ([7cd9a9a](https://github.com/krtw00/duel-log-app/commit/7cd9a9aee7cfdc009df56acfdbf9dcf2a7f4339f))
* ドキュメント構成を整理・索引を最新化 ([8c9fdee](https://github.com/krtw00/duel-log-app/commit/8c9fdee0ff146ecfb65a1c7f82a8d5160508e317))

## [1.0.4](https://github.com/krtw00/duel-log-app/compare/v1.0.3...v1.0.4) (2025-11-07)


### 📝 Documentation

* コーディング規約ドキュメントを生成・整備 ([d191ad4](https://github.com/krtw00/duel-log-app/commit/d191ad4240d6407dfa7672b9d42c4f7eb7d135b5))

## [1.0.3](https://github.com/krtw00/duel-log-app/compare/v1.0.2...v1.0.3) (2025-11-07)


### 📝 Documentation

* GitHub通知設定ガイドを追加 ([808ea33](https://github.com/krtw00/duel-log-app/commit/808ea3353e20f9499356c1b4ff3bbf33aa04469a))

## [1.0.2](https://github.com/krtw00/duel-log-app/compare/v1.0.1...v1.0.2) (2025-11-07)


### 🐛 Bug Fixes

* **security:** CodeQLセキュリティアラート4件を修正 ([3b0cdb2](https://github.com/krtw00/duel-log-app/commit/3b0cdb2c3e9b74d26abaeb03d95e4d282520b787))

## [1.0.1](https://github.com/krtw00/duel-log-app/compare/v1.0.0...v1.0.1) (2025-11-07)


### 🐛 Bug Fixes

* developブランチからmainへの同期（セキュリティ修正・CI改善・Dependabot設定変更含む） ([#145](https://github.com/krtw00/duel-log-app/issues/145)) ([f49ebda](https://github.com/krtw00/duel-log-app/commit/f49ebdac6f03f06a5422cded6c5ff861e7ee9bc8))

## 1.0.0 (2025-11-07)


### ⚠ BREAKING CHANGES

* **ci:** CI/CD pipeline now requires additional secrets:
- CODECOV_TOKEN (optional): For code coverage reports
- PROJECT_TOKEN: Already configured for issue tracking

### ✨ Features

* **backend,frontend:** レート/DC値の小数点対応とOBS表示追加 ([126e718](https://github.com/krtw00/duel-log-app/commit/126e718d396b418c4fb23aaa2c380ab050ce288d))
* **backend:** Return all game mode statistics in shared endpoint ([242578a](https://github.com/krtw00/duel-log-app/commit/242578a29494e3214262baa42d24345216a2952a))
* **backend:** 命名規則統一化 - Phase 2完了 ([2871e44](https://github.com/krtw00/duel-log-app/commit/2871e44a56c7f6f3949fb38c3e9de609cf5f3ebe))
* **ci:** Add comprehensive CI/CD pipeline enhancements ([13cc628](https://github.com/krtw00/duel-log-app/commit/13cc628951ed6e36bf4f97abf2f8f30aeb85fd51))
* **ci:** CodeQLセキュリティ分析を日本語化 ([c1114bf](https://github.com/krtw00/duel-log-app/commit/c1114bfe05aa5039cf37ee1703fe4369bd8a8a59))
* **ci:** Localize PR auto-review messages to Japanese ([d63e176](https://github.com/krtw00/duel-log-app/commit/d63e1769c6478ddf946951918d83f019291ca425))
* **docs:** フェーズ2の可読性改善を完了 ([8c00baf](https://github.com/krtw00/duel-log-app/commit/8c00bafb44ae1672f15ac7b9636ce9125875aae3))
* **docs:** フェーズ3の可読性改善を完了 ([1738b60](https://github.com/krtw00/duel-log-app/commit/1738b60ba7e735a1e7147425abdc8d919fc88974))
* **e2e:** Add comprehensive Playwright E2E test suite ([2eda38b](https://github.com/krtw00/duel-log-app/commit/2eda38b3870199d138671372954499c705796f29))
* **frontend:** Align SharedStatisticsView with Dashboard and Statistics views ([9facefd](https://github.com/krtw00/duel-log-app/commit/9facefdfb2bf34ce8aaef5a86f78110fcd25dac0))
* **frontend:** Align SharedStatisticsView with Dashboard and Statistics views ([103e856](https://github.com/krtw00/duel-log-app/commit/103e8566c19f720f699b68b12aa4dd4f8563fed5))
* **frontend:** OBSオーバーレイにライト/ダークモードテーマ切り替え機能を追加 ([97f50b3](https://github.com/krtw00/duel-log-app/commit/97f50b3b972a3d466d788c6902a42886b87f6552))
* **frontend:** OBSオーバーレイにレート/DC表示項目を追加 ([47b474e](https://github.com/krtw00/duel-log-app/commit/47b474e72e7b8c5521a3185231ce779bca293046))
* **frontend:** OBS設定のゲームモードを必須化し初期値をランクに設定 ([da8eb7f](https://github.com/krtw00/duel-log-app/commit/da8eb7f3620ecaa5c0598068da6d1f8281f87fd6))
* **frontend:** unify snake_case naming convention ([a12bd8b](https://github.com/krtw00/duel-log-app/commit/a12bd8b4eda5aede030883db0077c3491b3c847a))
* **frontend:** Unify statistics filter across all views ([bb85e12](https://github.com/krtw00/duel-log-app/commit/bb85e12f55d56c2af5bf8edac6c6818aab5c5a54))
* **frontend:** ログアウト後にログイン画面へ遷移するように修正 ([907d6c6](https://github.com/krtw00/duel-log-app/commit/907d6c60e1f85adf7803bee2fb5a5f3f08eeb30a))
* **frontend:** 対戦記録の命名規則を改善 ([bb6a48c](https://github.com/krtw00/duel-log-app/commit/bb6a48c7b69bace0ab8a0a886446ea4966fcfeab))
* **github:** 日本語バグトラッキングシステムを追加 ([d46e938](https://github.com/krtw00/duel-log-app/commit/d46e9385640537085eec01d6195d5f8fd5a1cae9))
* OBS連携機能のパーセンテージ表示を修正 ([9091c5f](https://github.com/krtw00/duel-log-app/commit/9091c5fde99f36e52fdfb9a008e4fdc4cc383058))
* **statistics:** refactor value sequence charts ([7272ea0](https://github.com/krtw00/duel-log-app/commit/7272ea0fdcd4d8270a975db2e797dd13849ce65a))
* プロジェクトツールと設定ファイルを追加 ([3673585](https://github.com/krtw00/duel-log-app/commit/367358525f1af1d7c262094dc34aba7d2856c959))
* 共有統計ページのフィルタリングとOBSオーバーレイの改善 ([97c4bc5](https://github.com/krtw00/duel-log-app/commit/97c4bc564d4e1ce592217917e8b16d7b41036325))
* 新規戦績登録モーダルに最新のデッキ情報を自動反映 ([1794f2f](https://github.com/krtw00/duel-log-app/commit/1794f2f7e744df33b3bb998e9bdd64f4e4f54df6))
* 統計画面に月間対戦一覧を追加 ([c9e83ff](https://github.com/krtw00/duel-log-app/commit/c9e83ffc7f1ab517acc7136b64fe3468a9cdb32c))


### 🐛 Bug Fixes

* add urgent Docker rebuild script for migration issues ([ad4f881](https://github.com/krtw00/duel-log-app/commit/ad4f881d6a8ec73d3e585e7ff724eafcd7cd24bc))
* adjust shared statistics month boundary ([ca73fda](https://github.com/krtw00/duel-log-app/commit/ca73fdafb57fedc81e0f417da330a94a9917bfb3))
* **alembic:** alembicの多重ヘッド問題を修正 ([993a465](https://github.com/krtw00/duel-log-app/commit/993a465951080f21bb596113df24578afd658aad))
* **api:** ensure nested deck objects in duel response ([a899854](https://github.com/krtw00/duel-log-app/commit/a899854ebf38323f092f36cd07b452b7b6d8a1a1))
* **api:** 対戦履歴表示の不具合を修正 ([13bf5c2](https://github.com/krtw00/duel-log-app/commit/13bf5c23a5f663d2c543a08886b4a6fa23050a5b))
* **api:** 対戦履歴表示の不具合を完全に修正 ([5aae5ba](https://github.com/krtw00/duel-log-app/commit/5aae5baf16d6fb17e2c8f9037e6aa5759c724ec7))
* **auth:** correct UnauthorizedException parameter usage in deps.py ([15362ab](https://github.com/krtw00/duel-log-app/commit/15362abea884bb6a85c5b3f12c11bb140ed6628d))
* **auth:** MacOS環境での統計ページ認証エラーを修正 ([cafc2a6](https://github.com/krtw00/duel-log-app/commit/cafc2a63b6952b405335446513949dfcd6d33ee6))
* **backend:** add computed_field to DuelWithDeckNames schema ([c8cdf85](https://github.com/krtw00/duel-log-app/commit/c8cdf85bac0106f5489d700ba0f7fc9889a04f80))
* **backend:** add SharedStatisticsResponse schema ([e63e177](https://github.com/krtw00/duel-log-app/commit/e63e177f04e828c74b98266b8604c2113bc9da68))
* **backend:** Alembicの履歴分岐を解消 ([38b3523](https://github.com/krtw00/duel-log-app/commit/38b35235a1dfb4a292aabcf6c47529bfe84587d4))
* **backend:** align duel fields with naming convention ([224398b](https://github.com/krtw00/duel-log-app/commit/224398b1b0363ec3942cd931f60c5038e16bb519))
* **backend:** align duel fields with naming convention ([442842a](https://github.com/krtw00/duel-log-app/commit/442842acfc9795bfc1c467f05557aac7c1a4f65d))
* **backend:** align services with renamed duel fields ([67c72de](https://github.com/krtw00/duel-log-app/commit/67c72de5363a614e4600eba224ad995260a80bd8))
* **backend:** align tests with renamed duel fields ([61c8c31](https://github.com/krtw00/duel-log-app/commit/61c8c3148858a1b2a09d764383384e9ff4a1190f))
* **backend:** correct DuelWithDeckNames schema for response validation ([fee0cc3](https://github.com/krtw00/duel-log-app/commit/fee0cc3228b70e207f35c1bc516213f2d1443130))
* **backend:** correct keyword argument in get_user_duels call ([1a65dae](https://github.com/krtw00/duel-log-app/commit/1a65dae90acaf5306c8c2b869d835a9540418854))
* **backend:** Correct opponentDeck attribute access in shared_statistics endpoint ([f7b45ae](https://github.com/krtw00/duel-log-app/commit/f7b45aef6c3c4d333faeb8ed96f91685364e0b06))
* **backend:** Correct opponentDeck_id to opponent_deck_id in shared_statistics endpoint ([23c2644](https://github.com/krtw00/duel-log-app/commit/23c26446096127daa8801ff731a07c132387f874))
* **backend:** correct syntax error in shared_statistics_service ([3d24676](https://github.com/krtw00/duel-log-app/commit/3d246763abf3dce2f9abe1d303430fe06b8a4862))
* **backend:** correctly serialize duel objects in statistics response ([fa3ed13](https://github.com/krtw00/duel-log-app/commit/fa3ed13f57a30e4ca27ad428473a2ab801beabdb))
* **backend:** DBカラム名の不一致によるエラーを修正 ([a06cad0](https://github.com/krtw00/duel-log-app/commit/a06cad060b8dd14611cb496e17372fccc9dbd58a))
* **backend:** exit on migration failure in start.py ([90f33d0](https://github.com/krtw00/duel-log-app/commit/90f33d0698b756b146de42aeba20ab6c00f09223))
* **backend:** import joinedload in duel_service ([786e396](https://github.com/krtw00/duel-log-app/commit/786e396b4a6735b0a11c0bb3abaf5d4dc9c7ad79))
* **backend:** import statistics_service in statistics router ([62fd45b](https://github.com/krtw00/duel-log-app/commit/62fd45b6a1e617dac5d7b8be690754f64ef4dbc1))
* **backend:** include deck names in duel list endpoint ([88401d9](https://github.com/krtw00/duel-log-app/commit/88401d92d4a03617f23b3dfb3a37aa231d6e0fbc))
* **backend:** pass filter params to shared statistics endpoint ([a2936ae](https://github.com/krtw00/duel-log-app/commit/a2936ae9558fcdf8a4a17fa8ad477bd3844f63b4))
* **backend:** pass range filter params to shared statistics endpoint ([4ab9494](https://github.com/krtw00/duel-log-app/commit/4ab9494a32c894483e23daf8ee34b410cf41fcc2))
* **backend:** query_builders内の古いフィールド名参照を修正 ([8d1a508](https://github.com/krtw00/duel-log-app/commit/8d1a508b81baa4aa95e72871a7616cc52e9d7d9a))
* **backend:** resolve AttributeError in shared statistics endpoint ([cc7fd48](https://github.com/krtw00/duel-log-app/commit/cc7fd4839df2f70fd30e8e5b5138d4942ac83da2))
* **backend:** return statistics data in shared link endpoint ([3084798](https://github.com/krtw00/duel-log-app/commit/308479814022b47a034a687b47d65d57014dbafd))
* **backend:** statistics_serviceのフィールド名をopponentDeck_idに統一 ([3e208d9](https://github.com/krtw00/duel-log-app/commit/3e208d9716d66ee020b97899c072c3184217ed98))
* **backend:** use snake_case for opponent_deck_id query ([1fbe9b9](https://github.com/krtw00/duel-log-app/commit/1fbe9b92a0f3753481df928b38da90f26d70229e))
* **backend:** クエリビルダの属性エラーを修正 ([173c8ee](https://github.com/krtw00/duel-log-app/commit/173c8eec7226118252586424d3c70cd20168d546))
* **backend:** マイグレーションのdown_revisionを修正 ([503cca8](https://github.com/krtw00/duel-log-app/commit/503cca894b18d160e3693cce50f01b730616eef2))
* **backend:** モデルとDBスキーマのフィールド名を統一 ([b0b41ea](https://github.com/krtw00/duel-log-app/commit/b0b41eaf057c3db45915d6c064cf37b594f0fe41))
* **backend:** 対戦履歴取得時のバリデーションエラーを修正 ([de8ccf5](https://github.com/krtw00/duel-log-app/commit/de8ccf5b1e6e7d0a67a3ea66d5f16189a632f316))
* **backend:** 本番DBスキーマ(camelCase)に完全対応 ([f8a5a0a](https://github.com/krtw00/duel-log-app/commit/f8a5a0a0aaafe8e777a2979c26848d5ec6137ac5))
* **backend:** 本番環境のDBスキーマに合わせて競合するマイグレーションを削除 ([5389340](https://github.com/krtw00/duel-log-app/commit/538934076fa4e2ce688552b49ea924cfc6a7da8e))
* **ci:** Banditスキャンから開発用スクリプトを除外 ([9cbd920](https://github.com/krtw00/duel-log-app/commit/9cbd920d468d36232201afd3380efb4a6a04281f))
* **ci:** CI/CDワークフローのエラーを修正 ([3a3355a](https://github.com/krtw00/duel-log-app/commit/3a3355aea5aa0d0791c0fdfbbcd786ca58b005d0))
* **ci:** CIワークフローのエラーを修正 ([ef4e133](https://github.com/krtw00/duel-log-app/commit/ef4e1336ce4c087b1b6b4d30fed0a9bb0e74eb9e))
* **ci:** Docker/E2Eテストのデータベース接続エラーを修正 ([2da55a9](https://github.com/krtw00/duel-log-app/commit/2da55a9488492849c6eb50f88d9e516d1be12612))
* **ci:** ESLint v-slotエラーを修正 ([14515fd](https://github.com/krtw00/duel-log-app/commit/14515fdd658607af3894ba7336363ce5c3df60fd))
* **ci:** Fix PR auto-review workflow permissions and error handling ([5454aa1](https://github.com/krtw00/duel-log-app/commit/5454aa1b3aa98f0addf1300c37d4c5239b4ec1b5))
* **ci:** Pass github-token as input parameter instead of env variable ([8b9bf6f](https://github.com/krtw00/duel-log-app/commit/8b9bf6ff92fee87f3f88e20bef6ecb5bc2a76ec8))
* **ci:** Remove subject capitalization restriction from PR title check ([3661e01](https://github.com/krtw00/duel-log-app/commit/3661e01d456071ac3e52eb19595afde2d27a3a80))
* **ci:** Vercelのビルドエラーを修正し対戦履歴表示の不具合に対応 ([503cf04](https://github.com/krtw00/duel-log-app/commit/503cf04292d7703ebc0bd4bbe157086ce8bd58c8))
* **ci:** タイムゾーンとSQLite接続エラーを修正 ([5cce7d2](https://github.com/krtw00/duel-log-app/commit/5cce7d2d21f81293bae63952d8067cb887bf2212))
* **ci:** フロントエンドテスト・ビルドにVITE_API_URL環境変数を追加 ([e5cad86](https://github.com/krtw00/duel-log-app/commit/e5cad867853bf959c62ad8af79423cd3a8db50e8))
* **ci:** フロントエンドのCIテスト失敗を修正 ([ebe67c0](https://github.com/krtw00/duel-log-app/commit/ebe67c06e49b192c06fd44b9ecf096be5d9a2fdf))
* **ci:** ヘルスチェックエンドポイント修正とdevelopブランチのCI対応 ([2bbffc2](https://github.com/krtw00/duel-log-app/commit/2bbffc2d5feb875a50121fd30e5c4601ccfd3719))
* **ci:** 環境変数ファイル削除後のCI失敗を修正 ([4a7012e](https://github.com/krtw00/duel-log-app/commit/4a7012ece39e3ce5795b67b3a079ee19272f7ab1))
* **csv:** CSVインポート機能の修正と改善 ([4a2a119](https://github.com/krtw00/duel-log-app/commit/4a2a11940b58010f2491b3bde67ab96d5186945b))
* **docs:** pre-commit hooksのセットアップ手順を修正 ([cb5a5fa](https://github.com/krtw00/duel-log-app/commit/cb5a5fa70295c4d7d5688891be7c6a4139b46425))
* **docs:** 破損したnaming-convention-migration-plan.mdを修正 ([43be34f](https://github.com/krtw00/duel-log-app/commit/43be34fe9d5bfe8da0c4c0b3a3469cf165441bca))
* **frontend:** align apex value sequence typings ([1f72ce9](https://github.com/krtw00/duel-log-app/commit/1f72ce91a7daebc44eb2f6bbc7b7fe52ece2bc39))
* **frontend:** align with opponent_deck_id snake_case ([e7b0e64](https://github.com/krtw00/duel-log-app/commit/e7b0e6400ff2b30bd8815f1f9eb395d75eef26b2))
* **frontend:** Correct duel data display and submission ([6141502](https://github.com/krtw00/duel-log-app/commit/61415028061fbba347ccadcb4dce97f23921e858))
* **frontend:** correct test data and mocks for CI ([ddfb646](https://github.com/krtw00/duel-log-app/commit/ddfb6461cd3c1a53b84ee18b6edc97c97ebaafb7))
* **frontend:** correct typo in SharedStatisticsView ([5335416](https://github.com/krtw00/duel-log-app/commit/5335416005ad27bab75e6a001d6cc019af06d615))
* **frontend:** correctly map opponent_deck to opponentDeck ([2c7fbef](https://github.com/krtw00/duel-log-app/commit/2c7fbefc5b7bb81edb9a3bcbf845dcaf0f07d123))
* **frontend:** CSVインポートボタンが反応しない問題を修正 ([7883b5c](https://github.com/krtw00/duel-log-app/commit/7883b5c2e2681b469c429237eab16cb2a08ffe8e))
* **frontend:** fix unknown opponent deck display ([c318f28](https://github.com/krtw00/duel-log-app/commit/c318f28e6064cf6b2155f9c802cb5463721dc23f))
* **frontend:** improve opponent deck visibility in dark mode ([2213241](https://github.com/krtw00/duel-log-app/commit/22132416e42a75fe42d1e00ab10e5393ca73a03e))
* **frontend:** OBSStatsResponse型にcurrent_rateとcurrent_dcを追加 ([48c6de7](https://github.com/krtw00/duel-log-app/commit/48c6de736717a1e4076e0b13b30e8f92c8e86c9a))
* **frontend:** OBSオーバーレイページのみ背景を透明化するように修正 ([9a95c7f](https://github.com/krtw00/duel-log-app/commit/9a95c7f2c8392c2b6a197b84ac78f992347db2c9))
* **frontend:** OBS設定の表示項目にレートとDCを追加 ([59aa8e4](https://github.com/krtw00/duel-log-app/commit/59aa8e4a89e1ac8bb794d8bda5fbc11e98b2eb7c))
* **frontend:** remove stray code causing syntax error ([eea8eb8](https://github.com/krtw00/duel-log-app/commit/eea8eb82ab15d4047e9b37ed978c9eb584edfc6c))
* **frontend:** Remove unused ref import from useCSVOperations ([f16a3b2](https://github.com/krtw00/duel-log-app/commit/f16a3b23ad22935dc7d0239d4ea6da06a4e110a1))
* **frontend:** resolve build errors by updating references ([47bb72c](https://github.com/krtw00/duel-log-app/commit/47bb72c81b7088c05355c09c96b2e054516da6fe))
* **frontend:** resolve infinite loading state on network errors ([36db361](https://github.com/krtw00/duel-log-app/commit/36db3610b9b41dfb5b508c850f5f8b87b9ef466c))
* **frontend:** resolve vercel build errors ([f5f5155](https://github.com/krtw00/duel-log-app/commit/f5f5155349fb19ec09a8422f6e49f5ddd24da088))
* **frontend:** SharedStatisticsView の型エラーを修正 ([1ad01df](https://github.com/krtw00/duel-log-app/commit/1ad01df414cfd0e65a3373c3ec076284aa1c30c1))
* **frontend:** SharedStatisticsView.test.tsのテストを修正 ([b770432](https://github.com/krtw00/duel-log-app/commit/b77043236e3c586823fd83ea14f84c6960357595))
* **frontend:** update Duel interface to use opponent_deck_id ([2a12939](https://github.com/krtw00/duel-log-app/commit/2a12939f5a5db2d61ec21ad36867708683c35401))
* **frontend:** use snake_case for opponent_deck in DuelTable ([e823234](https://github.com/krtw00/duel-log-app/commit/e8232345a39f053cf50432583f4fe9d6ec727b7a))
* **frontend:** フロントエンドの起動とテーマ表示の問題を修正 ([647872e](https://github.com/krtw00/duel-log-app/commit/647872e1d5a376a2b0593945518e95d0c4baaadd))
* **frontend:** 共有統計ライトテーマの配色を調整 ([68cb8b0](https://github.com/krtw00/duel-log-app/commit/68cb8b05eeec9d1398bd970d30b99b786c75d2ce))
* **frontend:** 対戦履歴テーブルでデッキ名が表示されない問題を修正 ([0ee88ff](https://github.com/krtw00/duel-log-app/commit/0ee88ff348da95dad08d63029c857b211b656163))
* **migration:** correct column name from duel_date to played_date ([a6557ef](https://github.com/krtw00/duel-log-app/commit/a6557efae74c404475e40266b92429548f3e9888))
* **migration:** resolve duplicate index migration error ([61b5020](https://github.com/krtw00/duel-log-app/commit/61b5020a66f1525864f741089f19cf9b06a24625))
* **obs:** OBSオーバーレイのパーセント表示の小数点位置を修正 ([e8276fb](https://github.com/krtw00/duel-log-app/commit/e8276fb79d3ca50d0b01ce2755f74c315f112b5f))
* **obs:** OBSオーバーレイの表示問題を修正 ([2e13e99](https://github.com/krtw00/duel-log-app/commit/2e13e99e596a611d4b02f0c028fabca7e2a3f4bf))
* OBS連携機能でランク、レート、DCが正しく表示されるように修正 ([4068955](https://github.com/krtw00/duel-log-app/commit/4068955af1ed36502bab7b29089ebc4e565e11b0))
* resolve multiple alembic head revisions error ([4e859b4](https://github.com/krtw00/duel-log-app/commit/4e859b48d2331e221610c10e85ada15ac92e90d1))
* resolve timezone-aware datetime comparison issues ([1c0790c](https://github.com/krtw00/duel-log-app/commit/1c0790ca4eb99328832d2fcffce3fc096d0499f5))
* **security:** CodeQLセキュリティアラート6件を修正 ([02141a7](https://github.com/krtw00/duel-log-app/commit/02141a7b6ce94ce9d2576e58b2982c75bf359e22))
* **security:** Jinja2にautoescapeを有効化してXSS脆弱性を対策 ([c9a6d34](https://github.com/krtw00/duel-log-app/commit/c9a6d34c76066f7c00b5c4e5ad759599d71c67d5))
* **security:** 重大なセキュリティ問題と認証テストの追加 ([a3fff14](https://github.com/krtw00/duel-log-app/commit/a3fff146860e9eaad6495459234c11805fe9256a))
* **seed:** add timezone awareness to dummy data generation ([f900466](https://github.com/krtw00/duel-log-app/commit/f900466366908c2d2fa786df1b3eadd88c896f3a))
* **shared-link:** fix data filtering issue causing partial display ([6409771](https://github.com/krtw00/duel-log-app/commit/640977153e63c8fe57538df77c3ce06698bf6b89))
* **share:** resolve data loading issue in shared statistics view ([32579b0](https://github.com/krtw00/duel-log-app/commit/32579b0096c321d3843f5ba40eed0217ab527ad7))
* StatisticsView.vueの未使用変数を削除してビルドエラーを修正 ([3952a0e](https://github.com/krtw00/duel-log-app/commit/3952a0e781ded2ee4503a97ba02ebdfa2aec56a9))
* **test:** add conftest.py to resolve pytest import error ([78b2fe3](https://github.com/krtw00/duel-log-app/commit/78b2fe33b0ca80462bdce2745cb1eb38085e5af3))
* **tests:** mock Resend API to prevent CI failures ([4fa75f7](https://github.com/krtw00/duel-log-app/commit/4fa75f75c8638ad94d008d6d9c48526fb0bcfc44))
* **test:** SQLiteタイムゾーン問題の解決 ([c090d3b](https://github.com/krtw00/duel-log-app/commit/c090d3bf61a829f8cb42f348e113f0163ceda3eb))
* **tests:** resolve CI test failures ([a4e91ef](https://github.com/krtw00/duel-log-app/commit/a4e91ef14c946b21107085a73d26e13da6267ee6))
* **test:** test_duel_service.pyのタイムゾーンエラーを修正 ([cd3c74a](https://github.com/krtw00/duel-log-app/commit/cd3c74a8732f80a30d37cf46ddb88c1dfe45be09))
* **test:** test_query_builders.pyのファイル破損を修正 ([60f41d7](https://github.com/krtw00/duel-log-app/commit/60f41d736defb7a2a10c79dbf94007e722a6a778))
* TypeScriptビルドエラーを修正 ([e62887d](https://github.com/krtw00/duel-log-app/commit/e62887dcc9134c20702ebb73532b0abd2ccd8490))
* use 'alembic upgrade heads' instead of 'head' ([0b77f39](https://github.com/krtw00/duel-log-app/commit/0b77f39df79b50c48133ae385d53c13a29333618))
* アクション列の表示制御を調整 ([70acfb7](https://github.com/krtw00/duel-log-app/commit/70acfb784c5f0239b8a8d00870e078e3c1baa1c9))
* シードデータ投入処理の修正 ([bbbfd1e](https://github.com/krtw00/duel-log-app/commit/bbbfd1eaabf1dafed50e14ee581bca820ab875e8))
* テスト実行の失敗要因を修正 ([7045506](https://github.com/krtw00/duel-log-app/commit/704550642e1b51db0e9e2395b9753cf221bd9238))
* ログアウト処理を全面的に見直し、認証の脆弱性を完全に修正 ([0bb144b](https://github.com/krtw00/duel-log-app/commit/0bb144bd64c518f529c0da32288b0f6d68653819))
* ログアウト処理を厳格化し、自動再ログインの脆弱性を完全に修正 ([d8d6ec1](https://github.com/krtw00/duel-log-app/commit/d8d6ec17e9c34c500ddb5c5623cfd7a2466bf0e6))
* ログアウト後の自動再ログインの脆弱性を修正 ([26e6658](https://github.com/krtw00/duel-log-app/commit/26e66583922a46a19282c99f7f23c2b7dcbb0014))
* ログアウト後の自動再ログインの脆弱性を完全に修正 ([9d0676b](https://github.com/krtw00/duel-log-app/commit/9d0676b4d2c935b2fc79e9fc55d0af2a911db2c9))
* ログアウト後も認証状態が維持される問題を修正 ([104c470](https://github.com/krtw00/duel-log-app/commit/104c470f84176450ef5bf196681bbe265e9e5cd2))
* 共有リンクの有効期限が1日前になる問題を修正 ([90539c3](https://github.com/krtw00/duel-log-app/commit/90539c3d482114094424a3e73fec9a256f86fe61))
* 月の切り替え時間をゲームの仕様(7:59)に合わせて調整 ([0fd1219](https://github.com/krtw00/duel-log-app/commit/0fd1219ab1c2d5139dce23dfb0d7001c1f2a587f))
* 月の境界を7:59:00ジャストに変更 ([250890b](https://github.com/krtw00/duel-log-app/commit/250890b22c98d43a79233f5085513debad102048))
* 月間対戦一覧の列表示を整理 ([97aa0c5](https://github.com/krtw00/duel-log-app/commit/97aa0c5a63c04285091cec90397b267cbb401254))
* 本番環境エラー修正（Cookie + NeonDB SSL + start.py最適化） ([14baff1](https://github.com/krtw00/duel-log-app/commit/14baff1e4ab064ee4b69a75aa0d487b0f4bd99ca))


### ⚡ Performance Improvements

* パフォーマンスとエラーハンドリングの改善 ([6082f53](https://github.com/krtw00/duel-log-app/commit/6082f53838bf487e878544149ac121755db0b5d4))


### ⏪ Reverts

* README.md to previous state ([edc106f](https://github.com/krtw00/duel-log-app/commit/edc106f55b1298266f1d2074f9c1adfb02458f8a))


### 📝 Documentation

* add agent contributor guide ([112597f](https://github.com/krtw00/duel-log-app/commit/112597fd84b5cbad6404ce86e9ea03a35e690b8c))
* add architecture documents and update db-schema ([478e124](https://github.com/krtw00/duel-log-app/commit/478e124d6d99db0d3c13cdbf3f2070e521d66d89))
* add detailed migration fix instructions ([91d2f79](https://github.com/krtw00/duel-log-app/commit/91d2f79577b368ed702173e6b4055eca4e311f08))
* **backend:** deck_service.pyに詳細なdocstringとコメントを追加 ([8c628d1](https://github.com/krtw00/duel-log-app/commit/8c628d1da624b883d465e5e94c28f4124976147a))
* **backend:** Phase 1.1 - バックエンドサービスに詳細なdocstringとコメントを追加 ([9252212](https://github.com/krtw00/duel-log-app/commit/925221216c22b4a673ff2b1e1ff140785d768285))
* **backend:** time_series_service.pyに詳細なdocstringとコメントを追加 ([62047ab](https://github.com/krtw00/duel-log-app/commit/62047abeaa782ed60a3a800197e776a840a644cb))
* **ci:** GitHub Copilot設定を最新情報に更新 ([3017de1](https://github.com/krtw00/duel-log-app/commit/3017de1479a93daced0c644bbc6aa1886decb05a))
* **development-guide:** ブランチ命名規則を追記 ([093ad8f](https://github.com/krtw00/duel-log-app/commit/093ad8f148b793d0298f70b305938b871e2590d6))
* **development-tutorial.md:** チュートリアル新規作成 ([4932e10](https://github.com/krtw00/duel-log-app/commit/4932e102a76aa65b9a445d54daabd26ca12015c8))
* **frontend:** Composablesに詳細なJSDocを追加 ([899cbc6](https://github.com/krtw00/duel-log-app/commit/899cbc6625ef08a66cf3b63a8d752665c8968046))
* **frontend:** DashboardView.vueにドキュメント追加 ([27256e2](https://github.com/krtw00/duel-log-app/commit/27256e2e628aa20d480dd72a28a1fccd695c96c7))
* **frontend:** DuelFormDialog.vueにドキュメント追加 ([1fcabda](https://github.com/krtw00/duel-log-app/commit/1fcabda2b93ec6f889eb044439a1facbed6028b3))
* improve SECRET_KEY generation instructions in .env.example ([88171ef](https://github.com/krtw00/duel-log-app/commit/88171ef44ba9f0ca0686aa0afea0ddc3bc9f402f))
* **models:** Phase 1.3 - モデル定義とTypeScript型に詳細なコメントを追加 ([e83ef2c](https://github.com/krtw00/duel-log-app/commit/e83ef2cd9f1b072f0a88a1797b8c68a14969cbd2))
* Phase 1完了を反映したロードマップ更新 ([664912a](https://github.com/krtw00/duel-log-app/commit/664912a744ef9f9caadf47adfc0a5ba475be3159))
* Phase 1進捗を可読性向上ロードマップに反映 ([9c3f65b](https://github.com/krtw00/duel-log-app/commit/9c3f65bf643c8cec2070397c1f15950827686dfb))
* **phase1:** モデルと型定義にドキュメントを追加（命名規則は維持） ([f79cb59](https://github.com/krtw00/duel-log-app/commit/f79cb597db30fdee639d93f19feff3b60ae7e41e))
* pre-commit hooksのセットアップ手順をREADMEに追加 ([3161cd0](https://github.com/krtw00/duel-log-app/commit/3161cd0267c32f0e659082b1ea8042cec1231a60))
* **readme:** Git運用ルールを追記 ([7bc790d](https://github.com/krtw00/duel-log-app/commit/7bc790df6be0ab37f140068fb7e1836c901a45ed))
* **readme:** OBS機能の説明を更新し、機能一覧を拡充 ([fbfec02](https://github.com/krtw00/duel-log-app/commit/fbfec0200e755cf4f73d92a80fd948594e42f35d))
* **readme:** WSL開発環境セットアップ手順を更新 ([76d1abb](https://github.com/krtw00/duel-log-app/commit/76d1abb9678097de7c13d6bf0b1a0a0177374c71))
* READMEのOBSオーバーレイ機能に関する記述を更新 ([9990247](https://github.com/krtw00/duel-log-app/commit/999024743a0a210df56221d1e57a4a85b1d7115a))
* **readme:** 技術スタックの情報を更新 ([18ee1dc](https://github.com/krtw00/duel-log-app/commit/18ee1dcd3cbc592b1bd3ae1e812afa9f80d9c791))
* **readme:** 開発環境のセットアップ手順を更新 ([27ee0ed](https://github.com/krtw00/duel-log-app/commit/27ee0ed4ad3153949e984e3c1860be542512a618))
* recommend base64 format for SECRET_KEY generation ([475f308](https://github.com/krtw00/duel-log-app/commit/475f3080907e1b7d37be7fb1e3c692550bf0f2d0))
* update branch name examples to English ([6aab6f3](https://github.com/krtw00/duel-log-app/commit/6aab6f3690f7f74483aa3a18223f1d724b3ade51))
* コーディング規約を追加 ([13d3db7](https://github.com/krtw00/duel-log-app/commit/13d3db7af5eb672b4532e8d4abc25fe1ced975a4))
* コード可読性向上のための包括的なドキュメントとサンプル実装を追加 ([cf34b49](https://github.com/krtw00/duel-log-app/commit/cf34b497a54cfcf4cafcb5a6ff0a3dd0a6931a59))
* ドキュメントを最新の実装に合わせて更新 ([ad5443a](https://github.com/krtw00/duel-log-app/commit/ad5443a2c0115ef7d6c4fe2d646d05b2b60a583a))
* ブランチ戦略をGitFlowベースのフローに更新 ([2f84a22](https://github.com/krtw00/duel-log-app/commit/2f84a22df19eeab8a669b1d8b933e31034e37418))
* ロードマップのフェーズ完了状況を更新 ([118f9cf](https://github.com/krtw00/duel-log-app/commit/118f9cf5b15eccfc320097d42cb450404ad9ce97))
* 不要になったドキュメントファイルを削除 ([b49bce9](https://github.com/krtw00/duel-log-app/commit/b49bce9fc44809fd45de88d831f4d3ab2960bae7))
* 命名規則統一化の詳細な移行計画を策定 ([1592f54](https://github.com/krtw00/duel-log-app/commit/1592f54986714dc02d7f8a9ccf32ecd1bf4972ed))
* 開発環境のセットアップ手順にフロントエンドのenv設定を追加 ([42e5148](https://github.com/krtw00/duel-log-app/commit/42e51486a7d59d4ac7b369c0a9b27b88c08950d3))


### ♻️ Code Refactoring

* **backend:** Create query builder utility for common filters ([bec5145](https://github.com/krtw00/duel-log-app/commit/bec514565afd9ebad3ca33d6f0446e7ac8e48759))
* **backend:** Duelモデルのカラム名を明確化し、docstring検証を無効化 ([34896bf](https://github.com/krtw00/duel-log-app/commit/34896bf998fe6e3b8f88ddb34ebd40785469a393))
* **backend:** Extract CSV processing logic to dedicated service ([9482e0c](https://github.com/krtw00/duel-log-app/commit/9482e0c5df9d9159da1f6511b3915ec0bda65440))
* **backend:** Extract DeckDistributionService from StatisticsService ([912786a](https://github.com/krtw00/duel-log-app/commit/912786a3ba6297b02d49f704a584edab0b697374))
* **backend:** Extract GeneralStatsService from StatisticsService ([8e0dc7f](https://github.com/krtw00/duel-log-app/commit/8e0dc7fc696ac88b81340ab52ccd573c6faf8bd7))
* **backend:** Extract MatchupService from StatisticsService ([afada32](https://github.com/krtw00/duel-log-app/commit/afada32347f926691f9df0c92ce39b83c3a961c8))
* **backend:** Extract rank conversion logic to utility module ([7962d88](https://github.com/krtw00/duel-log-app/commit/7962d88beef29322772aa70b1891f41521e6e9d3))
* **backend:** Extract TimeSeriesService from StatisticsService ([b94a5c6](https://github.com/krtw00/duel-log-app/commit/b94a5c67cf3e435e91d07d179c3e54557baf0967))
* **backend:** Extract WinRateService from StatisticsService ([27dfab5](https://github.com/krtw00/duel-log-app/commit/27dfab51e8b1a57a615b09339a0a45ba572bf78d))
* **backend:** Reduce code duplication in get_latest_duel_values ([51e0280](https://github.com/krtw00/duel-log-app/commit/51e028015f2deec69aae194977d8d74bf1b52f85))
* **backend:** クエリビルダーにヘルパー関数を追加 ([1a16f44](https://github.com/krtw00/duel-log-app/commit/1a16f44241dfa022f939eba2972dfd15f04331ac))
* **backend:** クエリビルダーユーティリティを作成 ([6b6b8a5](https://github.com/krtw00/duel-log-app/commit/6b6b8a5d1ec6d9f1d60e141564f695e4affbc198))
* **backend:** サービスで共通クエリビルダーを使用 ([110f950](https://github.com/krtw00/duel-log-app/commit/110f950abe481c23307f3f9e7927a8acd38e17e9))
* **backend:** 統計サービスのデッキ分布計算を改善 ([027a46b](https://github.com/krtw00/duel-log-app/commit/027a46b80afd9f4a67d9baf5fcc52db016d2acc0))
* **backend:** 統計サービスの改善とテスト追加 ([2412dcd](https://github.com/krtw00/duel-log-app/commit/2412dcd34d4523ebc2106c7fd9421f217f0d3bb2))
* **backend:** 統計サービスの直近デッキ分布計算を改善 ([fac1cce](https://github.com/krtw00/duel-log-app/commit/fac1ccecfddb11b22a0315864f75f6e31e24eed1))
* DashboardView.vueを350行に削減 (1,212行→370行) ([cef280f](https://github.com/krtw00/duel-log-app/commit/cef280f8ac79df81f6481bd6dbeb818982db4a9d))
* DashboardView用のComposablesを作成 ([f931527](https://github.com/krtw00/duel-log-app/commit/f931527b33fa3f70491ea77ad848cb3a0579a2a8))
* DashboardView用のUIコンポーネントを作成 ([956e9fe](https://github.com/krtw00/duel-log-app/commit/956e9fedde3e2afa35c1a8e2d13bb43c14011f68))
* **frontend:** remove unnecessary deck fetching in DashboardView ([abc0f6f](https://github.com/krtw00/duel-log-app/commit/abc0f6f007dbaf971fa24368c6043e7e7bc95613))
* **frontend:** フロントエンドの型安全性を向上 ([3c5f2fe](https://github.com/krtw00/duel-log-app/commit/3c5f2fed85b89fd6e21001b5473ec9c09b72785b))
* OBS統計値取得ロジックのリファクタリングとフォーマット改善 ([d4a1952](https://github.com/krtw00/duel-log-app/commit/d4a1952a6a10480b07ab9336d0f24d1a9558a2fe))
* Phase 4 - 型安全性の強化（Part 1） ([1da14a8](https://github.com/krtw00/duel-log-app/commit/1da14a84c0dc90a829b1ffb4474541727582fc71))
* Phase 4 - 型安全性の強化（Part 2） ([d668598](https://github.com/krtw00/duel-log-app/commit/d668598520ea8f0cf360431a0eb2894252d29def))
* Phase 4b & 5 - TypeScript型安全性向上とコンポーネント分割 ([42fe348](https://github.com/krtw00/duel-log-app/commit/42fe34886c9667af33147f98419c4b47ff507448))
* Phase 5 - 大規模コンポーネントの分割（部分実施） ([a4be599](https://github.com/krtw00/duel-log-app/commit/a4be5993bef4320d960fe184e79084c2ccfc046b))
* Phase 6 - コードの重複削除 ([ef0ebf9](https://github.com/krtw00/duel-log-app/commit/ef0ebf9149f80234040921e1fbfdf63d322b8eba))
* Phase 7-9 - エラーハンドリング統一化、any型削減、テストカバレッジ向上 ([f976653](https://github.com/krtw00/duel-log-app/commit/f976653d7df3e52f5d0cdee7f288d9176d96cbb6))
* **phase2:** クエリビルダーを共通化してコード重複を削減 ([1147152](https://github.com/krtw00/duel-log-app/commit/1147152246b83f4ab2a9097d2fad61be457a50ee))
* フロントエンドに共通ユーティリティと型定義を追加 ([f0ad220](https://github.com/krtw00/duel-log-app/commit/f0ad220555eaefa5dd6ed7785d661a066dc27289))
