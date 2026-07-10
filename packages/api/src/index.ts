import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { sql } from './db/index.js';
import { adminMiddleware } from './middleware/admin.js';
import { authMiddleware } from './middleware/auth.js';
import { csrfMiddleware } from './middleware/csrf.js';
import { errorMiddleware, handleError } from './middleware/error.js';
import { maintenanceMiddleware } from './middleware/maintenance.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { debugRoutes } from './routes/debug.js';
import { deckRoutes } from './routes/decks.js';
import { duelRoutes } from './routes/duels.js';
import { feedbackRoutes } from './routes/feedback.js';
import { handtrapCardRoutes } from './routes/handtrapCards.js';
import { meRoutes } from './routes/me.js';
import { obsRoutes } from './routes/obs.js';
import { sharedStatisticsRoutes } from './routes/sharedStatistics.js';
import { statisticsRoutes } from './routes/statistics.js';

// cookie 認証は credentials 付きリクエストになるため、許可 origin を明示する
// （`origin: *` + credentials はブラウザ仕様で不可）。本番/staging/dev を env で列挙。
const ALLOWED_ORIGINS = (
  process.env.CORS_ALLOWED_ORIGINS ||
  process.env.WEB_URL ||
  'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = new Hono().basePath('/api');

// マウント済みサブアプリの throw はミドルウェア try/catch に届かないため onError で捕捉する
app.onError((err, c) => handleError(err, c));

// ヘルスチェック（ミドルウェア前）
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/health/db', async (c) => {
  try {
    const [row] = await sql<{ ok: number }[]>`SELECT 1 AS ok`;
    return c.json({ status: 'ok', db: row?.ok ?? 0, timestamp: new Date().toISOString() });
  } catch (err) {
    return c.json(
      {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
});

// グローバルミドルウェア
app.use(
  '*',
  logger((message) => console.log(message.replace(/(\s\/[^?\s]*)\?[^\s]*/u, '$1'))),
);
app.use('*', cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use('*', errorMiddleware);
app.use('*', maintenanceMiddleware);
// 認証系エンドポイントの rate limit（bot 連打によるメール送信課金 / ブルートフォース対策）。
// basePath('/api') 適用下のパス指定なので '/api' を含めない（含めると /api/api/auth/* になり一致しない）。
app.use('/auth/*', rateLimitMiddleware);
app.use('*', csrfMiddleware);

// 認証不要ルート（sharedStatisticsRoutesが内部でauth制御）
app.route('/shared-statistics', sharedStatisticsRoutes);

// OBSルート（/obs/stats はトークン認証、/obs/token は通常認証）
app.use('/obs/token', authMiddleware);
app.route('/obs', obsRoutes);

// 認証必要ルート
app.use('/debug/*', authMiddleware);
app.use('/me/*', authMiddleware);
app.use('/me', authMiddleware);
app.use('/decks/*', authMiddleware);
app.use('/decks', authMiddleware);
app.use('/duels/*', authMiddleware);
app.use('/duels', authMiddleware);
app.use('/statistics/*', authMiddleware);
app.use('/handtrap-cards/*', authMiddleware);
app.use('/handtrap-cards', authMiddleware);
app.use('/feedback', authMiddleware);

app.route('/auth', authRoutes);
app.route('/debug', debugRoutes);
app.route('/me', meRoutes);
app.route('/decks', deckRoutes);
app.route('/duels', duelRoutes);
app.route('/statistics', statisticsRoutes);
app.route('/handtrap-cards', handtrapCardRoutes);
app.route('/feedback', feedbackRoutes);

// 管理者ルート
app.use('/admin/*', authMiddleware);
app.use('/admin/*', adminMiddleware);
app.route('/admin', adminRoutes);

export default app;
