/**
 * API関連の型定義
 */

/**
 * バリデーションエラーの詳細
 */
export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/**
 * APIエラーレスポンス
 */
export interface ApiErrorResponse {
  detail?: string | ValidationErrorDetail[];
  message?: string;
  error?: string;
}

/**
 * 認証トークンレスポンス
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/**
 * パスワードリセットリクエスト
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * パスワードリセット実行
 */
export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

/**
 * パスワード変更
 */
export interface PasswordChange {
  current_password: string;
  new_password: string;
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

/**
 * 汎用APIレスポンス
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * ファイルアップロードレスポンス
 */
export interface FileUploadResponse {
  filename: string;
  size: number;
  url?: string;
}

/**
 * データエクスポートレスポンス
 */
export interface DataExportResponse {
  filename: string;
  size: number;
  download_url: string;
  expires_at: string;
}
