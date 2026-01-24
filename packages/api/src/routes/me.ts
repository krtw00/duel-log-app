import { updateUserSchema } from '@duel-log/shared';
import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import * as userService from '../services/user.js';

type Env = { Variables: { user: AuthUser } };

export const meRoutes = new Hono<Env>()
  .get('/', async (c) => {
    const { id } = c.get('user');
    const user = await userService.getUser(id);
    if (!user) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
    }
    return c.json({ data: user });
  })
  .put('/', async (c) => {
    const { id } = c.get('user');
    const body = await c.req.json();
    const data = updateUserSchema.parse(body);
    const updated = await userService.updateUser(id, data);
    return c.json({ data: updated });
  })
  .delete('/', async (c) => {
    const { id } = c.get('user');
    await userService.deleteUser(id);
    return c.json({ data: { message: 'Account deleted' } });
  });
