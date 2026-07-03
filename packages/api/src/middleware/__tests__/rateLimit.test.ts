import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { createRateLimitMiddleware, type RateLimitRule } from '../rateLimit.js';

// テスト用ルール表: 実運用の閾値に依存せず window の境界だけを素早く検証する
const TEST_RULES: RateLimitRule[] = [
  { path: '/api/auth/password/forgot', windowMs: 60_000, max: 3 },
  { path: '/api/auth/login', windowMs: 60_000, max: 2 },
];

function buildApp(rules: RateLimitRule[] = TEST_RULES, now?: () => number) {
  const app = new Hono();
  app.use('*', createRateLimitMiddleware(rules, now));
  app.get('/api/decks', (c) => c.json({ ok: true }));
  app.post('/api/decks', (c) => c.json({ ok: true }));
  app.options('/api/auth/login', (c) => c.body(null, 204));
  app.post('/api/auth/login', (c) => c.json({ ok: true }));
  app.post('/api/auth/password/forgot', (c) => c.json({ ok: true }));
  return app;
}

function withXff(ip: string) {
  return { 'X-Forwarded-For': ip };
}

describe('rateLimitMiddleware', () => {
  it('制限内のリクエストは通る', async () => {
    const app = buildApp();
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/api/auth/password/forgot', {
        method: 'POST',
        headers: withXff('1.1.1.1'),
      });
      expect(res.status).toBe(200);
    }
  });

  it('上限を超えると 429 かつ Retry-After ヘッダが付く', async () => {
    const app = buildApp();
    for (let i = 0; i < 3; i++) {
      await app.request('/api/auth/password/forgot', {
        method: 'POST',
        headers: withXff('2.2.2.2'),
      });
    }
    const res = await app.request('/api/auth/password/forgot', {
      method: 'POST',
      headers: withXff('2.2.2.2'),
    });
    expect(res.status).toBe(429);
    const retryAfter = res.headers.get('Retry-After');
    expect(retryAfter).not.toBeNull();
    expect(Number(retryAfter)).toBeGreaterThan(0);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('RATE_LIMITED');
  });

  it('IP が違えばカウントは独立している', async () => {
    const app = buildApp();
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/api/auth/password/forgot', {
        method: 'POST',
        headers: withXff('3.3.3.1'),
      });
      expect(res.status).toBe(200);
    }
    // 別 IP は独立したカウンタなので上限に達していても通る
    const res = await app.request('/api/auth/password/forgot', {
      method: 'POST',
      headers: withXff('3.3.3.2'),
    });
    expect(res.status).toBe(200);
  });

  it('パスが違えばカウントは独立している（同一 IP）', async () => {
    const app = buildApp();
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/api/auth/password/forgot', {
        method: 'POST',
        headers: withXff('4.4.4.4'),
      });
      expect(res.status).toBe(200);
    }
    // password/forgot は上限だが login は別ルール・別カウンタなので通る
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: withXff('4.4.4.4'),
    });
    expect(res.status).toBe(200);
  });

  it('window 経過後はカウンタがリセットされる', async () => {
    let currentTime = 1_000_000;
    const app = buildApp(TEST_RULES, () => currentTime);

    for (let i = 0; i < 2; i++) {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: withXff('5.5.5.5'),
      });
      expect(res.status).toBe(200);
    }
    // まだ window 内: 3 回目は上限超過で 429
    const blocked = await app.request('/api/auth/login', {
      method: 'POST',
      headers: withXff('5.5.5.5'),
    });
    expect(blocked.status).toBe(429);

    // window (60_000ms) を過ぎたら新しい window としてリセットされる
    currentTime += 60_001;
    const afterReset = await app.request('/api/auth/login', {
      method: 'POST',
      headers: withXff('5.5.5.5'),
    });
    expect(afterReset.status).toBe(200);
  });

  it('X-Forwarded-For は右端のエントリを採用する', async () => {
    const app = buildApp();
    // 右端 (直近のプロキシが付与) が同じなら、左側の詐称値が変わっても同一キー扱いになる
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/api/auth/password/forgot', {
        method: 'POST',
        headers: withXff(`10.0.0.${i}, 9.9.9.9`),
      });
      expect(res.status).toBe(200);
    }
    const blocked = await app.request('/api/auth/password/forgot', {
      method: 'POST',
      headers: withXff('10.0.0.99, 9.9.9.9'),
    });
    expect(blocked.status).toBe(429);
  });

  it('X-Forwarded-For がない場合は unknown にフォールバックして動作する', async () => {
    const app = buildApp();
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/api/auth/password/forgot', { method: 'POST' });
      expect(res.status).toBe(200);
    }
    const blocked = await app.request('/api/auth/password/forgot', { method: 'POST' });
    expect(blocked.status).toBe(429);
  });

  it('対象外のパスは無制限', async () => {
    const app = buildApp();
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/api/decks', {
        method: 'POST',
        headers: withXff('6.6.6.6'),
      });
      expect(res.status).toBe(200);
    }
  });

  it('対象外のメソッド（OPTIONS/GET）は無制限', async () => {
    const app = buildApp();
    for (let i = 0; i < 10; i++) {
      const optionsRes = await app.request('/api/auth/login', {
        method: 'OPTIONS',
        headers: withXff('7.7.7.7'),
      });
      expect(optionsRes.status).toBe(204);
    }
    for (let i = 0; i < 10; i++) {
      const getRes = await app.request('/api/decks', {
        method: 'GET',
        headers: withXff('7.7.7.7'),
      });
      expect(getRes.status).toBe(200);
    }
  });
});
