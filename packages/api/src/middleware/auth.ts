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

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/** JWT検証 + JITプロビジョニング */
export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } }, 401);
  }

  const token = authHeader.slice(7);
  const {
    data: { user: supabaseUser },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !supabaseUser) {
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
      INSERT INTO users (id, email, display_name)
      VALUES (${supabaseUser.id}, ${supabaseUser.email ?? ''}, ${supabaseUser.user_metadata?.display_name ?? supabaseUser.email ?? ''})
      RETURNING *
    `;
    dbUser = created;
  } else {
    // 最終ログイン日時を更新
    await sql`
      UPDATE users SET last_login_at = now() WHERE id = ${supabaseUser.id}
    `;
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
