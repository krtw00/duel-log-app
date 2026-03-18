import { supabase } from './supabase.js';

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const legacyWebHosts = new Set(['duel-log-app.vercel.app']);

function resolveBaseUrl() {
  const currentOrigin = window.location.origin;
  if (legacyWebHosts.has(window.location.hostname)) {
    return currentOrigin;
  }
  return DEFAULT_API_BASE_URL;
}

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

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  // メンテナンスバイパスが有効な場合、ヘッダーを追加
  const hasBypass = sessionStorage.getItem('maintenance_bypass') === 'true';
  if (hasBypass && MAINTENANCE_BYPASS_KEY) {
    headers['X-Bypass-Key'] = MAINTENANCE_BYPASS_KEY;
  }

  return headers;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options;
  const baseUrl = resolveBaseUrl();

  let url = `${baseUrl}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) searchParams.set(key, value);
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    ...(await getAuthHeaders()),
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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
