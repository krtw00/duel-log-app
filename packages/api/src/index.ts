import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { adminMiddleware } from './middleware/admin.js';
import { authMiddleware } from './middleware/auth.js';
import { errorMiddleware } from './middleware/error.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { deckRoutes } from './routes/decks.js';
import { duelRoutes } from './routes/duels.js';
import { feedbackRoutes } from './routes/feedback.js';
import { meRoutes } from './routes/me.js';
import { obsRoutes } from './routes/obs.js';
import { sharedStatisticsRoutes } from './routes/sharedStatistics.js';
import { statisticsRoutes } from './routes/statistics.js';

const app = new Hono().basePath('/api');

// ヘルスチェック（ミドルウェア前）
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// グローバルミドルウェア
app.use('*', logger());
app.use('*', cors());
app.use('*', errorMiddleware);

// 認証不要ルート（sharedStatisticsRoutesが内部でauth制御）
app.route('/shared-statistics', sharedStatisticsRoutes);

// OBSルート（/obs/stats はトークン認証、/obs/token は Supabase Auth 認証）
app.use('/obs/token', authMiddleware);
app.route('/obs', obsRoutes);

// 認証必要ルート
app.use('/auth/*', authMiddleware);
app.use('/me/*', authMiddleware);
app.use('/me', authMiddleware);
app.use('/decks/*', authMiddleware);
app.use('/decks', authMiddleware);
app.use('/duels/*', authMiddleware);
app.use('/duels', authMiddleware);
app.use('/statistics/*', authMiddleware);
app.use('/feedback', authMiddleware);

app.route('/auth', authRoutes);
app.route('/me', meRoutes);
app.route('/decks', deckRoutes);
app.route('/duels', duelRoutes);
app.route('/statistics', statisticsRoutes);
app.route('/feedback', feedbackRoutes);

// 管理者ルート
app.use('/admin/*', authMiddleware);
app.use('/admin/*', adminMiddleware);
app.route('/admin', adminRoutes);

export default app;
