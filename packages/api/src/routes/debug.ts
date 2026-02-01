import { appendFile, mkdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';

type Env = { Variables: { user: AuthUser } };

type DebugLogEntry = {
  ts: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  event: string;
  state?: string;
  data?: unknown;
};

type DebugLogPayload = {
  sessionId: string;
  entries: DebugLogEntry[];
};

export const debugRoutes = new Hono<Env>().post('/screen-analysis/logs', async (c) => {
  const body = (await c.req.json().catch(() => null)) as DebugLogPayload | null;
  if (!body || typeof body.sessionId !== 'string' || !Array.isArray(body.entries)) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid payload' } }, 400);
  }

  const sessionId = body.sessionId.trim();
  if (!sessionId) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'sessionId is required' } }, 400);
  }

  const entries = body.entries.slice(0, 200);
  if (entries.length === 0) {
    return c.json({ data: { saved: 0 } });
  }

  const user = c.get('user');
  const date = new Date().toISOString().slice(0, 10);
  const dir = resolve(process.cwd(), 'debug-logs', 'screen-analysis', date);
  await mkdir(dir, { recursive: true });

  const filePath = resolve(dir, `${sessionId}.jsonl`);
  const lines =
    entries
      .map((entry) =>
        JSON.stringify({
          ...entry,
          userId: user.id,
        }),
      )
      .join('\n') + '\n';

  await appendFile(filePath, lines, { encoding: 'utf-8' });

  return c.json({
    data: {
      saved: entries.length,
      file: relative(process.cwd(), filePath),
    },
  });
});
