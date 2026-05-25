import { randomUUID } from 'node:crypto';
import type { Context } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';

/** 認証 cookie 名（フロントの dlog_csrf 読取・サーバー読取で共有する契約） */
export const COOKIE_NAMES = {
  access: 'dlog_access',
  refresh: 'dlog_refresh',
  csrf: 'dlog_csrf',
} as const;

/** CSRF Double Submit 用のリクエストヘッダ名（フロントと共有する契約） */
export const CSRF_HEADER = 'X-CSRF-Token';

// jwt.ts の ACCESS_TOKEN_TTL='1h' / REFRESH_TOKEN_TTL='30d' と揃える
const ACCESS_MAX_AGE = 60 * 60; // 1h
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30d

// access は全 API に送る。refresh は auth 系にだけ送る（最小権限）
const BASE_PATH = '/api';
const REFRESH_PATH = '/api/auth';
// csrf はフロント (SPA, path=/ 配下) が document.cookie で読む必要があるため path=/。
// path=/api だと SPA のページから読めず X-CSRF-Token を付けられない（= 全 mutation が 403）。
const CSRF_PATH = '/';

// 本番のみ Secure（dev は http localhost なので付けない）。
// Domain 未指定なら発行ホスト限定（dev で素直に動く）。本番は `.codenica.dev` を渡して same-site 共有。
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const IS_PROD = process.env.NODE_ENV === 'production';

function baseOptions() {
  return { domain: COOKIE_DOMAIN, secure: IS_PROD, sameSite: 'Lax' as const };
}

export function generateCsrfToken(): string {
  return randomUUID();
}

export function setAuthCookies(
  c: Context,
  tokens: { accessToken: string; refreshToken: string; csrfToken: string },
): void {
  setCookie(c, COOKIE_NAMES.access, tokens.accessToken, {
    ...baseOptions(),
    httpOnly: true,
    path: BASE_PATH,
    maxAge: ACCESS_MAX_AGE,
  });
  setCookie(c, COOKIE_NAMES.refresh, tokens.refreshToken, {
    ...baseOptions(),
    httpOnly: true,
    path: REFRESH_PATH,
    maxAge: REFRESH_MAX_AGE,
  });
  // CSRF token はフロントが読んで X-CSRF-Token ヘッダに載せるため httpOnly にしない。
  // path=/ にして SPA のどのページからも document.cookie で読めるようにする。
  setCookie(c, COOKIE_NAMES.csrf, tokens.csrfToken, {
    ...baseOptions(),
    httpOnly: false,
    path: CSRF_PATH,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(c: Context): void {
  deleteCookie(c, COOKIE_NAMES.access, { ...baseOptions(), path: BASE_PATH });
  deleteCookie(c, COOKIE_NAMES.refresh, { ...baseOptions(), path: REFRESH_PATH });
  deleteCookie(c, COOKIE_NAMES.csrf, { ...baseOptions(), path: CSRF_PATH });
}
