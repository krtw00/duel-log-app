import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getCsrfToken } from '../auth.js';

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
