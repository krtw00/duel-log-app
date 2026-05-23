import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { COOKIE_NAMES, CSRF_HEADER } from '../lib/cookies.js';

/**
 * Double Submit Cookie 方式の CSRF 検証ミドルウェア。
 *
 * - GET / HEAD / OPTIONS は素通り
 * - 以下の auth パスは CSRF cookie 発行側なので免除:
 *   /api/auth/login, /api/auth/register, /api/auth/refresh,
 *   /api/auth/password/forgot, /api/auth/password/reset
 * - /api/auth/signout は保護対象（免除しない）
 * - OAuth callback は GET なので変更系チェックで既に素通り
 */
const CSRF_EXEMPT_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/password/forgot',
  '/api/auth/password/reset',
] as const;

export const csrfMiddleware = createMiddleware(async (c, next) => {
  const method = c.req.method;

  // GET / HEAD / OPTIONS は検証しない
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    await next();
    return;
  }

  // CSRF cookie をまだ持たない / 発行する側のパスは免除
  const path = c.req.path;
  if (CSRF_EXEMPT_PATHS.some((exempt) => path.startsWith(exempt))) {
    await next();
    return;
  }

  const cookieToken = getCookie(c, COOKIE_NAMES.csrf);
  const headerToken = c.req.header(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return c.json(
      { error: { code: 'CSRF_FAILED', message: 'CSRF token mismatch' } },
      403,
    );
  }

  await next();
});
