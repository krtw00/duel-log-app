/**
 * マスターデュエルのシーズン境界計算
 *
 * シーズン期間: 毎月1日 08:00 JST 〜 翌月1日 07:59:59 JST
 * (JST = UTC+9)
 */

const JST_SEASON_START_HOUR = 8; // 08:00 JST
const JST_OFFSET_HOURS = 9;

/** 指定月のシーズン期間を UTC の ISO 文字列で返す */
export function getSeasonRange(year: number, month: number) {
  // month is 1-indexed (1=January)
  // Start: month/1 08:00 JST = UTC month/1 (08-09)h = previous day 23:00 UTC
  const from = new Date(
    Date.UTC(year, month - 1, 1, JST_SEASON_START_HOUR - JST_OFFSET_HOURS),
  ).toISOString();
  // End: (month+1)/1 07:59:59 JST = UTC (month+1)/1 (07-09)h:59:59 = previous day 22:59:59 UTC
  const to = new Date(
    Date.UTC(year, month, 1, JST_SEASON_START_HOUR - JST_OFFSET_HOURS - 1, 59, 59),
  ).toISOString();
  return { from, to };
}

/** 現在のアクティブシーズン (year, month) を返す */
export function getCurrentSeason() {
  const now = new Date();
  // JST での現在時刻を計算
  const jstMs = now.getTime() + (JST_OFFSET_HOURS * 60 + now.getTimezoneOffset()) * 60_000;
  const jst = new Date(jstMs);

  let year = jst.getFullYear();
  let month = jst.getMonth() + 1;

  // 1日の 08:00 JST より前 → まだ前月シーズン
  if (jst.getDate() === 1 && jst.getHours() < JST_SEASON_START_HOUR) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  return { year, month };
}
