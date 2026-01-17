/**
 * 対戦記録フォームのバリデーション Composable
 * DuelFormDialog で使用されるバリデーションルールを提供
 */

import { useLocale } from './useLocale';

export function useDuelFormValidation() {
  const { LL } = useLocale();

  /**
   * バリデーションルール
   */
  const rules = {
    /**
     * 必須入力チェック
     */
    required: (v: unknown): boolean | string =>
      (v !== null && v !== undefined && v !== '') ||
      (LL.value?.validation.required() ?? 'This field is required'),

    /**
     * 数値チェック（0以上）
     */
    number: (v: unknown): boolean | string =>
      (!isNaN(Number(v)) && Number(v) >= 0) ||
      (LL.value?.validation.positiveNumber() ?? 'Please enter a number 0 or greater'),

    /**
     * 整数チェック
     */
    integer: (v: unknown): boolean | string =>
      v === null ||
      v === undefined ||
      v === '' ||
      Number.isInteger(Number(v)) ||
      (LL.value?.validation.integer() ?? 'Please enter an integer'),

    /**
     * 最大文字数チェック（1000文字）
     */
    maxLength: (v: string): boolean | string =>
      !v ||
      v.length <= 1000 ||
      (LL.value?.validation.maxLength({ max: 1000 }) ?? 'Must be at most 1000 characters'),
  };

  return { rules };
}
