import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createMiddleware } from 'hono/factory';
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

function getJwtIssuer() {
  const url = process.env.SUPABASE_URL;
  return url ? `${url}/auth/v1` : undefined;
}

function verifyJwt(token: string): JwtPayload {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('SUPABASE_JWT_SECRET is required for local JWT verification');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];
  const headerJson = Buffer.from(headerB64, 'base64url').toString('utf-8');
  const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
  const header = JSON.parse(headerJson) as { alg?: string };
  const payload = JSON.parse(payloadJson) as JwtPayload;

  if (header.alg !== 'HS256') {
    throw new Error('Unsupported token algorithm');
  }

  const data = `${headerB64}.${payloadB64}`;
  const expected = createHmac('sha256', secret).update(data).digest('base64url');

  // JWTの署名部分をBase64URLに正規化（Base64の+を-、/を_に変換、パディング削除）
  const signatureNormalized = signatureB64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const expectedBuffer = Buffer.from(expected, 'utf-8');
  const signatureBuffer = Buffer.from(signatureNormalized, 'utf-8');

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    throw new Error('Invalid token signature');
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now >= payload.exp) {
    throw new Error('Token expired');
  }
  if (payload.nbf && now < payload.nbf) {
    throw new Error('Token not active');
  }

  const issuer = getJwtIssuer();
  if (issuer && payload.iss && payload.iss !== issuer) {
    throw new Error('Invalid token issuer');
  }

  if (payload.aud) {
    const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audList.includes('authenticated')) {
      throw new Error('Invalid token audience');
    }
  }

  return payload;
}

async function getAuthUserFromToken(token: string) {
  if (process.env.SUPABASE_JWT_SECRET) {
    const payload = verifyJwt(token);
    if (!payload.sub) {
      throw new Error('Token missing sub');
    }
    return {
      id: payload.sub,
      email: payload.email ?? '',
      user_metadata: payload.user_metadata ?? {},
    };
  }

  const {
    data: { user: supabaseUser },
    error,
  } = await getSupabaseAdmin().auth.getUser(token);

  if (error || !supabaseUser) {
    throw new Error('Token is invalid or expired');
  }

  return supabaseUser;
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
  } catch (error) {
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
