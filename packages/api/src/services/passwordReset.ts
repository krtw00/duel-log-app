import { createHash, randomBytes } from 'node:crypto';
import { ensurePasswordResetsTable, sql } from '../db/index.js';
import type { PasswordResetRow } from '../db/types.js';

const TOKEN_BYTES = 32;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  await ensurePasswordResetsTable();

  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  const tokenHash = hashToken(token);

  await sql`
    INSERT INTO password_resets (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, now() + interval '1 hour')
  `;

  return token;
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  await ensurePasswordResetsTable();

  const tokenHash = hashToken(token);
  const [row] = await sql<PasswordResetRow[]>`
    UPDATE password_resets
    SET used_at = now()
    WHERE token_hash = ${tokenHash}
      AND used_at IS NULL
      AND expires_at > now()
    RETURNING *
  `;

  return row?.userId ?? null;
}

export async function cleanupExpiredPasswordResets() {
  await ensurePasswordResetsTable();

  const deleted = await sql<Pick<PasswordResetRow, 'id'>[]>`
    DELETE FROM password_resets
    WHERE expires_at <= now() - interval '7 days'
       OR (used_at IS NOT NULL AND used_at <= now() - interval '7 days')
    RETURNING id
  `;

  return deleted.length;
}
