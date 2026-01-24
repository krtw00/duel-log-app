import { createMiddleware } from 'hono/factory';
import type { AuthUser } from './auth.js';

type Env = {
  Variables: {
    user: AuthUser;
  };
};

/** デバッガー権限チェック（authMiddleware の後に使用） */
export const debuggerMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get('user');
  if (!user.isDebugger && !user.isAdmin) {
    return c.json(
      { error: { code: 'DEBUGGER_REQUIRED', message: 'Debugger access required' } },
      403,
    );
  }
  await next();
});
