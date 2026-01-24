import { randomBytes } from 'node:crypto';
import type { CreateSharedStatistics } from '@duel-log/shared';
import { sql } from '../db/index.js';
import type { SharedStatisticsRow } from '../db/types.js';

export async function createSharedStats(userId: string, data: CreateSharedStatistics) {
  const token = randomBytes(16).toString('hex');

  const [created] = await sql<SharedStatisticsRow[]>`
    INSERT INTO shared_statistics (user_id, token, filters, expires_at)
    VALUES (${userId}, ${token}, ${sql.json(data.filters)}, ${data.expiresAt ? new Date(data.expiresAt) : null})
    RETURNING *
  `;
  return created;
}

export async function getSharedStats(token: string) {
  const [stats] = await sql<SharedStatisticsRow[]>`
    SELECT * FROM shared_statistics WHERE token = ${token}
  `;

  if (!stats) return null;

  // 有効期限チェック
  if (stats.expiresAt && stats.expiresAt < new Date()) {
    return null;
  }

  return stats;
}

export async function deleteSharedStats(userId: string, token: string) {
  const [deleted] = await sql<SharedStatisticsRow[]>`
    DELETE FROM shared_statistics
    WHERE token = ${token} AND user_id = ${userId}
    RETURNING *
  `;
  return deleted;
}

/** 期限切れの共有URLを一括削除 */
export async function cleanupExpiredSharedStats() {
  const result = await sql<SharedStatisticsRow[]>`
    DELETE FROM shared_statistics WHERE expires_at < now() RETURNING *
  `;
  return result.length;
}

/** 孤立した共有URL（ユーザー削除済み）を一括削除 */
export async function cleanupOrphanedSharedStats() {
  const result = await sql`
    DELETE FROM shared_statistics
    WHERE user_id NOT IN (SELECT id FROM users)
    RETURNING id
  `;
  return result.length;
}
