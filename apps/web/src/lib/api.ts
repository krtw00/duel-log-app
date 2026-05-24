import { getCsrfToken, refreshSession } from './auth.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

type RequestOptions = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | undefined>;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const MAINTENANCE_BYPASS_KEY = import.meta.env.VITE_MAINTENANCE_BYPASS_KEY || '';

function getBaseHeaders(method: string): Record<string, string> {
  const headers: Record<string, string> = {};

  // メンテナンスバイパスが有効な場合、ヘッダーを追加
  const hasBypass = sessionStorage.getItem('maintenance_bypass') === 'true';
  if (hasBypass && MAINTENANCE_BYPASS_KEY) {
    headers['X-Bypass-Key'] = MAINTENANCE_BYPASS_KEY;
  }

  // 変更系メソッドには CSRF トークンを付与
  const isStateMutating = !['GET', 'HEAD'].includes(method.toUpperCase());
  if (isStateMutating) {
    const csrf = getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  return headers;
}

async function doFetch(url: string, method: string, body: unknown): Promise<Response> {
  const headers: Record<string, string> = getBaseHeaders(method);

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options;
  const baseUrl = API_BASE_URL;

  let url = `${baseUrl}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) searchParams.set(key, value);
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  let response = await doFetch(url, method, body);

  // 401 リトライ: auth エンドポイント以外で 1 回だけ refresh を試みる
  if (response.status === 401 && !path.startsWith('/auth/')) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await doFetch(url, method, body);
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = (errorBody as { error?: { code?: string; message?: string } }).error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? `Request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}
