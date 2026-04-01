import type { UpdateUser } from '@duel-log/shared';
import { sql } from '../db/index.js';
import type { UserRow } from '../db/types.js';

export async function getUser(userId: string) {
  const [user] = await sql<UserRow[]>`
    SELECT * FROM users WHERE id = ${userId}
  `;
  return user;
}

export async function updateUser(userId: string, data: UpdateUser) {
  const [updated] = await sql<UserRow[]>`
    UPDATE users
    SET ${sql(data as Record<string, unknown>)}, updated_at = now()
    WHERE id = ${userId}
    RETURNING *
  `;
  return updated;
}

export async function updatePassword(userId: string, passwordHash: string) {
  await sql`
    UPDATE users
    SET password_hash = ${passwordHash}, updated_at = now()
    WHERE id = ${userId}
  `;
}

export async function deleteUser(userId: string) {
  await sql`DELETE FROM users WHERE id = ${userId}`;
}
