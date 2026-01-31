import type { GameMode, StatisticsFilter } from '@duel-log/shared';
import { GAME_MODES } from '@duel-log/shared';
import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { sql } from '../db/index.js';
import type { DeckRow } from '../db/types.js';
import type { AuthUser } from '../middleware/auth.js';
import * as duelService from '../services/duel.js';
import * as statsService from '../services/statistics.js';

type Env = { Variables: { user: AuthUser } };

const getSecret = (): string => {
  const secret = process.env.OBS_TOKEN_SECRET || process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    // Fallback for local development only
    if (process.env.NODE_ENV !== 'production') {
      return 'obs-dev-secret-key-do-not-use-in-production';
    }
    throw new Error('OBS_TOKEN_SECRET or SUPABASE_JWT_SECRET is required');
  }
  return secret;
};

export const obsRoutes = new Hono<Env>()
  .post('/token', async (c) => {
    const { id } = c.get('user');
    const secret = getSecret();
    const token = await sign({ sub: id, iat: Math.floor(Date.now() / 1000) }, secret);
    return c.json({ token });
  })
  .get('/stats', async (c) => {
    const token = c.req.query('token');
    if (!token) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Token is required' } }, 401);
    }

    let userId: string;
    try {
      const secret = getSecret();
      const payload = await verify(token, secret, { alg: 'HS256', exp: false });
      if (!payload.sub || typeof payload.sub !== 'string') {
        return c.json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } }, 401);
      }
      userId = payload.sub;
    } catch {
      return c.json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } }, 401);
    }

    const gameModeParam = c.req.query('game_mode') || undefined;
    const statsPeriod = c.req.query('stats_period') || 'monthly';
    const recentCount = Math.min(Math.max(Number(c.req.query('recent_count')) || 10, 1), 30);

    const gameMode: GameMode | undefined =
      gameModeParam && (GAME_MODES as readonly string[]).includes(gameModeParam)
        ? (gameModeParam as GameMode)
        : undefined;

    const filter: StatisticsFilter = {};
    if (gameMode) filter.gameMode = gameMode;

    if (statsPeriod === 'session') {
      const fromTimestamp = c.req.query('from_timestamp');
      if (fromTimestamp) filter.fromTimestamp = fromTimestamp;
    } else {
      // monthly (default)
      const now = new Date();
      filter.from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      filter.to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    }

    try {
      const [overview, streaks, duelsResult, recentDuels] = await Promise.all([
        statsService.getOverview(userId, filter),
        statsService.getStreaks(userId, filter),
        duelService.listDuels(userId, { ...filter, limit: 1, offset: 0 }),
        duelService.listDuels(userId, { ...filter, limit: recentCount, offset: 0 }),
      ]);

      const latestDuel = duelsResult.data[0];
      let currentDeck: string | undefined;
      let rank: number | undefined;
      let rateValue: number | undefined;
      let dcValue: number | undefined;
      if (latestDuel) {
        const [deck] = await sql<DeckRow[]>`
          SELECT * FROM decks WHERE id = ${latestDuel.deckId}
        `;
        if (deck) currentDeck = deck.name;
        rank = latestDuel.rank ?? undefined;
        rateValue = latestDuel.rateValue ?? undefined;
        dcValue = latestDuel.dcValue ?? undefined;
      }

      const recentResults = recentDuels.data
        .map((d) => ({
          result: d.result as 'win' | 'loss',
          dueledAt: d.dueledAt,
        }))
        .reverse();

      return c.json({
        data: {
          totalDuels: overview.totalDuels,
          wins: overview.wins,
          losses: overview.losses,
          winRate: overview.winRate,
          firstRate: overview.firstRate,
          firstWinRate: overview.firstWinRate,
          secondWinRate: overview.secondWinRate,
          coinTossWinRate: overview.coinTossWinRate,
          currentStreak: streaks.currentStreak,
          currentStreakType: streaks.currentStreakType,
          currentDeck,
          recentResults,
          sessionWins: overview.wins,
          gameMode,
          rank,
          rateValue,
          dcValue,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  });
