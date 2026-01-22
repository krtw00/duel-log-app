import { randomBytes } from 'node:crypto';
import type { CreateSharedStatistics } from '@duel-log/shared';
import { and, eq, lt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sharedStatistics } from '../db/schema.js';

export async function createSharedStats(userId: string, data: CreateSharedStatistics) {
  const token = randomBytes(16).toString('hex');

  const [created] = await db
    .insert(sharedStatistics)
    .values({
      userId,
      token,
      filters: data.filters,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    })
    .returning();
  return created;
}

export async function getSharedStats(token: string) {
  const stats = await db.query.sharedStatistics.findFirst({
    where: eq(sharedStatistics.token, token),
  });

  if (!stats) return null;

  // 有効期限チェック
  if (stats.expiresAt && stats.expiresAt < new Date()) {
    return null;
  }

  return stats;
}

export async function deleteSharedStats(userId: string, token: string) {
  const [deleted] = await db
    .delete(sharedStatistics)
    .where(and(eq(sharedStatistics.token, token), eq(sharedStatistics.userId, userId)))
    .returning();
  return deleted;
}

/** 期限切れの共有URLを一括削除 */
export async function cleanupExpiredSharedStats() {
  const result = await db
    .delete(sharedStatistics)
    .where(lt(sharedStatistics.expiresAt, new Date()))
    .returning();
  return result.length;
}

/** 孤立した共有URL（ユーザー削除済み）を一括削除 */
export async function cleanupOrphanedSharedStats() {
  const result = await db.execute(
    'DELETE FROM shared_statistics WHERE user_id NOT IN (SELECT id FROM users) RETURNING id',
  );
  return (result as unknown[]).length;
}
