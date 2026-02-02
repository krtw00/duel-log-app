import { createMiddleware } from 'hono/factory';
import { createRemoteJWKSet, jwtVerify } from 'jose';
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
  aud: string | string[];
  role: string;
  exp: number;
  iat: number;
};

// Supabase JWKSエンドポイント（公開鍵取得用、キャッシュされる）
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
  if (!jwks) {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is required');
    }
    jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
  }
  return jwks;
}

// ユーザー情報のインメモリキャッシュ（5分間有効）
const USER_CACHE_TTL = 5 * 60 * 1000; // 5分
type CachedUser = { user: UserRow; cachedAt: number };
const userCache = new Map<string, CachedUser>();

function getCachedUser(userId: string): UserRow | undefined {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.cachedAt < USER_CACHE_TTL) {
    return cached.user;
  }
  if (cached) {
    userCache.delete(userId);
  }
  return undefined;
}

function setCachedUser(userId: string, user: UserRow): void {
  userCache.set(userId, { user, cachedAt: Date.now() });
}

/** JWT検証（JWKSエンドポイント使用） + JITプロビジョニング */
export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const startTime = Date.now();

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } }, 401);
  }

  const token = authHeader.slice(7);

  // JWTをJWKSで検証（Supabase Auth APIを呼ばない）
  let payload: SupabaseJwtPayload;
  try {
    const jwtStart = Date.now();
    const { payload: verifiedPayload } = await jwtVerify(token, getJwks());
    console.log(`[auth] JWT verify: ${Date.now() - jwtStart}ms`);
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

  // キャッシュからユーザー情報を取得
  let dbUser: UserRow | undefined = getCachedUser(userId);

  if (!dbUser) {
    // JIT provisioning: ユーザーがDBに存在しなければ作成
    const dbStart = Date.now();
    const [dbUserExisting] = await sql<UserRow[]>`
      SELECT * FROM users WHERE id = ${userId}
    `;
    console.log(`[auth] DB query: ${Date.now() - dbStart}ms (cache miss)`);

    dbUser = dbUserExisting;

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

    // キャッシュに保存
    if (dbUser) {
      setCachedUser(userId, dbUser);
    }
  } else {
    console.log('[auth] DB query: 0ms (cache hit)');
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

  console.log(`[auth] Total auth middleware: ${Date.now() - startTime}ms`);

  await next();
});
