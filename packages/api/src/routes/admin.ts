import { updateUserStatusSchema } from '@duel-log/shared';
import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import * as adminService from '../services/admin.js';
import * as sharedStatsService from '../services/sharedStatistics.js';

type Env = { Variables: { user: AuthUser } };

export const adminRoutes = new Hono<Env>()
  .get('/users', async (c) => {
    const data = await adminService.listUsers();
    return c.json({ data });
  })
  .put('/users/:id/status', async (c) => {
    const userId = c.req.param('id');
    const body = await c.req.json();
    const data = updateUserStatusSchema.parse(body);
    const updated = await adminService.updateUserStatus(userId, data);
    if (!updated) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
    }
    return c.json({ data: updated });
  })
  .get('/statistics', async (c) => {
    const data = await adminService.getAdminStatistics();
    return c.json({ data });
  })
  .post('/maintenance/cleanup-expired-shared-urls', async (c) => {
    const count = await sharedStatsService.cleanupExpiredSharedStats();
    return c.json({ data: { deleted: count } });
  })
  .post('/maintenance/cleanup-orphaned-shared-urls', async (c) => {
    const count = await sharedStatsService.cleanupOrphanedSharedStats();
    return c.json({ data: { deleted: count } });
  });
