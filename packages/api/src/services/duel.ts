import type { CreateDuel, DuelFilter, UpdateDuel } from '@duel-log/shared';
import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { duels } from '../db/schema.js';

export async function listDuels(userId: string, filter: DuelFilter) {
  const conditions = [eq(duels.userId, userId)];

  if (filter.gameMode) {
    conditions.push(eq(duels.gameMode, filter.gameMode));
  }
  if (filter.deckId) {
    conditions.push(eq(duels.deckId, filter.deckId));
  }
  if (filter.from) {
    conditions.push(gte(duels.dueledAt, new Date(filter.from)));
  }
  if (filter.to) {
    conditions.push(lte(duels.dueledAt, new Date(filter.to)));
  }
  if (filter.fromTimestamp) {
    conditions.push(gte(duels.dueledAt, new Date(filter.fromTimestamp)));
  }

  const where = and(...conditions);

  const [data, [totalRow]] = await Promise.all([
    db.query.duels.findMany({
      where,
      orderBy: desc(duels.dueledAt),
      limit: filter.limit,
      offset: filter.offset,
    }),
    db.select({ count: count() }).from(duels).where(where),
  ]);

  return {
    data,
    pagination: {
      total: totalRow?.count ?? 0,
      limit: filter.limit,
      offset: filter.offset,
    },
  };
}

export async function getDuel(userId: string, duelId: string) {
  return db.query.duels.findFirst({
    where: and(eq(duels.id, duelId), eq(duels.userId, userId)),
  });
}

export async function createDuel(userId: string, data: CreateDuel) {
  const [created] = await db
    .insert(duels)
    .values({
      ...data,
      userId,
      dueledAt: new Date(data.dueledAt),
      rank: data.rank ?? null,
      rateValue: data.rateValue ?? null,
      dcValue: data.dcValue ?? null,
      memo: data.memo ?? null,
    })
    .returning();
  return created;
}

export async function updateDuel(userId: string, duelId: string, data: UpdateDuel) {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (data.deckId !== undefined) values.deckId = data.deckId;
  if (data.opponentDeckId !== undefined) values.opponentDeckId = data.opponentDeckId;
  if (data.result !== undefined) values.result = data.result;
  if (data.gameMode !== undefined) values.gameMode = data.gameMode;
  if (data.isFirst !== undefined) values.isFirst = data.isFirst;
  if (data.wonCoinToss !== undefined) values.wonCoinToss = data.wonCoinToss;
  if (data.rank !== undefined) values.rank = data.rank;
  if (data.rateValue !== undefined) values.rateValue = data.rateValue;
  if (data.dcValue !== undefined) values.dcValue = data.dcValue;
  if (data.memo !== undefined) values.memo = data.memo;
  if (data.dueledAt !== undefined) values.dueledAt = new Date(data.dueledAt);

  const [updated] = await db
    .update(duels)
    .set(values)
    .where(and(eq(duels.id, duelId), eq(duels.userId, userId)))
    .returning();
  return updated;
}

export async function deleteDuel(userId: string, duelId: string) {
  const [deleted] = await db
    .delete(duels)
    .where(and(eq(duels.id, duelId), eq(duels.userId, userId)))
    .returning();
  return deleted;
}

/** CSV用: 全デュエル取得（フィルタ対応） */
export async function exportDuels(userId: string, filter: Omit<DuelFilter, 'limit' | 'offset'>) {
  const conditions = [eq(duels.userId, userId)];

  if (filter.gameMode) conditions.push(eq(duels.gameMode, filter.gameMode));
  if (filter.deckId) conditions.push(eq(duels.deckId, filter.deckId));
  if (filter.from) conditions.push(gte(duels.dueledAt, new Date(filter.from)));
  if (filter.to) conditions.push(lte(duels.dueledAt, new Date(filter.to)));

  return db.query.duels.findMany({
    where: and(...conditions),
    orderBy: desc(duels.dueledAt),
  });
}
