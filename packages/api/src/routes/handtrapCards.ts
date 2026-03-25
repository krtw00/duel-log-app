import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';
import * as handtrapCardService from '../services/handtrapCard.js';

type Env = { Variables: { user: AuthUser } };

const createHandtrapCardSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const handtrapCardRoutes = new Hono<Env>()
  .get('/', async (c) => {
    const { id } = c.get('user');
    const data = await handtrapCardService.listUserHandtrapCards(id);
    return c.json({ data });
  })
  .post('/', async (c) => {
    const { id } = c.get('user');
    const body = await c.req.json();
    const data = createHandtrapCardSchema.parse(body);
    const created = await handtrapCardService.createUserHandtrapCard(id, data.name);
    return c.json({ data: created }, 201);
  })
  .delete('/:id', async (c) => {
    const { id } = c.get('user');
    const cardId = c.req.param('id');
    const deleted = await handtrapCardService.deleteUserHandtrapCard(id, cardId);
    if (!deleted) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Hand trap card not found' } }, 404);
    }
    return c.json({ data: { message: 'Hand trap card deleted' } });
  });
