import { createDuelSchema, duelFilterSchema, updateDuelSchema } from '@duel-log/shared';
import { Hono } from 'hono';
import type { DuelRow } from '../db/types.js';
import type { AuthUser } from '../middleware/auth.js';
import * as duelService from '../services/duel.js';

type Env = { Variables: { user: AuthUser } };

export const duelRoutes = new Hono<Env>()
  .get('/', async (c) => {
    const { id } = c.get('user');
    const query = c.req.query();
    const filter = duelFilterSchema.parse(query);
    const result = await duelService.listDuels(id, filter);
    return c.json(result);
  })
  .post('/', async (c) => {
    const { id } = c.get('user');
    const body = await c.req.json();
    const data = createDuelSchema.parse(body);
    const created = await duelService.createDuel(id, data);
    return c.json({ data: created }, 201);
  })
  .get('/export', async (c) => {
    const { id } = c.get('user');
    const query = c.req.query();
    const filter = duelFilterSchema.parse(query);
    const data = await duelService.exportDuels(id, filter);

    const csv = duelsToCSV(data);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="duels.csv"',
      },
    });
  })
  .post('/import', async (c) => {
    const { id } = c.get('user');
    const body = await c.req.json();
    const rows = body as Array<Record<string, unknown>>;

    let imported = 0;
    for (const row of rows) {
      const data = createDuelSchema.parse(row);
      await duelService.createDuel(id, data);
      imported++;
    }

    return c.json({ data: { imported } }, 201);
  })
  .get('/:id', async (c) => {
    const { id } = c.get('user');
    const duelId = c.req.param('id');
    const duel = await duelService.getDuel(id, duelId);
    if (!duel) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Duel not found' } }, 404);
    }
    return c.json({ data: duel });
  })
  .put('/:id', async (c) => {
    const { id } = c.get('user');
    const duelId = c.req.param('id');
    const body = await c.req.json();
    const data = updateDuelSchema.parse(body);
    const updated = await duelService.updateDuel(id, duelId, data);
    if (!updated) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Duel not found' } }, 404);
    }
    return c.json({ data: updated });
  })
  .delete('/:id', async (c) => {
    const { id } = c.get('user');
    const duelId = c.req.param('id');
    const deleted = await duelService.deleteDuel(id, duelId);
    if (!deleted) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Duel not found' } }, 404);
    }
    return c.json({ data: { message: 'Duel deleted' } });
  });

function duelsToCSV(data: DuelRow[]) {
  if (data.length === 0) return '';
  const headers = [
    'id',
    'deckId',
    'opponentDeckId',
    'result',
    'gameMode',
    'isFirst',
    'wonCoinToss',
    'rank',
    'rateValue',
    'dcValue',
    'memo',
    'dueledAt',
  ] as const;
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}
