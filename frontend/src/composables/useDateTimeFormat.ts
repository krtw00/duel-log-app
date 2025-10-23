import { getCurrentLocalDateTime, localDateTimeToISO, isoToLocalDateTime } from '@/utils/date';

/**
 * 日時フォーマット変換 Composable
 * datetime-local形式とISO形式の相互変換を提供
 */

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
