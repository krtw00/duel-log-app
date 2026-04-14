import { promises as fs } from 'fs';
import path from 'path';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';

type Env = { Variables: { user: AuthUser } };

const screenAnalysisLogSchema = z.object({
  type: z.string().optional(),
  sessionId: z.string().optional(),
  captureToken: z.number().optional(),
  eventAt: z.number().optional(),
  state: z.string().optional(),
  prevState: z.string().optional(),
  nextState: z.string().optional(),
  prevCoin: z.enum(['won', 'lost']).nullable().optional(),
  nextCoin: z.enum(['won', 'lost']).nullable().optional(),
  prevResult: z.enum(['win', 'loss']).nullable().optional(),
  nextResult: z.enum(['win', 'loss']).nullable().optional(),
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
  ocrLastSkipReason: z.string().nullable().optional(),
  ocrLastAttemptAt: z.number().optional(),
  ocrLastCompletedAt: z.number().optional(),
  ocrLastError: z.string().nullable().optional(),
  ocrLastRawText: z.string().nullable().optional(),
  ocrLastParsedResult: z.enum(['won', 'lost']).nullable().optional(),
  ocrLastParsedConfidence: z.number().nullable().optional(),
  ocrRoi: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
      targetWidth: z.number(),
      targetHeight: z.number(),
    })
    .nullable()
    .optional(),
  captureWidth: z.number().nullable().optional(),
  captureHeight: z.number().nullable().optional(),
  ocrRawImageDataUrl: z.string().nullable().optional(),
  ocrProcessedImageDataUrl: z.string().nullable().optional(),
}).passthrough();

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'screen-analysis.log');
const LOG_ASSET_DIR = path.join(LOG_DIR, 'screen-analysis-assets');

async function appendLog(line: string) {
  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.appendFile(LOG_FILE, `${line}\n`);
}

function parseImageDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const mimeType = match[1];
  const base64 = match[2];
  if (!mimeType || !base64) return null;
  const extension =
    mimeType === 'image/png'
      ? 'png'
      : mimeType === 'image/jpeg'
        ? 'jpg'
        : mimeType === 'image/webp'
          ? 'webp'
          : null;
  if (!extension) return null;

  return {
    extension,
    buffer: Buffer.from(base64, 'base64'),
  };
}

async function writeImageAsset(
  sessionId: string,
  captureToken: number | undefined,
  eventType: string,
  eventAt: number | undefined,
  kind: 'raw' | 'processed',
  dataUrl: string,
) {
  const parsed = parseImageDataUrl(dataUrl);
  if (!parsed) return null;

  const safeSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeEventType = eventType.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dir = path.join(LOG_ASSET_DIR, safeSessionId);
  await fs.mkdir(dir, { recursive: true });

  const timestamp = eventAt ?? Date.now();
  const fileName = `${timestamp}-${captureToken ?? 0}-${safeEventType}-${kind}.${parsed.extension}`;
  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, parsed.buffer);
  return path.relative(LOG_DIR, filePath);
}

export const debugRoutes = new Hono<Env>().post('/screen-analysis', async (c) => {
  const user = c.get('user');
  if (!user.isDebugger && !user.isAdmin) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Debugger only' } }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = screenAnalysisLogSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid payload' } }, 400);
  }

  const logEntry: Record<string, unknown> = {
    type: parsed.data.type ?? 'unknown',
    sessionId: parsed.data.sessionId ?? 'unknown-session',
    at: new Date().toISOString(),
    userId: user.id,
    ...parsed.data,
  };
  const rawImageDataUrl = parsed.data.ocrRawImageDataUrl;
  const processedImageDataUrl = parsed.data.ocrProcessedImageDataUrl;
  delete logEntry.ocrRawImageDataUrl;
  delete logEntry.ocrProcessedImageDataUrl;

  try {
    if (typeof rawImageDataUrl === 'string') {
      logEntry.ocrRawImagePath = await writeImageAsset(
        String(logEntry.sessionId),
        typeof logEntry.captureToken === 'number' ? logEntry.captureToken : undefined,
        String(logEntry.type),
        typeof logEntry.eventAt === 'number' ? logEntry.eventAt : undefined,
        'raw',
        rawImageDataUrl,
      );
    }
    if (typeof processedImageDataUrl === 'string') {
      logEntry.ocrProcessedImagePath = await writeImageAsset(
        String(logEntry.sessionId),
        typeof logEntry.captureToken === 'number' ? logEntry.captureToken : undefined,
        String(logEntry.type),
        typeof logEntry.eventAt === 'number' ? logEntry.eventAt : undefined,
        'processed',
        processedImageDataUrl,
      );
    }
  } catch {
    return c.json(
      { error: { code: 'LOG_IMAGE_WRITE_FAILED', message: 'Failed to write log image' } },
      500,
    );
  }
  const line = JSON.stringify(logEntry);
  console.log(`[screen-analysis] ${line}`);

  try {
    await appendLog(line);
  } catch {
    return c.json({ error: { code: 'LOG_WRITE_FAILED', message: 'Failed to write log' } }, 500);
  }

  return c.json({ data: { ok: true } });
});
