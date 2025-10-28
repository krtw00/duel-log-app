/**
 * 対戦記録フォームのバリデーション Composable
 *
 * @description
 * DuelFormDialog で使用されるバリデーションルールを提供します。
 * Vuetifyのv-text-fieldやv-selectなどのフォームコンポーネントで使用可能な
 * バリデーション関数を提供します。
 *
 * @remarks
 * Vuetifyのバリデーションルールは、以下の形式で定義します：
 * - `true` を返す場合: バリデーション成功
 * - エラーメッセージ文字列を返す場合: バリデーション失敗
 *
 * @example
 * ```typescript
 * import { useDuelFormValidation } from '@/composables/useDuelFormValidation';
 *
 * // Composableを使用
 * const { rules } = useDuelFormValidation();
 *
 * // テンプレートで使用
 * // <v-select :rules="[rules.required]" label="デッキ選択" />
 * // <v-text-field :rules="[rules.required, rules.number]" label="ランク" />
 * // <v-textarea :rules="[rules.maxLength]" label="メモ" />
 * ```
 */

export function useDuelFormValidation() {
  /**
   * バリデーションルール集
   *
   * @remarks
   * 各ルールは関数として定義され、入力値を受け取り、
   * バリデーション結果（true または エラーメッセージ）を返します。
   * 複数のルールを配列で指定することで、順次実行されます。
   */
  const rules = {
    /**
     * 必須入力チェック
     *
     * @param {unknown} v - 検証する値
     * @returns {boolean | string} 検証成功時はtrue、失敗時はエラーメッセージ
     *
     * @remarks
     * 以下の値は入力なしとみなされます：
     * - `null`
     * - `undefined`
     * - 空文字列 `''`
     *
     * 0や false は有効な値として扱われます。
     *
     * @example
     * ```typescript
     * rules.required('test');    // true
     * rules.required('');        // '入力必須です'
     * rules.required(null);      // '入力必須です'
     * rules.required(0);         // true (0は有効な値)
     * rules.required(false);     // true (falseは有効な値)
     * ```
     */
    required: (v: unknown): boolean | string =>
      (v !== null && v !== undefined && v !== '') || '入力必須です',

    /**
     * 数値チェック（0以上の整数）
     *
     * @param {unknown} v - 検証する値
     * @returns {boolean | string} 検証成功時はtrue、失敗時はエラーメッセージ
     *
     * @remarks
     * - 文字列を数値に変換可能か確認
     * - 変換後の値が0以上かチェック
     * - 負の数は許可されません
     * - 小数は許可されます（例: 1.5）
     *
     * 主にランク値の入力で使用されます。
     *
     * @example
     * ```typescript
     * rules.number('10');        // true
     * rules.number('0');         // true
     * rules.number('-1');        // '0以上の数値を入力してください'
     * rules.number('abc');       // '0以上の数値を入力してください'
     * rules.number('1.5');       // true
     * ```
     */
    number: (v: unknown): boolean | string =>
      (!isNaN(Number(v)) && Number(v) >= 0) || '0以上の数値を入力してください',

    /**
     * 最大文字数チェック（1000文字以内）
     *
     * @param {string} v - 検証する文字列
     * @returns {boolean | string} 検証成功時はtrue、失敗時はエラーメッセージ
     *
     * @remarks
     * - 空文字列・null・undefinedは許可（任意入力のため）
     * - 1000文字を超える入力は拒否
     * - 主にメモフィールドで使用されます
     *
     * 文字数は`length`プロパティで判定されるため、
     * サロゲートペア文字（絵文字など）は2文字としてカウントされる場合があります。
     *
     * @example
     * ```typescript
     * rules.maxLength('短いメモ');                        // true
     * rules.maxLength('');                               // true
     * rules.maxLength('a'.repeat(1000));                 // true
     * rules.maxLength('a'.repeat(1001));                 // '1000文字以内で入力してください'
     * ```
     */
    maxLength: (v: string): boolean | string =>
      !v || v.length <= 1000 || '1000文字以内で入力してください',
  };

  return { rules };
}
