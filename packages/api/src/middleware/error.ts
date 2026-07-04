import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { ZodError } from 'zod';

/**
 * 例外を JSON エラーレスポンスに変換する共通ハンドラ。
 * Hono ではマウント済みサブアプリ (`app.route()`) の throw は親の try/catch
 * ミドルウェアに伝播しないため、`app.onError()` に登録して使う。
 */
export function handleError(err: unknown, c: Context) {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: err.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      },
      400,
    );
  }

  console.error('Unhandled error:', err);
  const isPreview = process.env.VERCEL_ENV === 'preview';
  const message = err instanceof Error ? err.message : 'Unknown error';
  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        ...(isPreview ? { detail: message } : {}),
      },
    },
    500,
  );
}

/** グローバルエラーハンドリング（同一 app 上のミドルウェア throw 用） */
export const errorMiddleware = createMiddleware(async (c, next) => {
  try {
    await next();
  } catch (err) {
    return handleError(err, c);
  }
});
