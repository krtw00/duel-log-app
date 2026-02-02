import type { Duel } from '@duel-log/shared';

/**
 * フォーム送信時のdueledAt（対戦日時）を決定する
 *
 * - 新規登録時：送信時点の現在時刻を使用（連続登録で時刻が更新されない問題の対策）
 * - 編集時：フォームの値（元のdueledAt）をそのまま使用
 *
 * @param editingDuel - 編集中の対戦データ（新規登録時はnull/undefined）
 * @param formDueledAt - フォームで設定されたdueledAt
 * @returns 送信に使用するdueledAt
 */
export function getDueledAtForSubmit(
  editingDuel: Duel | null | undefined,
  formDueledAt: string,
): string {
  return editingDuel ? formDueledAt : new Date().toISOString();
}
