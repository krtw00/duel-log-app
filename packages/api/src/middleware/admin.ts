import { createMiddleware } from 'hono/factory';
import type { AuthUser } from './auth.js';

type Env = {
  Variables: {
    user: AuthUser;
  };
};

/** 管理者権限チェック（authMiddleware の後に使用） */
export const adminMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get('user');
  if (!user.isAdmin) {
    return c.json({ error: { code: 'ADMIN_REQUIRED', message: 'Admin access required' } }, 403);
  }
  await next();
});
