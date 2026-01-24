import type postgres from 'postgres';
import { sql } from './index.js';

export type SqlFragment = postgres.PendingQuery<postgres.Row[]>;

/** 動的WHERE条件をANDで結合 */
export function andWhere(conditions: SqlFragment[]): SqlFragment {
  if (conditions.length === 0) return sql`true`;
  return conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`);
}
