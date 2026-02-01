import { createMiddleware } from 'hono/factory';

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';

/**
 * メンテナンスモードミドルウェア
 * MAINTENANCE_MODE=true の場合、503を返す
 */
export const maintenanceMiddleware = createMiddleware(async (c, next) => {
  if (MAINTENANCE_MODE) {
    return c.json(
      {
        error: {
          code: 'MAINTENANCE',
          message: 'サービスは現在メンテナンス中です。しばらくお待ちください。',
        },
      },
      503,
    );
  }

  await next();
});
