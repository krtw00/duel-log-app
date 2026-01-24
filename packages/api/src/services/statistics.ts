import type { StatisticsFilter } from '@duel-log/shared';
import { sql } from '../db/index.js';
import { type SqlFragment, andWhere } from '../db/helpers.js';

function buildConditions(userId: string, filter: StatisticsFilter) {
  const conditions: SqlFragment[] = [sql`d.user_id = ${userId}`];
  if (filter.gameMode) conditions.push(sql`d.game_mode = ${filter.gameMode}`);
  if (filter.from) conditions.push(sql`d.dueled_at >= ${new Date(filter.from)}`);
  if (filter.to) conditions.push(sql`d.dueled_at <= ${new Date(filter.to)}`);
  if (filter.fromTimestamp) conditions.push(sql`d.dueled_at >= ${new Date(filter.fromTimestamp)}`);
  return andWhere(conditions);
}

interface OverviewResult {
  totalDuels: number;
  wins: number;
  losses: number;
  winRate: number;
  firstRate: number;
  firstWinRate: number;
  secondWinRate: number;
  coinTossWinRate: number;
}

export async function getOverview(userId: string, filter: StatisticsFilter) {
  const where = buildConditions(userId, filter);

  const [result] = await sql<OverviewResult[]>`
    SELECT
      count(*)::int AS total_duels,
      count(*) filter (WHERE d.result = 'win')::int AS wins,
      count(*) filter (WHERE d.result = 'loss')::int AS losses,
      CASE WHEN count(*) = 0 THEN 0
        ELSE round(count(*) filter (WHERE d.result = 'win')::numeric / count(*)::numeric, 4)
      END::float AS win_rate,
      CASE WHEN count(*) = 0 THEN 0
        ELSE round(count(*) filter (WHERE d.is_first = true)::numeric / count(*)::numeric, 4)
      END::float AS first_rate,
      CASE WHEN count(*) filter (WHERE d.is_first = true) = 0 THEN 0
        ELSE round(count(*) filter (WHERE d.is_first = true AND d.result = 'win')::numeric / count(*) filter (WHERE d.is_first = true)::numeric, 4)
      END::float AS first_win_rate,
      CASE WHEN count(*) filter (WHERE d.is_first = false) = 0 THEN 0
        ELSE round(count(*) filter (WHERE d.is_first = false AND d.result = 'win')::numeric / count(*) filter (WHERE d.is_first = false)::numeric, 4)
      END::float AS second_win_rate,
      CASE WHEN count(*) = 0 THEN 0
        ELSE round(count(*) filter (WHERE d.won_coin_toss = true)::numeric / count(*)::numeric, 4)
      END::float AS coin_toss_win_rate
    FROM duels d
    WHERE ${where}
  `;

  return result ?? { totalDuels: 0, wins: 0, losses: 0, winRate: 0, firstRate: 0, firstWinRate: 0, secondWinRate: 0, coinTossWinRate: 0 };
}

interface WinRateResult {
  deckId: string;
  deckName: string;
  totalDuels: number;
  wins: number;
  losses: number;
  winRate: number;
}

export async function getWinRates(userId: string, filter: StatisticsFilter) {
  const where = buildConditions(userId, filter);

  return sql<WinRateResult[]>`
    SELECT
      d.deck_id,
      dk.name AS deck_name,
      count(*)::int AS total_duels,
      count(*) filter (WHERE d.result = 'win')::int AS wins,
      count(*) filter (WHERE d.result = 'loss')::int AS losses,
      CASE WHEN count(*) = 0 THEN 0
        ELSE round(count(*) filter (WHERE d.result = 'win')::numeric / count(*)::numeric, 4)
      END::float AS win_rate
    FROM duels d
    INNER JOIN decks dk ON dk.id = d.deck_id
    WHERE ${where}
    GROUP BY d.deck_id, dk.name
  `;
}

interface MatchupResult {
  deckId: string;
  deckName: string;
  opponentDeckId: string;
  opponentDeckName: string;
  wins: number;
  losses: number;
  winRate: number;
}

export async function getMatchups(userId: string, filter: StatisticsFilter) {
  const where = buildConditions(userId, filter);

  return sql<MatchupResult[]>`
    SELECT
      d.deck_id,
      dk.name AS deck_name,
      d.opponent_deck_id,
      od.name AS opponent_deck_name,
      count(*) filter (WHERE d.result = 'win')::int AS wins,
      count(*) filter (WHERE d.result = 'loss')::int AS losses,
      CASE WHEN count(*) = 0 THEN 0
        ELSE round(count(*) filter (WHERE d.result = 'win')::numeric / count(*)::numeric, 4)
      END::float AS win_rate
    FROM duels d
    INNER JOIN decks dk ON dk.id = d.deck_id
    INNER JOIN decks od ON od.id = d.opponent_deck_id
    WHERE ${where}
    GROUP BY d.deck_id, dk.name, d.opponent_deck_id, od.name
  `;
}

interface StreakResult {
  currentStreak: number;
  currentStreakType: 'win' | 'loss' | null;
  longestWinStreak: number;
  longestLossStreak: number;
}

export async function getStreaks(userId: string, filter: StatisticsFilter): Promise<StreakResult> {
  const where = buildConditions(userId, filter);

  const results = await sql<{ result: string }[]>`
    SELECT d.result FROM duels d WHERE ${where} ORDER BY d.dueled_at DESC
  `;

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

interface ValueSequenceResult {
  duelId: string;
  value: number | null;
  dueledAt: Date;
}

export async function getValueSequence(userId: string, filter: StatisticsFilter) {
  const where = buildConditions(userId, filter);

  return sql<ValueSequenceResult[]>`
    SELECT
      d.id AS duel_id,
      CASE
        WHEN d.game_mode = 'RANK' THEN d.rank::float
        WHEN d.game_mode = 'RATE' THEN d.rate_value
        WHEN d.game_mode = 'DC' THEN d.dc_value::float
        ELSE null
      END AS value,
      d.dueled_at
    FROM duels d
    WHERE ${where}
    ORDER BY d.dueled_at
  `;
}
