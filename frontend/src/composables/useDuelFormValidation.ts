/**
 * 対戦記録フォームのバリデーション Composable
 * DuelFormDialog で使用されるバリデーションルールを提供
 */

export function useDuelFormValidation() {
  /**
   * バリデーションルール
   */
  const rules = {
    /**
     * 必須入力チェック
     */
    required: (v: unknown): boolean | string =>
      (v !== null && v !== undefined && v !== '') || '入力必須です',

    /**
     * 数値チェック（0以上）
     */
    number: (v: unknown): boolean | string =>
      (!isNaN(Number(v)) && Number(v) >= 0) || '0以上の数値を入力してください',

    /**
     * 整数チェック
     */
    integer: (v: unknown): boolean | string =>
      (v === null || v === undefined || v === '' || Number.isInteger(Number(v))) ||
      '整数を入力してください',

    /**
     * 最大文字数チェック（1000文字）
     */
    maxLength: (v: string): boolean | string =>
      !v || v.length <= 1000 || '1000文字以内で入力してください',
  };

  return { rules };
}
