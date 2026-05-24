import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { setAuthCookies, clearAuthCookies, COOKIE_NAMES } from '../cookies.js';

function buildApp() {
  const app = new Hono();
  app.post('/set', (c) => {
    setAuthCookies(c, { accessToken: 'AT', refreshToken: 'RT', csrfToken: 'CT' });
    return c.json({ ok: true });
  });
  app.post('/clear', (c) => {
    clearAuthCookies(c);
    return c.json({ ok: true });
  });
  return app;
}

describe('setAuthCookies', () => {
  it('3 本の Set-Cookie を返す（dlog_access, dlog_refresh, dlog_csrf）', async () => {
    const app = buildApp();
    const res = await app.request('/set', { method: 'POST' });
    const cookies = res.headers.getSetCookie();
    const names = cookies.map((c) => c.split('=')[0]);
    expect(names).toContain(COOKIE_NAMES.access);
    expect(names).toContain(COOKIE_NAMES.refresh);
    expect(names).toContain(COOKIE_NAMES.csrf);
    expect(cookies).toHaveLength(3);
  });

  it('dlog_access は HttpOnly / Path=/api / SameSite=Lax で値が AT', async () => {
    const app = buildApp();
    const res = await app.request('/set', { method: 'POST' });
    const cookies = res.headers.getSetCookie();
    const accessCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAMES.access}=`));
    expect(accessCookie).toBeDefined();
    expect(accessCookie).toContain(`${COOKIE_NAMES.access}=AT`);
    expect(accessCookie).toMatch(/HttpOnly/i);
    expect(accessCookie).toMatch(/Path=\/api(;|$| )/);
    expect(accessCookie).toMatch(/SameSite=Lax/i);
  });

  it('dlog_refresh は HttpOnly / Path=/api/auth で値が RT', async () => {
    const app = buildApp();
    const res = await app.request('/set', { method: 'POST' });
    const cookies = res.headers.getSetCookie();
    const refreshCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAMES.refresh}=`));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain(`${COOKIE_NAMES.refresh}=RT`);
    expect(refreshCookie).toMatch(/HttpOnly/i);
    expect(refreshCookie).toMatch(/Path=\/api\/auth(;|$| )/);
  });

  it('dlog_csrf は HttpOnly を含まない / Path=/api で値が CT', async () => {
    const app = buildApp();
    const res = await app.request('/set', { method: 'POST' });
    const cookies = res.headers.getSetCookie();
    const csrfCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAMES.csrf}=`));
    expect(csrfCookie).toBeDefined();
    expect(csrfCookie).toContain(`${COOKIE_NAMES.csrf}=CT`);
    // HttpOnly が付いていないことを確認（フロントが読む必要があるため）
    expect(csrfCookie).not.toMatch(/HttpOnly/i);
    expect(csrfCookie).toMatch(/Path=\/api(;|$| )/);
  });
});

describe('clearAuthCookies', () => {
  it('3 本の cookie を無効化する Set-Cookie を返す', async () => {
    const app = buildApp();
    const res = await app.request('/clear', { method: 'POST' });
    const cookies = res.headers.getSetCookie();
    const names = cookies.map((c) => c.split('=')[0]);
    expect(names).toContain(COOKIE_NAMES.access);
    expect(names).toContain(COOKIE_NAMES.refresh);
    expect(names).toContain(COOKIE_NAMES.csrf);
  });

  it('各 Set-Cookie は Max-Age=0 か過去の Expires を持つ', async () => {
    const app = buildApp();
    const res = await app.request('/clear', { method: 'POST' });
    const cookies = res.headers.getSetCookie();
    for (const cookie of cookies) {
      const isExpired = /Max-Age=0/i.test(cookie) || /Expires=/i.test(cookie);
      expect(isExpired, `cookie を無効化する属性がない: ${cookie}`).toBe(true);
    }
  });
});
