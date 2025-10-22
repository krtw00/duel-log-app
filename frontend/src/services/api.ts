import axios, { AxiosError } from 'axios';
import { useNotificationStore } from '../stores/notification';
import { useLoadingStore } from '../stores/loading';
import { useAuthStore } from '../stores/auth';
import type { ApiErrorResponse, ValidationErrorDetail } from '../types/api';

// 環境変数からAPIのベースURLを取得
const API_BASE_URL = import.meta.env.VITE_API_URL;

// 環境変数が設定されていない場合の警告
if (!API_BASE_URL) {
  console.error('VITE_API_URL environment variable is not set');
  throw new Error('API URL is not configured. Please check your .env file.');
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // クロスオリジンリクエストでクッキーを送信するために必要
});

// Safari/MacOS判定ユーティリティ
// MacOSではCookie制限が厳しいため、Authorizationヘッダーを使用
function shouldUseAuthorizationHeader(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  const isSafariBrowser =
    ua.includes('safari') && !ua.includes('chrome') && !ua.includes('edg');
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isMacOS = /macintosh|mac os x/.test(ua);
  return isSafariBrowser || isIOS || isMacOS;
}

// リクエストインターセプター
api.interceptors.request.use(
  (config) => {
    // ローディング開始
    const loadingStore = useLoadingStore();
    const requestId = `${config.method}-${config.url}`;
    config.metadata = { requestId };
    loadingStore.start(requestId);

    // Safari/MacOS Cookie制限対策: localStorageからトークンを取得してAuthorizationヘッダーに設定
    if (shouldUseAuthorizationHeader()) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Using Authorization header for Safari/iOS/MacOS');
      }
    }

    // Safari/MacOS対応デバッグログ
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      withCredentials: config.withCredentials,
      headers: config.headers,
      useAuthHeader: shouldUseAuthorizationHeader(),
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

    // Safari/MacOS対応デバッグログ
    console.log(`[API Response] ${response.status} ${response.config.url}`, {
      setCookie: response.headers['set-cookie'],
    });

    return response;
  },
  (error: AxiosError) => {
    // ローディング終了
    const loadingStore = useLoadingStore();
    const requestId = error.config?.metadata?.requestId;
    if (requestId) {
      loadingStore.stop(requestId);
    }

    const notificationStore = useNotificationStore();
    const authStore = useAuthStore();

    // エラーメッセージの取得
    let message = 'エラーが発生しました';

    if (error.response) {
      // サーバーからのレスポンスがある場合
      const status = error.response.status;
      const data = error.response.data as ApiErrorResponse;

      switch (status) {
        case 400:
          message = (typeof data?.detail === 'string' ? data.detail : undefined) || 'リクエストが正しくありません';
          break;
        case 401:
          message = '認証エラーです。再度ログインしてください';
          // トークンを削除してログイン画面へ
          authStore.logout();
          break;
        case 403:
          message = 'この操作を行う権限がありません';
          break;
        case 404:
          message = (typeof data?.detail === 'string' ? data.detail : undefined) || 'リソースが見つかりません';
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
            message = (typeof data?.detail === 'string' ? data.detail : undefined) || '入力内容に誤りがあります';
          }
          break;
        case 500:
          message = 'サーバーエラーが発生しました';
          break;
        case 503:
          message = 'サービスが一時的に利用できません';
          break;
        default:
          message = (typeof data?.detail === 'string' ? data.detail : undefined) || `エラーが発生しました (${status})`;
      }
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない
      message = 'サーバーに接続できません。ネットワーク接続を確認してください';
    } else {
      // リクエスト設定時のエラー
      message = error.message || 'リクエストの作成に失敗しました';
    }

    // 401以外のエラーは通知を表示
    if (error.response?.status !== 401) {
      notificationStore.error(message);
    }

    return Promise.reject(error);
  },
);

// TypeScript用の型拡張
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      requestId: string;
    };
  }
}

export default api;
