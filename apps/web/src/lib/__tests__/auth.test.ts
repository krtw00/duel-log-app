import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCsrfToken, refreshSession } from '../auth.js';

/**
 * jsdom の document.cookie は加算的なので、
 * テスト前後に既存 cookie を Max-Age=0 で失効させるヘルパ。
 */
function clearAllCookies() {
  const pairs = document.cookie.split(';');
  for (const pair of pairs) {
    const key = pair.split('=')[0]?.trim();
    if (key) {
      document.cookie = `${key}=; Max-Age=0; path=/`;
    }
  }
}

describe('getCsrfToken', () => {
  beforeEach(() => {
    clearAllCookies();
  });

  afterEach(() => {
    clearAllCookies();
  });

  it('dlog_csrf cookie が単独で存在する場合、その値を返す', () => {
    document.cookie = 'dlog_csrf=abc123';
    expect(getCsrfToken()).toBe('abc123');
  });

  it('複数 cookie に混在していても dlog_csrf を正しく抽出する', () => {
    document.cookie = 'foo=1';
    document.cookie = 'dlog_csrf=abc123';
    document.cookie = 'bar=2';
    expect(getCsrfToken()).toBe('abc123');
  });

  it('dlog_csrf が存在しない場合は null を返す', () => {
    document.cookie = 'foo=bar';
    expect(getCsrfToken()).toBeNull();
  });

  it('cookie が一件もない場合は null を返す', () => {
    expect(getCsrfToken()).toBeNull();
  });

  it('URL エンコードされた値を decodeURIComponent して返す', () => {
    // スペースや記号を含む値を percent-encode して cookie にセット
    document.cookie = 'dlog_csrf=hello%20world%21';
    expect(getCsrfToken()).toBe('hello world!');
  });
});

describe('refreshSession', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('並行する複数呼び出しで refresh リクエストを1回だけ送る', async () => {
    let resolveFetch!: (response: Response) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const results = [refreshSession(), refreshSession(), refreshSession()];

    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveFetch(new Response(null, { status: 200 }));
    await expect(Promise.all(results)).resolves.toEqual([true, true, true]);
  });

  it('完了後の次回呼び出しでは新しい refresh リクエストを送る', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await refreshSession();
    await refreshSession();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
