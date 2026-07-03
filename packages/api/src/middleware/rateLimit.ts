import { createMiddleware } from 'hono/factory';

/**
 * 固定 window (fixed window) 方式の in-memory rate limit middleware。
 *
 * 本番は VPS 上の単一 Node プロセスで動くため Redis 等の外部ストアは使わず、
 * プロセス内 Map でカウントする（プロセス再起動でカウンタが消えるのは許容）。
 *
 * 対象は POST の認証系エンドポイントのみ。特に /auth/password/forgot は
 * bot 連打で Brevo（メール送信）の課金を消費させられるリスクが最も高いため
 * 最も厳しい閾値にする。login はブルートフォース対策。
 */

export interface RateLimitRule {
  /** c.req.path と完全一致させるパス（basePath 込みのフルパス、例: /api/auth/login） */
  path: string;
  /** window の長さ（ミリ秒） */
  windowMs: number;
  /** window 内で許可する最大リクエスト数 */
  max: number;
}

interface Counter {
  count: number;
  /** この window が終わる epoch ms */
  resetAt: number;
}

/**
 * デフォルトルール。
 * - /auth/password/forgot: 3 回 / 15 分（メール送信課金の直撃点、最厳）
 * - /auth/register: 5 回 / 15 分（大量アカウント作成対策）
 * - /auth/login: 10 回 / 5 分（ブルートフォース対策）
 * - /auth/password/reset: 10 回 / 15 分（reset token 総当たり対策）
 */
export const DEFAULT_RATE_LIMIT_RULES: RateLimitRule[] = [
  { path: '/api/auth/password/forgot', windowMs: 15 * 60 * 1000, max: 3 },
  { path: '/api/auth/register', windowMs: 15 * 60 * 1000, max: 5 },
  { path: '/api/auth/login', windowMs: 5 * 60 * 1000, max: 10 },
  { path: '/api/auth/password/reset', windowMs: 15 * 60 * 1000, max: 10 },
];

/** 期限切れエントリの定期間引き間隔（アクセスされないキーが Map に残り続けるのを防ぐ） */
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

/**
 * X-Forwarded-For の右端（信頼するリバースプロキシ 1 段が付与した直近のエントリ）を
 * クライアント IP として採用する。ヘッダがなければ 'unknown' にフォールバックする
 * （この場合 bot 同士がキーを共有し合算で制限される＝fail-safe 側に倒す）。
 */
function resolveClientIp(header: string | undefined | null): string {
  if (!header) return 'unknown';
  const parts = header
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const last = parts.at(-1);
  return last ?? 'unknown';
}

/**
 * rate limit middleware の factory。テストで window 経過を検証できるよう
 * 現在時刻の取得を `now` として注入可能にしている。
 */
export function createRateLimitMiddleware(
  rules: RateLimitRule[] = DEFAULT_RATE_LIMIT_RULES,
  now: () => number = Date.now,
) {
  const store = new Map<string, Counter>();

  const sweepTimer = setInterval(() => {
    const t = now();
    for (const [key, counter] of store) {
      if (counter.resetAt <= t) {
        store.delete(key);
      }
    }
  }, SWEEP_INTERVAL_MS);
  // テスト環境やプロセス終了時にタイマーが event loop を掴んだままにならないようにする
  sweepTimer.unref?.();

  return createMiddleware(async (c, next) => {
    // ルール表は POST のみを対象にしているため GET/OPTIONS 等は自然に素通りする
    if (c.req.method !== 'POST') {
      await next();
      return;
    }

    const rule = rules.find((r) => r.path === c.req.path);
    if (!rule) {
      await next();
      return;
    }

    const ip = resolveClientIp(c.req.header('X-Forwarded-For'));
    const key = `${ip}:${rule.path}`;
    const t = now();

    let counter = store.get(key);
    if (!counter || counter.resetAt <= t) {
      // 新規 window の開始（未登録 or 期限切れなので lazy に作り直す）
      counter = { count: 0, resetAt: t + rule.windowMs };
      store.set(key, counter);
    }

    counter.count += 1;

    if (counter.count > rule.max) {
      const retryAfterSec = Math.max(1, Math.ceil((counter.resetAt - t) / 1000));
      c.header('Retry-After', String(retryAfterSec));
      return c.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
          },
        },
        429,
      );
    }

    await next();
  });
}

export const rateLimitMiddleware = createRateLimitMiddleware();
