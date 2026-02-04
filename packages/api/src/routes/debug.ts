import { promises as fs } from 'fs';
import path from 'path';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';

type Env = { Variables: { user: AuthUser } };

const screenAnalysisLogSchema = z.object({
  eventAt: z.number().optional(),
  state: z.string().optional(),
  coin: z.enum(['won', 'lost']).nullable().optional(),
  result: z.enum(['win', 'loss']).nullable().optional(),
  coinWinScore: z.number().optional(),
  coinLossScore: z.number().optional(),
  resultWinScore: z.number().optional(),
  resultLossScore: z.number().optional(),
  coinConfidence: z.number().optional(),
  resultConfidence: z.number().optional(),
  coinOcrText: z.string().optional(),
  coinOcrResult: z.enum(['won', 'lost']).nullable().optional(),
  coinOcrConfidence: z.number().optional(),
  coinOcrAt: z.number().optional(),
});

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'screen-analysis.log');

async function appendLog(line: string) {
  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.appendFile(LOG_FILE, `${line}\n`);
}

export const debugRoutes = new Hono<Env>().post('/screen-analysis', async (c) => {
  const user = c.get('user');
  if (!user.isDebugger) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Debugger only' } }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = screenAnalysisLogSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid payload' } }, 400);
  }

  const logEntry = {
    at: new Date().toISOString(),
    userId: user.id,
    ...parsed.data,
  };
  const line = JSON.stringify(logEntry);
  console.log(`[screen-analysis] ${line}`);

  try {
    await appendLog(line);
  } catch {
    return c.json({ error: { code: 'LOG_WRITE_FAILED', message: 'Failed to write log' } }, 500);
  }

  return c.json({ data: { ok: true } });
});
