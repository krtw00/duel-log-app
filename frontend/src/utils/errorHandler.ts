/**
 * エラーハンドリングユーティリティ
 */

import { getLL } from '../i18n';

/**
 * APIエラーレスポンスの型
 */
interface ApiErrorResponse {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

/**
 * エラーオブジェクトからエラーメッセージを抽出
 * @param error - エラーオブジェクト
 * @param defaultMessage - デフォルトメッセージ（省略時は翻訳を使用）
 * @returns エラーメッセージ
 */
export function getErrorMessage(error: unknown, defaultMessage?: string): string {
  const fallbackMessage = defaultMessage ?? getLL()?.common.error() ?? 'An error occurred';
  if (isApiError(error)) {
    return error.response?.data?.detail || fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallbackMessage;
}

/**
 * エラーがAPIエラーかどうかを判定
 * @param error - エラーオブジェクト
 * @returns APIエラーかどうか
 */
export function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as Record<string, unknown>).response === 'object'
  );
}
