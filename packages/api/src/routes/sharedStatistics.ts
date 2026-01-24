import { createSharedStatisticsSchema, statisticsFilterSchema } from '@duel-log/shared';
import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import * as sharedStatsService from '../services/sharedStatistics.js';
import * as statsService from '../services/statistics.js';

type Env = { Variables: { user: AuthUser } };

export const sharedStatisticsRoutes = new Hono<Env>()
  // 認証必要
  .post('/', authMiddleware, async (c) => {
    const { id } = c.get('user');
    const body = await c.req.json();
    const data = createSharedStatisticsSchema.parse(body);
    const created = await sharedStatsService.createSharedStats(id, data);
    return c.json({ data: created }, 201);
  })
  .delete('/:token', authMiddleware, async (c) => {
    const { id } = c.get('user');
    const token = c.req.param('token');
    const deleted = await sharedStatsService.deleteSharedStats(id, token);
    if (!deleted) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Shared statistics not found' } }, 404);
    }
    return c.json({ data: { message: 'Deleted' } });
  })
  // 認証不要（公開エンドポイント）
  .get('/:token', async (c) => {
    const token = c.req.param('token');
    const stats = await sharedStatsService.getSharedStats(token);
    if (!stats) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'Shared statistics not found or expired' } },
        404,
      );
    }

    const filter = statisticsFilterSchema.parse(stats.filters ?? {});
    const [overview, winRates, matchups, duels, displayName] = await Promise.all([
      statsService.getOverview(stats.userId, filter),
      statsService.getWinRates(stats.userId, filter),
      statsService.getMatchups(stats.userId, filter),
      statsService.getDuelHistory(stats.userId, filter),
      statsService.getUserDisplayName(stats.userId),
    ]);

    return c.json({
      data: {
        overview,
        winRates,
        matchups,
        duels,
        displayName,
        filters: stats.filters,
        expiresAt: stats.expiresAt,
      },
    });
  })
  .get('/:token/export/csv', async (c) => {
    const token = c.req.param('token');
    const stats = await sharedStatsService.getSharedStats(token);
    if (!stats) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'Shared statistics not found or expired' } },
        404,
      );
    }

    const filter = statisticsFilterSchema.parse(stats.filters ?? {});
    const overview = await statsService.getOverview(stats.userId, filter);

    const csv = [
      'metric,value',
      `totalDuels,${overview.totalDuels}`,
      `wins,${overview.wins}`,
      `losses,${overview.losses}`,
      `winRate,${overview.winRate}`,
      `firstRate,${overview.firstRate}`,
      `coinTossWinRate,${overview.coinTossWinRate}`,
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="shared-statistics.csv"',
      },
    });
  });
