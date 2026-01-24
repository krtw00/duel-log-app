import type { CreateDuel, DuelFilter, UpdateDuel } from '@duel-log/shared';
import { sql } from '../db/index.js';
import { type SqlFragment, andWhere } from '../db/helpers.js';
import type { DuelRow } from '../db/types.js';

function buildConditions(userId: string, filter: Pick<DuelFilter, 'gameMode' | 'deckId' | 'from' | 'to' | 'fromTimestamp'>) {
  const conditions: SqlFragment[] = [sql`user_id = ${userId}`];

  if (filter.gameMode) conditions.push(sql`game_mode = ${filter.gameMode}`);
  if (filter.deckId) conditions.push(sql`deck_id = ${filter.deckId}`);
  if (filter.from) conditions.push(sql`dueled_at >= ${new Date(filter.from)}`);
  if (filter.to) conditions.push(sql`dueled_at <= ${new Date(filter.to)}`);
  if (filter.fromTimestamp) conditions.push(sql`dueled_at >= ${new Date(filter.fromTimestamp)}`);

  return andWhere(conditions);
}

export async function listDuels(userId: string, filter: DuelFilter) {
  const where = buildConditions(userId, filter);

  const [data, [totalRow]] = await Promise.all([
    sql<DuelRow[]>`
      SELECT * FROM duels WHERE ${where}
      ORDER BY dueled_at DESC
      LIMIT ${filter.limit} OFFSET ${filter.offset}
    `,
    sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM duels WHERE ${where}
    `,
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
  const [duel] = await sql<DuelRow[]>`
    SELECT * FROM duels WHERE id = ${duelId} AND user_id = ${userId}
  `;
  return duel;
}

export async function createDuel(userId: string, data: CreateDuel) {
  const [created] = await sql<DuelRow[]>`
    INSERT INTO duels (user_id, deck_id, opponent_deck_id, result, game_mode, is_first, won_coin_toss, rank, rate_value, dc_value, memo, dueled_at)
    VALUES (
      ${userId}, ${data.deckId}, ${data.opponentDeckId}, ${data.result}, ${data.gameMode},
      ${data.isFirst}, ${data.wonCoinToss}, ${data.rank ?? null}, ${data.rateValue ?? null},
      ${data.dcValue ?? null}, ${data.memo ?? null}, ${new Date(data.dueledAt)}
    )
    RETURNING *
  `;
  return created;
}

export async function updateDuel(userId: string, duelId: string, data: UpdateDuel) {
  const values: Record<string, unknown> = {};
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

  const [updated] = await sql<DuelRow[]>`
    UPDATE duels
    SET ${sql(values)}, updated_at = now()
    WHERE id = ${duelId} AND user_id = ${userId}
    RETURNING *
  `;
  return updated;
}

export async function deleteDuel(userId: string, duelId: string) {
  const [deleted] = await sql<DuelRow[]>`
    DELETE FROM duels WHERE id = ${duelId} AND user_id = ${userId} RETURNING *
  `;
  return deleted;
}

/** CSV用: 全デュエル取得（フィルタ対応） */
export async function exportDuels(userId: string, filter: Omit<DuelFilter, 'limit' | 'offset'>): Promise<DuelRow[]> {
  const where = buildConditions(userId, filter);

  const result = await sql<DuelRow[]>`
    SELECT * FROM duels WHERE ${where} ORDER BY dueled_at DESC
  `;
  return Array.from(result);
}
