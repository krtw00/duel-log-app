import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// getCsrfToken を vi.mock でモック（api.ts は './auth.js' から import している）
vi.mock('../auth.js', () => ({
  getCsrfToken: vi.fn(),
  refreshSession: vi.fn().mockResolvedValue(false),
}));

import { ApiError, api } from '../api.js';
import { getCsrfToken } from '../auth.js';

const mockGetCsrfToken = vi.mocked(getCsrfToken);

/** fetch のモック: status=200, json ボディを返す */
function mockFetchOk(body: unknown = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
}

/** fetch のモック: status=status, json エラーボディを返す */
function mockFetchError(status: number, errorBody: unknown = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(errorBody), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
}

/** sessionStorage を空にして fetch モックを解除 */
function resetEnv() {
  vi.unstubAllGlobals();
  sessionStorage.clear();
}

beforeEach(() => {
  mockGetCsrfToken.mockReturnValue(null);
});

afterEach(() => {
  resetEnv();
  vi.clearAllMocks();
});

describe('api() - CSRF ヘッダ付与', () => {
  it('POST (mutation) のとき X-CSRF-Token に getCsrfToken の値が付く', async () => {
    mockGetCsrfToken.mockReturnValue('token-xyz');
    mockFetchOk({ data: {} });

    await api('/decks', { method: 'POST', body: {} });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const headers = (fetchCall?.[1]?.headers ?? {}) as Record<string, string>;
    expect(headers['X-CSRF-Token']).toBe('token-xyz');
  });

  it('PUT (mutation) のとき X-CSRF-Token が付く', async () => {
    mockGetCsrfToken.mockReturnValue('token-put');
    mockFetchOk({ data: {} });

    await api('/decks/1', { method: 'PUT', body: {} });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const headers = (fetchCall?.[1]?.headers ?? {}) as Record<string, string>;
    expect(headers['X-CSRF-Token']).toBe('token-put');
  });

  it('DELETE (mutation) のとき X-CSRF-Token が付く', async () => {
    mockGetCsrfToken.mockReturnValue('token-del');
    mockFetchOk({ data: {} });

    await api('/decks/1', { method: 'DELETE' });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const headers = (fetchCall?.[1]?.headers ?? {}) as Record<string, string>;
    expect(headers['X-CSRF-Token']).toBe('token-del');
  });

  it('GET では X-CSRF-Token が付かない', async () => {
    mockGetCsrfToken.mockReturnValue('should-not-appear');
    mockFetchOk({ data: {} });

    await api('/decks');

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const headers = (fetchCall?.[1]?.headers ?? {}) as Record<string, string>;
    expect(headers['X-CSRF-Token']).toBeUndefined();
  });

  it('HEAD では X-CSRF-Token が付かない', async () => {
    mockGetCsrfToken.mockReturnValue('should-not-appear');
    mockFetchOk({});

    await api('/decks', { method: 'HEAD' });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const headers = (fetchCall?.[1]?.headers ?? {}) as Record<string, string>;
    expect(headers['X-CSRF-Token']).toBeUndefined();
  });

  it('getCsrfToken が null のとき POST でも X-CSRF-Token が付かない', async () => {
    mockGetCsrfToken.mockReturnValue(null);
    mockFetchOk({ data: {} });

    await api('/decks', { method: 'POST', body: {} });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const headers = (fetchCall?.[1]?.headers ?? {}) as Record<string, string>;
    expect(headers['X-CSRF-Token']).toBeUndefined();
  });
});

describe('api() - credentials', () => {
  it('fetch に credentials:"include" が渡される', async () => {
    mockGetCsrfToken.mockReturnValue(null);
    mockFetchOk({ data: {} });

    await api('/decks');

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall?.[1]?.credentials).toBe('include');
  });
});

describe('api() - エラーハンドリング', () => {
  it('レスポンスが ok でない場合 ApiError が投げられる', async () => {
    mockFetchError(403, {
      error: { code: 'FORBIDDEN', message: 'CSRF token missing' },
    });

    await expect(api('/decks', { method: 'POST', body: {} })).rejects.toThrow(ApiError);
  });

  it('ApiError には status・code・message が正しく設定される', async () => {
    mockFetchError(403, {
      error: { code: 'FORBIDDEN', message: 'CSRF token missing' },
    });

    try {
      await api('/decks', { method: 'POST', body: {} });
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      const err = e as ApiError;
      expect(err.status).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
      expect(err.message).toBe('CSRF token missing');
    }
  });

  it('エラーボディが空でも ApiError が投げられ UNKNOWN_ERROR コードが使われる', async () => {
    mockFetchError(500, {});

    try {
      await api('/decks', { method: 'POST', body: {} });
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      const err = e as ApiError;
      expect(err.status).toBe(500);
      expect(err.code).toBe('UNKNOWN_ERROR');
    }
  });
});
