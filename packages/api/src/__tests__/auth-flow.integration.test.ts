/**
 * CSRF/cookie 往復の統合テスト。
 *
 * 背景: dlog_csrf を path=/api で発行していた時期があり、SPA (path=/ 配下) が
 * document.cookie で読めず X-CSRF-Token を付けられず全 mutation が 403 になった。
 * このテストは同じ問題が再発したら必ず落ちるよう設計されている。
 *
 * ポイント: cookiesReadableAtPath() でブラウザの path フィルタを模倣し、
 * SPA ルートから見えない cookie を使ってミューテーションしようとすると失敗することを確認する。
 */

import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { csrfMiddleware } from '../middleware/csrf.js';
import { setAuthCookies } from '../lib/cookies.js';

// ---------------------------------------------------------------------------
// テスト用スタブアプリ
// ---------------------------------------------------------------------------

function buildApp() {
  // 実際のパス構造を再現するため basePath('/api') を使う
  const app = new Hono().basePath('/api');

  // CSRF ミドルウェアをグローバルに適用
  app.use('*', csrfMiddleware);

  // POST /api/auth/login: CSRF 免除パス。DB 無しで setAuthCookies だけ呼ぶ
  app.post('/auth/login', (c) => {
    setAuthCookies(c, { accessToken: 'AT', refreshToken: 'RT', csrfToken: 'CT' });
    return c.json({ ok: true });
  });

  // POST /api/decks: csrfMiddleware のみ通過確認。authMiddleware は使わない
  app.post('/decks', (c) => c.json({ ok: true }));

  return app;
}

// ---------------------------------------------------------------------------
// ブラウザの document.cookie path フィルタを模倣するヘルパ
//
// RFC 6265 のパスマッチ規則:
//   cookiePath が "/" の場合は常にマッチ。
//   requestPath が cookiePath と等しい場合はマッチ。
//   requestPath が cookiePath + "/" の前方一致の場合はマッチ。
// これにより、SPA が特定ページパスで document.cookie から読める cookie 集合を再現する。
// ---------------------------------------------------------------------------

function cookiesReadableAtPath(setCookieHeaders: string[], pagePath: string): Map<string, string> {
  const result = new Map<string, string>();

  for (const header of setCookieHeaders) {
    // 各属性を "; " で分割
    const parts = header.split(/;\s*/);
    if (parts.length === 0) continue;

    // 最初の要素が name=value
    const nameValue = parts[0];
    if (nameValue === undefined) continue;
    const eqIdx = nameValue.indexOf('=');
    if (eqIdx === -1) continue;
    const name = nameValue.slice(0, eqIdx).trim();
    const value = nameValue.slice(eqIdx + 1).trim();

    // Path 属性を探す（大文字小文字無視）
    let cookiePath: string | undefined;
    for (const part of parts.slice(1)) {
      const m = part.match(/^Path=(.*)$/i);
      if (m) {
        cookiePath = (m[1] ?? '').trim();
        break;
      }
    }

    // Path 属性がない場合はデフォルト可視扱い（現実装では使わないが念のため）
    if (cookiePath === undefined) {
      result.set(name, value);
      continue;
    }

    // RFC 6265 path-match
    if (pathMatch(cookiePath, pagePath)) {
      result.set(name, value);
    }
  }

  return result;
}

/**
 * RFC 6265 のパスマッチ規則。
 * cookiePath が requestPath の "prefix" であるかを判定する。
 */
function pathMatch(cookiePath: string, requestPath: string): boolean {
  // cookiePath が "/" なら全パスにマッチ
  if (cookiePath === '/') return true;
  // 完全一致
  if (requestPath === cookiePath) return true;
  // requestPath が cookiePath + "/" の前方一致
  if (requestPath.startsWith(cookiePath.endsWith('/') ? cookiePath : cookiePath + '/')) return true;
  return false;
}

// ---------------------------------------------------------------------------
// テストケース
// ---------------------------------------------------------------------------

describe('CSRF/cookie 往復 統合テスト', () => {
  it('login レスポンスの dlog_csrf が SPA ルート(/) から読める', async () => {
    // path=/api だとここで落ちる。SPA ルートから dlog_csrf が見えないため
    const app = buildApp();
    const res = await app.request('/api/auth/login', { method: 'POST' });
    expect(res.status).toBe(200);

    const setCookies = res.headers.getSetCookie();
    const readable = cookiesReadableAtPath(setCookies, '/');

    // SPA のどのページからも dlog_csrf が document.cookie で読めること
    expect(
      readable.get('dlog_csrf'),
      'dlog_csrf が path=/ から読めない — path=/api になっていないか確認',
    ).toBe('CT');
  });

  it('login → dlog_csrf をヘッダに載せて POST /decks → 200 (フロントの実フロー再現)', async () => {
    const app = buildApp();

    // Step1: login して cookie を取得
    const loginRes = await app.request('/api/auth/login', { method: 'POST' });
    expect(loginRes.status).toBe(200);

    const setCookies = loginRes.headers.getSetCookie();

    // Step2: SPA ルートから読める cookie のみを取り出す（ブラウザの path フィルタ模倣）
    const readableAtRoot = cookiesReadableAtPath(setCookies, '/');
    const csrfToken = readableAtRoot.get('dlog_csrf');

    // dlog_csrf が読めない場合はここで落ちる（path=/api バグの再現）
    expect(
      csrfToken,
      'dlog_csrf が path=/ から読めない — path=/api になっていないか確認',
    ).toBeTruthy();

    // Step3: 全 cookie を Cookie ヘッダにまとめる（ブラウザが自動で送る動作）
    // name=value の形式で結合
    const allCookies = setCookies
      .map((h) => h.split(/;\s*/)[0]) // name=value だけ取り出す
      .join('; ');

    // Step4: X-CSRF-Token ヘッダに dlog_csrf の値を載せて mutation を実行
    const deckRes = await app.request('/api/decks', {
      method: 'POST',
      headers: {
        Cookie: allCookies,
        'X-CSRF-Token': csrfToken!,
      },
    });

    expect(deckRes.status).toBe(200);
  });

  it('X-CSRF-Token ヘッダなしで POST /decks → 403 (回帰防止)', async () => {
    const app = buildApp();

    // login して cookie を取得
    const loginRes = await app.request('/api/auth/login', { method: 'POST' });
    const setCookies = loginRes.headers.getSetCookie();
    const allCookies = setCookies.map((h) => h.split(/;\s*/)[0]).join('; ');

    // X-CSRF-Token を付けずにリクエスト
    const deckRes = await app.request('/api/decks', {
      method: 'POST',
      headers: { Cookie: allCookies },
    });

    expect(deckRes.status).toBe(403);
    const body = (await deckRes.json()) as { error: { code: string } };
    expect(body.error.code).toBe('CSRF_FAILED');
  });
});
