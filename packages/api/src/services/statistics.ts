import type { StatisticsFilter } from '@duel-log/shared';
import { type SqlFragment, andWhere } from '../db/helpers.js';
import { sql } from '../db/index.js';

function buildConditions(userId: string, filter: StatisticsFilter) {
  const conditions: SqlFragment[] = [sql`d.user_id = ${userId}`];
  if (filter.gameMode) conditions.push(sql`d.game_mode = ${filter.gameMode}`);
  if (filter.from) conditions.push(sql`d.dueled_at >= ${new Date(filter.from)}`);
  if (filter.to) conditions.push(sql`d.dueled_at <= ${new Date(filter.to)}`);
  if (filter.fromTimestamp) conditions.push(sql`d.dueled_at >= ${new Date(filter.fromTimestamp)}`);
  if (filter.deckId) conditions.push(sql`d.deck_id = ${filter.deckId}`);

  // Range filter: select duels by their sequential number within the month
  if (filter.rangeStart || filter.rangeEnd) {
    const baseConditions: SqlFragment[] = [sql`user_id = ${userId}`];
    if (filter.gameMode) baseConditions.push(sql`game_mode = ${filter.gameMode}`);
    if (filter.from) baseConditions.push(sql`dueled_at >= ${new Date(filter.from)}`);
    if (filter.to) baseConditions.push(sql`dueled_at <= ${new Date(filter.to)}`);
    const baseWhere = andWhere(baseConditions);
    const rangeStart = filter.rangeStart ?? 1;
    const rangeEnd = filter.rangeEnd ?? 999999;
    conditions.push(sql`d.id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY dueled_at) AS rn
        FROM duels WHERE ${baseWhere}
      ) sub WHERE sub.rn >= ${rangeStart} AND sub.rn <= ${rangeEnd}
    )`);
  }

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

  return (
    result ?? {
      totalDuels: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      firstRate: 0,
      firstWinRate: 0,
      secondWinRate: 0,
      coinTossWinRate: 0,
    }
  );
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
  opponentDeckIsGeneric: boolean;
  wins: number;
  losses: number;
  winRate: number;
  firstWinRate: number;
  secondWinRate: number;
}

export async function getMatchups(userId: string, filter: StatisticsFilter) {
  const where = buildConditions(userId, filter);

  return sql<MatchupResult[]>`
    SELECT
      d.deck_id,
      dk.name AS deck_name,
      d.opponent_deck_id,
      od.name AS opponent_deck_name,
      coalesce(od.is_generic, false) AS opponent_deck_is_generic,
      count(*) filter (WHERE d.result = 'win')::int AS wins,
      count(*) filter (WHERE d.result = 'loss')::int AS losses,
      CASE WHEN count(*) = 0 THEN 0
        ELSE round(count(*) filter (WHERE d.result = 'win')::numeric / count(*)::numeric, 4)
      END::float AS win_rate,
      CASE WHEN count(*) filter (WHERE d.is_first = true) = 0 THEN 0
        ELSE round(count(*) filter (WHERE d.is_first = true AND d.result = 'win')::numeric / count(*) filter (WHERE d.is_first = true)::numeric, 4)
      END::float AS first_win_rate,
      CASE WHEN count(*) filter (WHERE d.is_first = false) = 0 THEN 0
        ELSE round(count(*) filter (WHERE d.is_first = false AND d.result = 'win')::numeric / count(*) filter (WHERE d.is_first = false)::numeric, 4)
      END::float AS second_win_rate
    FROM duels d
    INNER JOIN decks dk ON dk.id = d.deck_id
    INNER JOIN decks od ON od.id = d.opponent_deck_id
    WHERE ${where}
    GROUP BY d.deck_id, dk.name, d.opponent_deck_id, od.name, od.is_generic
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

  // SQLのWindow関数で連勝/連敗を計算（全データ取得を回避）
  // NOTE: PostgreSQLではウィンドウ関数のネストが禁止されているため、
  // LAGとSUMを別CTEに分離する必要がある
  const [result] = await sql<
    {
      currentStreak: number;
      currentStreakType: string | null;
      longestWinStreak: number;
      longestLossStreak: number;
    }[]
  >`
    WITH ordered_duels AS (
      SELECT
        d.result,
        ROW_NUMBER() OVER (ORDER BY d.dueled_at DESC) as rn
      FROM duels d
      WHERE ${where}
    ),
    duels_with_lag AS (
      SELECT
        result,
        rn,
        LAG(result) OVER (ORDER BY rn) as prev_result
      FROM ordered_duels
    ),
    streak_groups AS (
      SELECT
        result,
        rn,
        SUM(CASE
          WHEN result != prev_result OR prev_result IS NULL
          THEN 1 ELSE 0
        END) OVER (ORDER BY rn) as grp
      FROM duels_with_lag
    ),
    streak_counts AS (
      SELECT
        result,
        grp,
        COUNT(*)::int as streak_length,
        MIN(rn)::int as min_rn
      FROM streak_groups
      GROUP BY result, grp
    )
    SELECT
      COALESCE((SELECT streak_length FROM streak_counts WHERE min_rn = 1), 0)::int as current_streak,
      (SELECT result FROM streak_counts WHERE min_rn = 1) as current_streak_type,
      COALESCE((SELECT MAX(streak_length) FROM streak_counts WHERE result = 'win'), 0)::int as longest_win_streak,
      COALESCE((SELECT MAX(streak_length) FROM streak_counts WHERE result = 'loss'), 0)::int as longest_loss_streak
  `;

  return {
    currentStreak: result?.currentStreak ?? 0,
    currentStreakType: (result?.currentStreakType as 'win' | 'loss') ?? null,
    longestWinStreak: result?.longestWinStreak ?? 0,
    longestLossStreak: result?.longestLossStreak ?? 0,
  };
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

interface DuelHistoryResult {
  id: string;
  deckId: string;
  deckName: string;
  opponentDeckId: string;
  opponentDeckName: string;
  opponentDeckIsGeneric: boolean;
  result: string;
  gameMode: string;
  isFirst: boolean;
  wonCoinToss: boolean;
  rank: number | null;
  rateValue: number | null;
  dcValue: number | null;
  memo: string | null;
  dueledAt: Date;
}

export async function getDuelHistory(userId: string, filter: StatisticsFilter) {
  const where = buildConditions(userId, filter);

  return sql<DuelHistoryResult[]>`
    SELECT
      d.id,
      d.deck_id,
      dk.name AS deck_name,
      d.opponent_deck_id,
      od.name AS opponent_deck_name,
      coalesce(od.is_generic, false) AS opponent_deck_is_generic,
      d.result,
      d.game_mode,
      d.is_first,
      d.won_coin_toss,
      d.rank,
      d.rate_value,
      d.dc_value,
      d.memo,
      d.dueled_at
    FROM duels d
    INNER JOIN decks dk ON dk.id = d.deck_id
    INNER JOIN decks od ON od.id = d.opponent_deck_id
    WHERE ${where}
    ORDER BY d.dueled_at DESC
  `;
}

export async function getUserDisplayName(userId: string): Promise<string> {
  const [user] = await sql<{ displayName: string }[]>`
    SELECT display_name FROM users WHERE id = ${userId}
  `;
  return user?.displayName ?? 'Unknown';
}
