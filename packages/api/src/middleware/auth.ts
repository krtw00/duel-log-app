import { createMiddleware } from 'hono/factory';
import { jwtVerify } from 'jose';
import { sql } from '../db/index.js';
import type { UserRow } from '../db/types.js';

export type AuthUser = {
  id: string;
  email: string;
  isAdmin: boolean;
  isDebugger: boolean;
};

type Env = {
  Variables: {
    user: AuthUser;
  };
};

// Supabase JWTペイロードの型
type SupabaseJwtPayload = {
  sub: string;
  email?: string;
  user_metadata?: {
    display_name?: string;
    full_name?: string;
    name?: string;
  };
  aud: string;
  role: string;
  exp: number;
  iat: number;
};

let jwtSecret: Uint8Array | undefined;

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function getJwtSecret(): Uint8Array {
  if (!jwtSecret) {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
      throw new Error('SUPABASE_JWT_SECRET environment variable is required');
    }
    // SupabaseのJWTシークレットはBase64エンコードされている
    jwtSecret = base64ToUint8Array(secret);
  }
  return jwtSecret;
}

/** JWT検証（ローカル） + JITプロビジョニング */
export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } }, 401);
  }

  const token = authHeader.slice(7);

  // JWTをローカルで検証（Supabase APIを呼ばない）
  let payload: SupabaseJwtPayload;
  try {
    const { payload: verifiedPayload } = await jwtVerify(token, getJwtSecret(), {
      audience: 'authenticated',
    });
    payload = verifiedPayload as unknown as SupabaseJwtPayload;
  } catch {
    return c.json(
      { error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' } },
      401,
    );
  }

  const userId = payload.sub;
  const email = payload.email ?? '';
  const displayName =
    payload.user_metadata?.display_name ??
    payload.user_metadata?.full_name ??
    payload.user_metadata?.name ??
    email;

  // JIT provisioning: ユーザーがDBに存在しなければ作成
  const [dbUserExisting] = await sql<UserRow[]>`
    SELECT * FROM users WHERE id = ${userId}
  `;

  let dbUser: UserRow | undefined = dbUserExisting;

  if (!dbUser) {
    const [created] = await sql<UserRow[]>`
      INSERT INTO users (id, email, display_name)
      VALUES (${userId}, ${email}, ${displayName})
      RETURNING *
    `;
    dbUser = created;
  } else {
    // 最終ログイン日時を更新（1時間以上経過している場合のみ、パフォーマンス最適化）
    const lastLogin = dbUser.lastLoginAt;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!lastLogin || new Date(lastLogin) < oneHourAgo) {
      // 非同期で更新（レスポンスをブロックしない）
      void sql`UPDATE users SET last_login_at = now() WHERE id = ${userId}`;
    }
  }

  if (!dbUser) {
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to provision user' } }, 500);
  }

  if (dbUser.status !== 'active') {
    return c.json({ error: { code: 'FORBIDDEN', message: `Account is ${dbUser.status}` } }, 403);
  }

  c.set('user', {
    id: dbUser.id,
    email: dbUser.email,
    isAdmin: dbUser.isAdmin,
    isDebugger: dbUser.isDebugger,
  });

  await next();
});
