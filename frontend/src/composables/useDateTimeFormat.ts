/**
 * 日時フォーマット変換 Composable
 * datetime-local形式とISO形式の相互変換を提供
 */

/**
 * 現在時刻をdatetime-local形式で取得
 * @returns YYYY-MM-DDTHH:mm形式の文字列
 */
export function getCurrentLocalDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * datetime-local形式をISO形式に変換
 * @param localDateTime - YYYY-MM-DDTHH:mm形式の文字列
 * @returns ISO形式の文字列（秒とミリ秒を追加）
 */
export function localDateTimeToISO(localDateTime: string): string {
  // datetime-local形式: "2025-10-04T05:36"
  // ユーザーが入力した時刻をそのまま保存するため、秒を追加するだけ
  return `${localDateTime}:00`;
}

/**
 * ISO形式をdatetime-local形式に変換
 * @param isoString - ISO形式の文字列
 * @returns YYYY-MM-DDTHH:mm形式の文字列
 */
export function isoToLocalDateTime(isoString: string): string {
  // タイムゾーン情報とミリ秒を削除して、datetime-local形式に変換
  // "2025-10-04T05:36:00" または "2025-10-04T05:36:00.000Z" → "2025-10-04T05:36"
  return isoString.replace(/\.\d{3}Z?$/, '').substring(0, 16);
}

/**
 * 日時フォーマット変換機能をまとめたComposable
 */
export function useDateTimeFormat() {
  return {
    getCurrentLocalDateTime,
    localDateTimeToISO,
    isoToLocalDateTime,
  };
}
