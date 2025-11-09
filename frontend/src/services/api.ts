import axios, { AxiosError } from 'axios';
import { useNotificationStore } from '../stores/notification';
import { useLoadingStore } from '../stores/loading';
import { useAuthStore } from '../stores/auth';
import type { ApiErrorResponse, ValidationErrorDetail } from '../types/api';

// 環境変数からAPIのベースURLを取得
const RAW_API_BASE_URL = import.meta.env.VITE_API_URL;

// 環境変数が設定されていない場合の警告
if (!RAW_API_BASE_URL) {
  console.error('VITE_API_URL environment variable is not set');
  throw new Error('API URL is not configured. Please check your .env file.');
}

// Playwright など一部環境では localhost が IPv6 (::1) に解決され、
// バックエンドが IPv4 のみで待ち受けていると接続できないケースがある。
// そのためテスト環境では 127.0.0.1 に正規化して確実に到達させる。
const API_BASE_URL = RAW_API_BASE_URL.replace('://localhost', '://127.0.0.1');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // クロスオリジンリクエストでクッキーを送信するために必要
});

// リクエストインターセプター
api.interceptors.request.use(
  (config) => {
    // ローディング開始
    const loadingStore = useLoadingStore();
    const requestId = `${config.method}-${config.url}`;
    config.metadata = { requestId };
    loadingStore.start(requestId);

    // localStorage からトークンを取得して Authorization ヘッダーに設定
    // これにより、Cookie が機能しない環境（Docker でのクロスオリジン など）でも認証が動作する
    // Safari/iOS/MacOS Cookie 制限環境にも対応
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Using Authorization header from localStorage');
    }

    // リクエスト詳細ログ
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      withCredentials: config.withCredentials,
      hasAuthHeader: !!config.headers.Authorization,
      hasCookieFromStorage: !!token,
    });

    return config;
  },
  (error) => {
    const loadingStore = useLoadingStore();
    loadingStore.stopAll();
    return Promise.reject(error);
  },
);

// レスポンスインターセプター
api.interceptors.response.use(
  (response) => {
    // ローディング終了
    const loadingStore = useLoadingStore();
    const requestId = response.config.metadata?.requestId;
    if (requestId) {
      loadingStore.stop(requestId);
    }

    console.log(`[API Response] ${response.status} ${response.config.url}`);

    return response;
  },
  (error: AxiosError) => {
    // ローディング終了
    const loadingStore = useLoadingStore();
    const requestId = error.config?.metadata?.requestId;
    if (requestId) {
      loadingStore.stop(requestId);
    } else {
      // requestIdが取得できない場合（ネットワークエラーなど）は全てのローディングを停止
      loadingStore.stopAll();
    }

    const notificationStore = useNotificationStore();
    const authStore = useAuthStore();

    // エラーメッセージの取得
    let message = 'エラーが発生しました';

    if (error.response) {
      // サーバーからのレスポンスがある場合
      const status = error.response.status;
      const data = error.response.data as ApiErrorResponse;

      console.error(`[API Error] ${status} ${error.config?.url}`, {
        detail: data?.detail,
        isMe: error.config?.url?.endsWith('/me'),
      });

      switch (status) {
        case 400:
          message =
            (typeof data?.detail === 'string' ? data.detail : undefined) ||
            'リクエストが正しくありません';
          break;
        case 401:
          // /meエンドポイントからの401エラーは、単に「ログインしていない」状態を示すため、
          // 自動的なログアウト処理を引き起こさないようにする。
          if (error.config?.url?.endsWith('/me')) {
            console.log('[API] 401 from /me - not authenticated yet');
            // このエラーは後続の処理でハンドリングされるため、ここでは何もしない
          } else {
            // 他のAPIからの401エラーは「セッション切れ」を示す可能性
            // ただし、Cookie未反映・タイミング等の一過性要因もあり得るため、
            // Authorization ヘッダー等の実証的根拠がある場合のみログアウトを実施する。
            const hadAuthHeader = !!(error.config?.headers as any)?.Authorization;
            const hadLocalToken = !!localStorage.getItem('access_token');

            console.warn('[API] 401 from non-/me endpoint', {
              url: error.config?.url,
              hadAuthHeader,
              hadLocalToken,
              isInitialized: authStore.isInitialized,
            });
            message = '認証の有効期限が切れました。再度ログインしてください';

            // 初期化前（=起動直後）はログアウトしない。
            // また、Authorization ヘッダーも localStorage トークンも無い場合は、
            // 強制ログアウトせず、ガードに任せて遷移させる（過剰リダイレクト防止）。
            if (authStore.isInitialized && (hadAuthHeader || hadLocalToken)) {
              authStore.logout();
            }
          }
          break;
        case 403:
          message = 'この操作を行う権限がありません';
          break;
        case 404:
          message =
            (typeof data?.detail === 'string' ? data.detail : undefined) ||
            'リソースが見つかりません';
          break;
        case 422:
          // バリデーションエラー
          if (Array.isArray(data?.detail)) {
            const errors = (data.detail as ValidationErrorDetail[])
              .map((err) => {
                const field = err.loc?.join('.') || 'フィールド';
                return `${field}: ${err.msg}`;
              })
              .join(', ');
            message = `入力エラー: ${errors}`;
          } else {
            message =
              (typeof data?.detail === 'string' ? data.detail : undefined) ||
              '入力内容に誤りがあります';
          }
          break;
        case 500:
          message = 'サーバーエラーが発生しました';
          break;
        case 503:
          message = 'サービスが一時的に利用できません';
          break;
        default:
          message =
            (typeof data?.detail === 'string' ? data.detail : undefined) ||
            `エラーが発生しました (${status})`;
      }
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない
      message = 'サーバーに接続できません。ネットワーク接続を確認してください';
    } else {
      // リクエスト設定時のエラー
      message = error.message || 'リクエストの作成に失敗しました';
    }

    // 401と422エラーは自動通知を表示しない
    // （フォームバリデーションや認証エラーはコンポーネント側で処理）
    if (error.response?.status !== 401 && error.response?.status !== 422) {
      notificationStore.error(message);
    }

    return Promise.reject(error);
  },
);

/* eslint-disable jsdoc/require-jsdoc */
/**
 * TypeScript用の型拡張
 * Axios のリクエスト設定に requestId メタデータを保持できるようにする。
 */
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      requestId: string;
    };
  }
}
/* eslint-enable jsdoc/require-jsdoc */

/** 共通で利用する Axios インスタンス */
export default api;
