import { updateUserSchema } from '@duel-log/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import { hashPassword } from '../lib/password.js';
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
  .put('/password', async (c) => {
    const { id } = c.get('user');
    const body = z.object({ password: z.string().min(6).max(72) }).parse(await c.req.json());
    await userService.updatePassword(id, await hashPassword(body.password));
    return c.json({ data: { message: 'Password updated' } });
  })
  .delete('/', async (c) => {
    const { id } = c.get('user');
    await userService.deleteUser(id);
    return c.json({ data: { message: 'Account deleted' } });
  });
