/**
 * 日付フォーマットユーティリティ
 */

/**
 * ISO形式の日時文字列をローカル日時文字列に変換
 * @param isoString - ISO 8601形式の日時文字列 (例: "2024-01-15T10:30:00Z")
 * @returns ローカル日時文字列 (例: "2024-01-15T19:30")
 */
export function isoToLocalDateTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * ローカル日時文字列をISO形式の日時文字列に変換
 * @param localDateTime - ローカル日時文字列 (例: "2024-01-15T19:30")
 * @returns ISO 8601形式の日時文字列 (例: "2024-01-15T10:30:00Z")
 */
export function localDateTimeToISO(localDateTime: string): string {
  if (!localDateTime) return '';
  const date = new Date(localDateTime);
  return date.toISOString();
}

/**
 * ISO形式の日時文字列を読みやすい形式にフォーマット
 * @param isoString - ISO 8601形式の日時文字列
 * @param includeTime - 時刻を含めるかどうか (デフォルト: true)
 * @returns フォーマット済み日時文字列 (例: "2024/01/15 19:30" または "2024/01/15")
 */
export function formatDate(isoString: string, includeTime = true): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (!includeTime) {
    return `${year}/${month}/${day}`;
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/**
 * 日付をYYYY-MM-DD形式の文字列に変換
 * @param date - Dateオブジェクト
 * @returns YYYY-MM-DD形式の文字列
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 現在の日時をローカル日時文字列として取得
 * @returns ローカル日時文字列 (例: "2024-01-15T19:30")
 */
export function getCurrentLocalDateTime(): string {
  return isoToLocalDateTime(new Date().toISOString());
}
