import { statisticsFilterSchema } from '@duel-log/shared';
import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import * as deckService from '../services/deck.js';
import * as statsService from '../services/statistics.js';

type Env = { Variables: { user: AuthUser } };

export const statisticsRoutes = new Hono<Env>()
  .get('/overview', async (c) => {
    const { id } = c.get('user');
    const query = c.req.query();
    const filter = statisticsFilterSchema.parse(query);
    const data = await statsService.getOverview(id, filter);
    return c.json({ data });
  })
  .get('/win-rates', async (c) => {
    const { id } = c.get('user');
    const query = c.req.query();
    const filter = statisticsFilterSchema.parse(query);
    const data = await statsService.getWinRates(id, filter);
    return c.json({ data });
  })
  .get('/matchups', async (c) => {
    const { id } = c.get('user');
    const query = c.req.query();
    const filter = statisticsFilterSchema.parse(query);
    const data = await statsService.getMatchups(id, filter);
    return c.json({ data });
  })
  .get('/streaks', async (c) => {
    const { id } = c.get('user');
    const query = c.req.query();
    const filter = statisticsFilterSchema.parse(query);
    const data = await statsService.getStreaks(id, filter);
    return c.json({ data });
  })
  .get('/value-sequence', async (c) => {
    const { id } = c.get('user');
    const query = c.req.query();
    const filter = statisticsFilterSchema.parse(query);
    const data = await statsService.getValueSequence(id, filter);
    return c.json({ data });
  })
  .get('/available-decks', async (c) => {
    const { id } = c.get('user');
    const data = await deckService.getAvailableDecks(id);
    return c.json({ data });
  });
