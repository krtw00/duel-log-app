import type { Duel } from '@duel-log/shared';

/**
 * フォーム送信時のdueledAt（対戦日時）を決定する
 *
 * - ユーザーが日時を変更した場合：フォームの値を使用
 * - 新規登録で日時未変更の場合：送信時点の現在時刻を使用（連続登録で時刻が更新されない問題の対策）
 * - 編集時：フォームの値をそのまま使用
 */
export function getDueledAtForSubmit(
  editingDuel: Duel | null | undefined,
  formDueledAt: string,
  dueledAtChanged: boolean,
): string {
  if (editingDuel || dueledAtChanged) return formDueledAt;
  return new Date().toISOString();
}

/** ISO文字列 → datetime-local input 用のフォーマット (YYYY-MM-DDTHH:MM) */
export function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local input の値 → ISO文字列 */
export function fromDatetimeLocal(local: string): string {
  return new Date(local).toISOString();
}
