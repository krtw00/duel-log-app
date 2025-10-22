/**
 * エラーハンドリングユーティリティ
 */

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
 * @param defaultMessage - デフォルトメッセージ
 * @returns エラーメッセージ
 */
export function getErrorMessage(error: unknown, defaultMessage = 'エラーが発生しました'): string {
  if (isApiError(error)) {
    return error.response?.data?.detail || defaultMessage;
  }

  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
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
