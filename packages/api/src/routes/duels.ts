import {
  GAME_MODES,
  type GameMode,
  RESULTS,
  createDuelSchema,
  duelFilterSchema,
  updateDuelSchema,
} from '@duel-log/shared';
import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import * as deckService from '../services/deck.js';
import * as duelService from '../services/duel.js';
import type { ExportDuelRow } from '../services/duel.js';

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

    const csv = duelsToCSV(data, !!filter.gameMode);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="duels.csv"',
      },
    });
  })
  .post('/import', async (c) => {
    const { id } = c.get('user');
    const gameModeParam = c.req.query('gameMode') as GameMode | undefined;

    const text = await c.req.text();
    const rows = parseCSV(text);
    if (rows.length === 0) {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Empty CSV' } }, 400);
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const hasGameModeCol = headers.includes('game_mode');
    if (!hasGameModeCol && !gameModeParam) {
      return c.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'game_mode column or gameMode query parameter required',
          },
        },
        400,
      );
    }

    // Load user's decks for name resolution
    const userDecks = await deckService.listDecks(id);
    const myDeckMap = new Map<string, string>(); // name -> id
    const oppDeckMap = new Map<string, string>(); // name -> id
    for (const d of userDecks) {
      if (d.isOpponentDeck) {
        oppDeckMap.set(d.name, d.id);
      } else {
        myDeckMap.set(d.name, d.id);
      }
    }

    const colIdx = (name: string) => headers.indexOf(name);

    let imported = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row) continue;
      const lineNum = i + 2; // 1-indexed, skip header
      try {
        const getField = (name: string) => row[colIdx(name)] ?? '';
        const deckName = getField('deck_name');
        const oppDeckName = getField('opponent_deck_name');
        const result = getField('result');
        const gameMode = hasGameModeCol ? getField('game_mode') : (gameModeParam ?? 'RANK');
        const isFirstStr = getField('is_first');
        const wonCoinTossStr = getField('won_coin_toss');
        const rankStr = getField('rank');
        const rateValueStr = getField('rate_value');
        const dcValueStr = getField('dc_value');
        const memo = getField('memo');
        const dueledAt = getField('dueled_at');

        // Validate required fields
        if (!deckName) {
          errors.push(`Row ${lineNum}: deck_name is required`);
          continue;
        }
        if (!oppDeckName) {
          errors.push(`Row ${lineNum}: opponent_deck_name is required`);
          continue;
        }
        if (!RESULTS.includes(result as (typeof RESULTS)[number])) {
          errors.push(`Row ${lineNum}: invalid result "${result}"`);
          continue;
        }
        if (!GAME_MODES.includes(gameMode as (typeof GAME_MODES)[number])) {
          errors.push(`Row ${lineNum}: invalid game_mode "${gameMode}"`);
          continue;
        }
        if (!dueledAt) {
          errors.push(`Row ${lineNum}: dueled_at is required`);
          continue;
        }

        // Resolve deck IDs (create if not exists)
        let deckId = myDeckMap.get(deckName);
        if (!deckId) {
          const created = await deckService.createDeck(id, {
            name: deckName,
            isOpponentDeck: false,
          });
          if (!created) {
            errors.push(`Row ${lineNum}: failed to create deck "${deckName}"`);
            continue;
          }
          deckId = created.id;
          myDeckMap.set(deckName, deckId);
        }

        let oppDeckId = oppDeckMap.get(oppDeckName);
        if (!oppDeckId) {
          const created = await deckService.createDeck(id, {
            name: oppDeckName,
            isOpponentDeck: true,
          });
          if (!created) {
            errors.push(`Row ${lineNum}: failed to create opponent deck "${oppDeckName}"`);
            continue;
          }
          oppDeckId = created.id;
          oppDeckMap.set(oppDeckName, oppDeckId);
        }

        const parseBool = (s: string) => s === 'true' || s === '1';
        const parseOptionalInt = (s: string) => (s === '' ? null : Number.parseInt(s, 10));
        const parseOptionalFloat = (s: string) => (s === '' ? null : Number.parseFloat(s));

        await duelService.createDuel(id, {
          deckId,
          opponentDeckId: oppDeckId,
          result: result as (typeof RESULTS)[number],
          gameMode: gameMode as (typeof GAME_MODES)[number],
          isFirst: parseBool(isFirstStr),
          wonCoinToss: parseBool(wonCoinTossStr),
          rank: parseOptionalInt(rankStr),
          rateValue: parseOptionalFloat(rateValueStr),
          dcValue: parseOptionalInt(dcValueStr),
          memo: memo || null,
          dueledAt,
        });
        imported++;
      } catch (e) {
        errors.push(`Row ${lineNum}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    return c.json({ data: { imported, errors } }, 201);
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
  .patch('/:id', async (c) => {
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

function escapeCSVField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str;
}

function duelsToCSV(data: ExportDuelRow[], hasGameModeFilter: boolean) {
  if (data.length === 0) return '';

  const baseHeaders = hasGameModeFilter
    ? [
        'deck_name',
        'opponent_deck_name',
        'result',
        'is_first',
        'won_coin_toss',
        'rank',
        'rate_value',
        'dc_value',
        'memo',
        'dueled_at',
      ]
    : [
        'deck_name',
        'opponent_deck_name',
        'result',
        'game_mode',
        'is_first',
        'won_coin_toss',
        'rank',
        'rate_value',
        'dc_value',
        'memo',
        'dueled_at',
      ];

  const rows = data.map((row) => {
    const fields: unknown[] = [row.deckName, row.opponentDeckName, row.result];
    if (!hasGameModeFilter) fields.push(row.gameMode);
    fields.push(
      row.isFirst,
      row.wonCoinToss,
      row.rank,
      row.rateValue,
      row.dcValue,
      row.memo,
      row.dueledAt instanceof Date ? row.dueledAt.toISOString() : row.dueledAt,
    );
    return fields.map(escapeCSVField).join(',');
  });

  return [baseHeaders.join(','), ...rows].join('\n');
}

/** RFC 4180 CSV parser */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\r') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i++;
        if (i < text.length && text[i] === '\n') i++;
      } else if (ch === '\n') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Last field/row
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
