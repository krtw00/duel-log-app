import { createClient } from '@supabase/supabase-js';
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

let supabase: ReturnType<typeof createClient> | undefined;

type JwtPayload = {
  sub?: string;
  email?: string;
  user_metadata?: { display_name?: string } & Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  aud?: string | string[];
  iss?: string;
  exp?: number;
  nbf?: number;
};

function getSupabaseAdmin() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

// JWKS（JSON Web Key Set）のキャッシュ
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
  if (!jwks) {
    const url = process.env.SUPABASE_URL;
    if (!url) {
      throw new Error('SUPABASE_URL is required for JWKS');
    }
    const jwksUrl = new URL('/.well-known/jwks.json', `${url}/auth/v1`);
    jwks = createRemoteJWKSet(jwksUrl);
  }
  return jwks;
}

function getJwtIssuer() {
  const url = process.env.SUPABASE_URL;
  return url ? `${url}/auth/v1` : undefined;
}

/**
 * joseライブラリを使用したJWT検証
 * ES256, RS256, HS256すべてに対応
 */
async function verifyJwtWithJose(token: string): Promise<JwtPayload> {
  const issuer = getJwtIssuer();

  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer,
      audience: 'authenticated',
    });
    return payload as JwtPayload;
  } catch {
    throw new Error('JWT verification failed');
  }
}

async function getAuthUserFromToken(token: string) {
  // まずJWKSを使ったローカル検証を試みる（高速）
  try {
    const payload = await verifyJwtWithJose(token);
    if (!payload.sub) {
      throw new Error('Token missing sub');
    }
    return {
      id: payload.sub,
      email: payload.email ?? '',
      user_metadata: payload.user_metadata ?? {},
    };
  } catch {
    // JWKSでの検証に失敗した場合、Supabase APIにフォールバック
    const {
      data: { user: supabaseUser },
      error,
    } = await getSupabaseAdmin().auth.getUser(token);

    if (error || !supabaseUser) {
      throw new Error('Token is invalid or expired');
    }

    return supabaseUser;
  }
}

/** JWT検証 + JITプロビジョニング */
export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } }, 401);
  }

  const token = authHeader.slice(7);
  let supabaseUser: { id: string; email?: string; user_metadata?: { display_name?: string } };
  try {
    supabaseUser = await getAuthUserFromToken(token);
  } catch {
    return c.json(
      { error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' } },
      401,
    );
  }

  // JIT provisioning: ユーザーがDBに存在しなければ作成
  const [dbUserExisting] = await sql<UserRow[]>`
    SELECT * FROM users WHERE id = ${supabaseUser.id}
  `;

  let dbUser: UserRow | undefined = dbUserExisting;

  if (!dbUser) {
    const [created] = await sql<UserRow[]>`
      INSERT INTO users (id, email, display_name, last_login_at)
      VALUES (${supabaseUser.id}, ${supabaseUser.email ?? ''}, ${supabaseUser.user_metadata?.display_name ?? supabaseUser.email ?? ''}, now())
      RETURNING *
    `;
    dbUser = created;
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
