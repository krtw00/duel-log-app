import { createMiddleware } from 'hono/factory';

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
const MAINTENANCE_BYPASS_KEY = process.env.MAINTENANCE_BYPASS_KEY || '';

/**
 * メンテナンスモードミドルウェア
 * MAINTENANCE_MODE=true の場合、503を返す
 * X-Bypass-Key ヘッダーが MAINTENANCE_BYPASS_KEY と一致すればバイパス
 */
export const maintenanceMiddleware = createMiddleware(async (c, next) => {
  if (MAINTENANCE_MODE) {
    // バイパスキーのチェック
    const bypassKey = c.req.header('X-Bypass-Key');
    if (bypassKey && MAINTENANCE_BYPASS_KEY && bypassKey === MAINTENANCE_BYPASS_KEY) {
      await next();
      return;
    }

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
