import type { StatisticsFilter } from '@duel-log/shared';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { decks, duels } from '../db/schema.js';

function buildConditions(userId: string, filter: StatisticsFilter) {
  const conditions = [eq(duels.userId, userId)];
  if (filter.gameMode) conditions.push(eq(duels.gameMode, filter.gameMode));
  if (filter.from) conditions.push(gte(duels.dueledAt, new Date(filter.from)));
  if (filter.to) conditions.push(lte(duels.dueledAt, new Date(filter.to)));
  if (filter.fromTimestamp) conditions.push(gte(duels.dueledAt, new Date(filter.fromTimestamp)));
  return and(...conditions);
}

export async function getOverview(userId: string, filter: StatisticsFilter) {
  const where = buildConditions(userId, filter);

  const [result] = await db
    .select({
      totalDuels: sql<number>`count(*)::int`,
      wins: sql<number>`count(*) filter (where ${duels.result} = 'win')::int`,
      losses: sql<number>`count(*) filter (where ${duels.result} = 'loss')::int`,
      winRate: sql<number>`
        case when count(*) = 0 then 0
        else round(count(*) filter (where ${duels.result} = 'win')::numeric / count(*)::numeric, 4)
        end::float`,
      firstRate: sql<number>`
        case when count(*) = 0 then 0
        else round(count(*) filter (where ${duels.isFirst} = true)::numeric / count(*)::numeric, 4)
        end::float`,
      coinTossWinRate: sql<number>`
        case when count(*) = 0 then 0
        else round(count(*) filter (where ${duels.wonCoinToss} = true)::numeric / count(*)::numeric, 4)
        end::float`,
    })
    .from(duels)
    .where(where);

  return (
    result ?? { totalDuels: 0, wins: 0, losses: 0, winRate: 0, firstRate: 0, coinTossWinRate: 0 }
  );
}

export async function getWinRates(userId: string, filter: StatisticsFilter) {
  const where = buildConditions(userId, filter);

  return db
    .select({
      deckId: duels.deckId,
      deckName: decks.name,
      totalDuels: sql<number>`count(*)::int`,
      wins: sql<number>`count(*) filter (where ${duels.result} = 'win')::int`,
      losses: sql<number>`count(*) filter (where ${duels.result} = 'loss')::int`,
      winRate: sql<number>`
        case when count(*) = 0 then 0
        else round(count(*) filter (where ${duels.result} = 'win')::numeric / count(*)::numeric, 4)
        end::float`,
    })
    .from(duels)
    .innerJoin(decks, eq(duels.deckId, decks.id))
    .where(where)
    .groupBy(duels.deckId, decks.name);
}

export async function getMatchups(userId: string, filter: StatisticsFilter) {
  const where = buildConditions(userId, filter);

  return db
    .select({
      deckId: duels.deckId,
      deckName: decks.name,
      opponentDeckId: duels.opponentDeckId,
      opponentDeckName: sql<string>`od.name`,
      wins: sql<number>`count(*) filter (where ${duels.result} = 'win')::int`,
      losses: sql<number>`count(*) filter (where ${duels.result} = 'loss')::int`,
      winRate: sql<number>`
        case when count(*) = 0 then 0
        else round(count(*) filter (where ${duels.result} = 'win')::numeric / count(*)::numeric, 4)
        end::float`,
    })
    .from(duels)
    .innerJoin(decks, eq(duels.deckId, decks.id))
    .innerJoin(sql`decks as od`, sql`od.id = ${duels.opponentDeckId}`)
    .where(where)
    .groupBy(duels.deckId, decks.name, duels.opponentDeckId, sql`od.name`);
}

export async function getStreaks(userId: string, filter: StatisticsFilter) {
  const where = buildConditions(userId, filter);

  const results = await db
    .select({ result: duels.result })
    .from(duels)
    .where(where)
    .orderBy(desc(duels.dueledAt));

  let currentStreak = 0;
  let currentStreakType: 'win' | 'loss' | null = null;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let winStreak = 0;
  let lossStreak = 0;

  for (const row of results) {
    if (row.result === 'win') {
      winStreak++;
      lossStreak = 0;
      if (winStreak > longestWinStreak) longestWinStreak = winStreak;
    } else {
      lossStreak++;
      winStreak = 0;
      if (lossStreak > longestLossStreak) longestLossStreak = lossStreak;
    }
  }

  // 現在の連勝/連敗（直近から連続する同一結果）
  if (results.length > 0) {
    currentStreakType = results[0]?.result as 'win' | 'loss';
    currentStreak = 1;
    for (let i = 1; i < results.length; i++) {
      if (results[i]?.result === currentStreakType) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { currentStreak, currentStreakType, longestWinStreak, longestLossStreak };
}

export async function getValueSequence(userId: string, filter: StatisticsFilter) {
  const where = buildConditions(userId, filter);

  return db
    .select({
      duelId: duels.id,
      value: sql<number | null>`
        case
          when ${duels.gameMode} = 'RANK' then ${duels.rank}::float
          when ${duels.gameMode} = 'RATE' then ${duels.rateValue}
          when ${duels.gameMode} = 'DC' then ${duels.dcValue}::float
          else null
        end`,
      dueledAt: duels.dueledAt,
    })
    .from(duels)
    .where(where)
    .orderBy(duels.dueledAt);
}
