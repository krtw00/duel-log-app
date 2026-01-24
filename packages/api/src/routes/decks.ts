import { createDeckSchema, updateDeckSchema } from '@duel-log/shared';
import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import * as deckService from '../services/deck.js';

type Env = { Variables: { user: AuthUser } };

export const deckRoutes = new Hono<Env>()
  .get('/', async (c) => {
    const { id } = c.get('user');
    const data = await deckService.listDecks(id);
    return c.json({ data });
  })
  .post('/', async (c) => {
    const { id } = c.get('user');
    const body = await c.req.json();
    const data = createDeckSchema.parse(body);
    const created = await deckService.createDeck(id, data);
    return c.json({ data: created }, 201);
  })
  .post('/archive-all', async (c) => {
    const { id } = c.get('user');
    const count = await deckService.archiveAllDecks(id);
    return c.json({ data: { archivedCount: count } });
  })
  .get('/:id', async (c) => {
    const { id } = c.get('user');
    const deckId = c.req.param('id');
    const deck = await deckService.getDeck(id, deckId);
    if (!deck) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Deck not found' } }, 404);
    }
    return c.json({ data: deck });
  })
  .patch('/:id', async (c) => {
    const { id } = c.get('user');
    const deckId = c.req.param('id');
    const body = await c.req.json();
    const data = updateDeckSchema.parse(body);
    const updated = await deckService.updateDeck(id, deckId, data);
    if (!updated) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Deck not found' } }, 404);
    }
    return c.json({ data: updated });
  })
  .delete('/:id', async (c) => {
    const { id } = c.get('user');
    const deckId = c.req.param('id');
    const deleted = await deckService.deleteDeck(id, deckId);
    if (!deleted) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Deck not found' } }, 404);
    }
    return c.json({ data: { message: 'Deck deleted' } });
  })
  .post('/:id/archive', async (c) => {
    const { id } = c.get('user');
    const deckId = c.req.param('id');
    const updated = await deckService.archiveDeck(id, deckId);
    if (!updated) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Deck not found' } }, 404);
    }
    return c.json({ data: updated });
  })
  .post('/:id/unarchive', async (c) => {
    const { id } = c.get('user');
    const deckId = c.req.param('id');
    const updated = await deckService.unarchiveDeck(id, deckId);
    if (!updated) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Deck not found' } }, 404);
    }
    return c.json({ data: updated });
  });
