import axios, { AxiosError } from 'axios';
import { useNotificationStore } from '../stores/notification';
import { useLoadingStore } from '../stores/loading';
import { useAuthStore } from '../stores/auth';
import { supabase } from '../lib/supabase';
import type { ApiErrorResponse, ValidationErrorDetail } from '../types/api';
import { createLogger } from '../utils/logger';

const logger = createLogger('API');

// 環境変数からAPIのベースURLを取得
const IS_TEST = import.meta.env.MODE === 'test';
const RAW_API_BASE_URL = import.meta.env.VITE_API_URL ?? (IS_TEST ? 'http://127.0.0.1' : undefined);

// 環境変数が設定されていない場合の警告
if (!RAW_API_BASE_URL) {
  logger.error('VITE_API_URL environment variable is not set');
  throw new Error('API URL is not configured. Please check your .env file.');
}

export const normalizeApiBaseUrl = (
  raw: string,
  options?: { isDev?: boolean; runtimeHostname?: string },
) => {
  // .env の末尾スペース等でURLが壊れると、ブラウザ側で ERR_EMPTY_RESPONSE などになり得る。
  // ここで安全に正規化しておく。
  const trimmed = raw.trim();
  if (trimmed !== raw) {
    logger.warn('VITE_API_URL contained leading/trailing whitespace; trimmed.');
  }

  // Docker 内からは backend:8000 で到達できるが、ブラウザからは名前解決できない。
  // 誤設定でも開発が詰まらないように、dev かつブラウザ実行時は現在ホストへ寄せる。
  // 例: http://backend:8000 -> http://localhost:8000
  const hasRuntimeHostname = !!options?.runtimeHostname && options.runtimeHostname !== '';

  const maybeRewrittenForDev = hasRuntimeHostname
    ? trimmed.replace(/^(https?:\/\/)backend(?=[:/]|$)/, `$1${options.runtimeHostname}`)
    : trimmed;

  // Playwright など一部環境では localhost が IPv6 (::1) に解決され、
  // バックエンドが IPv4 のみで待ち受けていると接続できないケースがある。
  // そのため localhost は 127.0.0.1 に正規化して確実に到達させる。
  return maybeRewrittenForDev.replace('://localhost', '://127.0.0.1').replace(/\/+$/, '');
};

const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL, {
  isDev: import.meta.env.DEV,
  runtimeHostname: typeof window !== 'undefined' ? window.location.hostname : undefined,
});

logger.info('baseURL resolved', {
  baseURL: API_BASE_URL,
  mode: import.meta.env.MODE,
});

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // クロスオリジンリクエストでクッキーを送信するために必要
});

export const normalizeApiRequestUrl = (
  baseURL: string | undefined,
  url: string | undefined,
): string | undefined => {
  if (!baseURL || !url) return url;
  // axios は url が "/" 始まりだと baseURL のパス部分を無視する（/api + /me => /me になる）。
  // Docker dev では baseURL に "/api" を使うため、ここで先頭の "/" を落として常に baseURL を効かせる。
  if (/^https?:\/\//.test(url)) return url;
  return url.replace(/^\/+/, '');
};

// リクエストインターセプター
api.interceptors.request.use(
  async (config) => {
    config.url = normalizeApiRequestUrl(config.baseURL, config.url);

    // ローディング開始
    const loadingStore = useLoadingStore();
    const requestId = `${config.method}-${config.url}`;
    config.metadata = { requestId };
    loadingStore.start(requestId);

    // Supabase セッションからトークンを取得して Authorization ヘッダーに設定
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
        logger.debug('Using Supabase access token');
      }
    } catch (error) {
      logger.warn('Failed to get Supabase session:', error);
    }

    // リクエスト詳細ログ
    logger.debug(`Request: ${config.method?.toUpperCase()} ${config.url}`);

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

    logger.debug(`Response: ${response.status} ${response.config.url}`);

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

      logger.error(`Error: ${status} ${error.config?.url}`);

      switch (status) {
        case 400:
          message =
            (typeof data?.detail === 'string' ? data.detail : undefined) ||
            'リクエストが正しくありません';
          break;
        case 401:
          // 認証エラー
          logger.warn('401 - session may have expired');
          message = '認証の有効期限が切れました。再度ログインしてください';

          // 初期化前はログアウトしない
          if (authStore.isInitialized && authStore.isAuthenticated) {
            authStore.logout();
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
