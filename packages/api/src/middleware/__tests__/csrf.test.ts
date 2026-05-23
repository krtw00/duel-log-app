import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { csrfMiddleware } from '../csrf.js';

function buildApp() {
  const app = new Hono();
  app.use('*', csrfMiddleware);
  app.get('/api/decks', (c) => c.json({ ok: true }));
  app.post('/api/decks', (c) => c.json({ ok: true }));
  app.post('/api/auth/login', (c) => c.json({ ok: true }));
  app.post('/api/auth/register', (c) => c.json({ ok: true }));
  app.post('/api/auth/refresh', (c) => c.json({ ok: true }));
  app.post('/api/auth/password/forgot', (c) => c.json({ ok: true }));
  app.post('/api/auth/password/reset', (c) => c.json({ ok: true }));
  app.post('/api/auth/signout', (c) => c.json({ ok: true }));
  return app;
}

describe('csrfMiddleware', () => {
  describe('GET リクエストは素通り', () => {
    it('CSRF cookie/header なしの GET /api/decks は 200 を返す', async () => {
      const app = buildApp();
      const res = await app.request('/api/decks', { method: 'GET' });
      expect(res.status).toBe(200);
    });
  });

  describe('CSRF 免除パス', () => {
    it('POST /api/auth/login は CSRF なしで 200', async () => {
      const app = buildApp();
      const res = await app.request('/api/auth/login', { method: 'POST' });
      expect(res.status).toBe(200);
    });

    it('POST /api/auth/register は CSRF なしで 200', async () => {
      const app = buildApp();
      const res = await app.request('/api/auth/register', { method: 'POST' });
      expect(res.status).toBe(200);
    });

    it('POST /api/auth/refresh は CSRF なしで 200', async () => {
      const app = buildApp();
      const res = await app.request('/api/auth/refresh', { method: 'POST' });
      expect(res.status).toBe(200);
    });

    it('POST /api/auth/password/forgot は CSRF なしで 200', async () => {
      const app = buildApp();
      const res = await app.request('/api/auth/password/forgot', { method: 'POST' });
      expect(res.status).toBe(200);
    });

    it('POST /api/auth/password/reset は CSRF なしで 200', async () => {
      const app = buildApp();
      const res = await app.request('/api/auth/password/reset', { method: 'POST' });
      expect(res.status).toBe(200);
    });
  });

  describe('非免除 POST の CSRF 検証', () => {
    it('cookie も header もなければ 403、code は CSRF_FAILED', async () => {
      const app = buildApp();
      const res = await app.request('/api/decks', { method: 'POST' });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe('CSRF_FAILED');
    });

    it('cookie はあるが header がなければ 403', async () => {
      const app = buildApp();
      const res = await app.request('/api/decks', {
        method: 'POST',
        headers: { Cookie: 'dlog_csrf=abc' },
      });
      expect(res.status).toBe(403);
    });

    it('header はあるが cookie がなければ 403', async () => {
      const app = buildApp();
      const res = await app.request('/api/decks', {
        method: 'POST',
        headers: { 'X-CSRF-Token': 'abc' },
      });
      expect(res.status).toBe(403);
    });

    it('cookie と header の値が不一致なら 403', async () => {
      const app = buildApp();
      const res = await app.request('/api/decks', {
        method: 'POST',
        headers: {
          Cookie: 'dlog_csrf=abc',
          'X-CSRF-Token': 'different',
        },
      });
      expect(res.status).toBe(403);
    });

    it('cookie と header が一致すれば 200', async () => {
      const app = buildApp();
      const res = await app.request('/api/decks', {
        method: 'POST',
        headers: {
          Cookie: 'dlog_csrf=abc',
          'X-CSRF-Token': 'abc',
        },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/auth/signout は保護対象', () => {
    it('CSRF なしの POST /api/auth/signout は 403', async () => {
      const app = buildApp();
      const res = await app.request('/api/auth/signout', { method: 'POST' });
      expect(res.status).toBe(403);
    });

    it('CSRF 一致の POST /api/auth/signout は 200', async () => {
      const app = buildApp();
      const res = await app.request('/api/auth/signout', {
        method: 'POST',
        headers: {
          Cookie: 'dlog_csrf=tok',
          'X-CSRF-Token': 'tok',
        },
      });
      expect(res.status).toBe(200);
    });
  });
});
