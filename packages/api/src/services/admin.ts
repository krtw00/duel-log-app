import type { UpdateUserStatus } from '@duel-log/shared';
import { count, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { duels, users } from '../db/schema.js';

export async function listUsers() {
  return db.query.users.findMany({
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });
}

export async function updateUserStatus(userId: string, data: UpdateUserStatus) {
  const [updated] = await db
    .update(users)
    .set({
      status: data.status,
      statusReason: data.statusReason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}

export async function getAdminStatistics() {
  const [userCount] = await db.select({ count: count() }).from(users);
  const [duelCount] = await db.select({ count: count() }).from(duels);
  const [todayDuels] = await db
    .select({ count: count() })
    .from(duels)
    .where(sql`${duels.createdAt} >= current_date`);

  return {
    totalUsers: userCount?.count ?? 0,
    totalDuels: duelCount?.count ?? 0,
    todayDuels: todayDuels?.count ?? 0,
  };
}
