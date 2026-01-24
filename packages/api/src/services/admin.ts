import type { UpdateUserStatus } from '@duel-log/shared';
import { sql } from '../db/index.js';
import type { UserRow } from '../db/types.js';

export async function listUsers() {
  return sql<UserRow[]>`
    SELECT * FROM users ORDER BY created_at DESC
  `;
}

export async function updateUserStatus(userId: string, data: UpdateUserStatus) {
  const [updated] = await sql<UserRow[]>`
    UPDATE users
    SET status = ${data.status}, status_reason = ${data.statusReason ?? null}, updated_at = now()
    WHERE id = ${userId}
    RETURNING *
  `;
  return updated;
}

export async function getAdminStatistics() {
  const [userCount] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM users`;
  const [duelCount] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM duels`;
  const [todayDuels] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count FROM duels WHERE created_at >= current_date
  `;

  return {
    totalUsers: userCount?.count ?? 0,
    totalDuels: duelCount?.count ?? 0,
    todayDuels: todayDuels?.count ?? 0,
  };
}
