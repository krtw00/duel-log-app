import { Hono } from 'hono';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { sql } from '../db/index.js';
import type { UserRow } from '../db/types.js';
import { signAccessToken } from '../lib/jwt.js';
import {
  createDiscordAuthorizationUrl,
  createGitHubAuthorizationUrl,
  createGoogleAuthorizationUrl,
  exchangeDiscordAuthorizationCode,
  exchangeGitHubAuthorizationCode,
  exchangeGoogleAuthorizationCode,
  generateCodeVerifier,
  generateState,
  isDiscordConfigured,
  isGitHubConfigured,
  isGoogleConfigured,
} from '../lib/oauth.js';
import { sendMail } from '../lib/mailer.js';
import { hashPassword, passwordMatches } from '../lib/password.js';
import {
  cleanupExpiredOAuthStates,
  consumeOAuthState,
  createOAuthState,
} from '../services/oauthState.js';
import {
  consumePasswordResetToken,
  createPasswordResetToken,
} from '../services/passwordReset.js';

const WEB_URL = process.env.WEB_URL || 'http://localhost:5173';

const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase());
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(6).max(72),
  displayName: z.string().trim().min(1).max(50),
});
const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
const signOutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
const forgotPasswordSchema = z.object({
  email: emailSchema,
});
const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6).max(72),
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function passwordResetMailText(name: string, url: string): string {
  return `${name} 様

Duel Log のパスワード再設定リクエストを受け付けました。
以下のリンクから新しいパスワードを設定してください (1 時間有効):

${url}

このメールに心当たりがない場合は無視してください。
リクエストしていない場合、アカウントへの不正アクセスの可能性があります。`;
}

function passwordResetMailHtml(name: string, url: string): string {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html lang="ja"><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a; background: #fafafa;">
  <h2 style="color: #00a8cc; margin-bottom: 16px;">Duel Log パスワード再設定</h2>
  <p>${safeName} 様</p>
  <p>Duel Log のパスワード再設定リクエストを受け付けました。<br>以下のボタンから新しいパスワードを設定してください (1 時間有効)。</p>
  <p style="margin: 28px 0;">
    <a href="${safeUrl}" style="display: inline-block; padding: 12px 28px; background: #00a8cc; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 6px;">パスワードを再設定</a>
  </p>
  <p style="font-size: 13px; color: #666;">ボタンが押せない場合は以下の URL を直接ブラウザに貼り付けてください:<br>
  <a href="${safeUrl}" style="color: #00a8cc; word-break: break-all;">${safeUrl}</a></p>
  <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e5e5;">
  <p style="font-size: 12px; color: #999;">このメールに心当たりがない場合は無視してください。リクエストしていない場合、アカウントへの不正アクセスの可能性があります。</p>
</body></html>`;
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function buildFrontendCallbackUrl(tokens: { accessToken: string; refreshToken: string }): string {
  const redirectUrl = new URL('/auth/callback', WEB_URL);
  redirectUrl.searchParams.set('access_token', tokens.accessToken);
  redirectUrl.searchParams.set('refresh_token', tokens.refreshToken);
  return redirectUrl.toString();
}

async function createTokens(user: Pick<UserRow, 'id' | 'email'>) {
  const accessToken = await signAccessToken(user.id, user.email);
  const refreshToken = randomUUID();
  const tokenHash = hashRefreshToken(refreshToken);

  await sql`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${tokenHash}, now() + interval '30 days')
  `;

  return { accessToken, refreshToken };
}

function toAuthUser(user: Pick<UserRow, 'id' | 'email' | 'displayName'>) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}

async function findOrCreateOAuthUser(
  provider: 'google' | 'discord' | 'github',
  providerId: string,
  email: string,
  displayName: string,
): Promise<UserRow> {
  let [user] = await sql<UserRow[]>`
    SELECT * FROM users
    WHERE oauth_provider = ${provider} AND oauth_provider_id = ${providerId}
  `;
  if (user) return user;

  [user] = await sql<UserRow[]>`
    SELECT * FROM users
    WHERE email = ${email}
  `;
  if (user) {
    const [updated] = await sql<UserRow[]>`
      UPDATE users
      SET oauth_provider = ${provider}, oauth_provider_id = ${providerId}, updated_at = now()
      WHERE id = ${user.id}
      RETURNING *
    `;
    if (!updated) {
      throw new Error('Failed to link OAuth user');
    }
    return updated;
  }

  const [created] = await sql<UserRow[]>`
    INSERT INTO users (id, email, display_name, oauth_provider, oauth_provider_id)
    VALUES (${randomUUID()}, ${email}, ${displayName}, ${provider}, ${providerId})
    RETURNING *
  `;
  if (!created) {
    throw new Error('Failed to create OAuth user');
  }
  return created;
}

export const authRoutes = new Hono()
  .post('/login', async (c) => {
    const { email, password } = loginSchema.parse(await c.req.json());

    const [user] = await sql<UserRow[]>`
      SELECT * FROM users WHERE email = ${email}
    `;

    if (!user?.passwordHash || !(await passwordMatches(password, user.passwordHash))) {
      return c.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        401,
      );
    }

    if (user.status !== 'active') {
      return c.json({ error: { code: 'FORBIDDEN', message: `Account is ${user.status}` } }, 403);
    }

    const tokens = await createTokens(user);
    return c.json({ data: { ...tokens, user: toAuthUser(user) } });
  })
  .post('/register', async (c) => {
    const { email, password, displayName } = registerSchema.parse(await c.req.json());

    const [existing] = await sql<Pick<UserRow, 'id'>[]>`
      SELECT id FROM users WHERE email = ${email}
    `;
    if (existing) {
      return c.json(
        { error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } },
        409,
      );
    }

    const passwordHash = await hashPassword(password);
    const [user] = await sql<UserRow[]>`
      INSERT INTO users (id, email, display_name, password_hash)
      VALUES (${randomUUID()}, ${email}, ${displayName}, ${passwordHash})
      RETURNING *
    `;
    if (!user) {
      throw new Error('Failed to create user');
    }

    const tokens = await createTokens(user);
    return c.json({ data: { ...tokens, user: toAuthUser(user) } });
  })
  .post('/refresh', async (c) => {
    const { refreshToken } = refreshSchema.parse(await c.req.json());
    const tokenHash = hashRefreshToken(refreshToken);

    const [row] = await sql<UserRow[]>`
      SELECT u.*
      FROM refresh_tokens rt
      JOIN users u ON u.id = rt.user_id
      WHERE rt.token_hash = ${tokenHash}
        AND rt.expires_at > now()
    `;

    if (!row) {
      return c.json(
        { error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' } },
        401,
      );
    }

    if (row.status !== 'active') {
      return c.json({ error: { code: 'FORBIDDEN', message: `Account is ${row.status}` } }, 403);
    }

    await sql`DELETE FROM refresh_tokens WHERE token_hash = ${tokenHash}`;

    const tokens = await createTokens(row);
    return c.json({ data: { ...tokens, user: toAuthUser(row) } });
  })
  .post('/signout', async (c) => {
    const parsed = signOutSchema.safeParse(await c.req.json().catch(() => ({})));
    const refreshToken = parsed.success ? parsed.data.refreshToken : undefined;

    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      await sql`DELETE FROM refresh_tokens WHERE token_hash = ${tokenHash}`.catch(() => {});
    }

    return c.json({ data: { message: 'Signed out' } });
  })
  .post('/password/forgot', async (c) => {
    const { email } = forgotPasswordSchema.parse(await c.req.json());

    const [user] = await sql<UserRow[]>`
      SELECT * FROM users WHERE email = ${email}
    `;

    if (user?.passwordHash && user.status === 'active') {
      try {
        const token = await createPasswordResetToken(user.id);
        const resetUrl = new URL('/reset-password', WEB_URL);
        resetUrl.searchParams.set('token', token);

        await sendMail({
          to: user.email,
          subject: 'Duel Log パスワード再設定のご案内',
          text: passwordResetMailText(user.displayName, resetUrl.toString()),
          html: passwordResetMailHtml(user.displayName, resetUrl.toString()),
        });
      } catch (err) {
        console.error('[auth/password/forgot] mail send failed', err);
      }
    }

    return c.json({
      data: { message: 'If the email is registered, a reset link has been sent.' },
    });
  })
  .post('/password/reset', async (c) => {
    const { token, password } = resetPasswordSchema.parse(await c.req.json());

    const userId = await consumePasswordResetToken(token);
    if (!userId) {
      return c.json(
        { error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token' } },
        400,
      );
    }

    const passwordHash = await hashPassword(password);
    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}, updated_at = now()
      WHERE id = ${userId}
    `;

    await sql`DELETE FROM refresh_tokens WHERE user_id = ${userId}`;

    return c.json({ data: { message: 'Password updated successfully' } });
  })
  .get('/oauth/google', async (c) => {
    if (!isGoogleConfigured()) {
      return c.json(
        { error: { code: 'NOT_CONFIGURED', message: 'Google OAuth not configured' } },
        500,
      );
    }

    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = createGoogleAuthorizationUrl(state, codeVerifier);

    await createOAuthState({ state, provider: 'google', codeVerifier });

    return c.redirect(url.toString());
  })
  .get('/oauth/discord', async (c) => {
    if (!isDiscordConfigured()) {
      return c.json(
        { error: { code: 'NOT_CONFIGURED', message: 'Discord OAuth not configured' } },
        500,
      );
    }

    const state = generateState();
    const url = createDiscordAuthorizationUrl(state);

    await createOAuthState({ state, provider: 'discord' });

    return c.redirect(url.toString());
  })
  .get('/oauth/github', async (c) => {
    if (!isGitHubConfigured()) {
      return c.json(
        { error: { code: 'NOT_CONFIGURED', message: 'GitHub OAuth not configured' } },
        500,
      );
    }

    const state = generateState();
    const url = createGitHubAuthorizationUrl(state);

    await createOAuthState({ state, provider: 'github' });

    return c.redirect(url.toString());
  })
  .get('/oauth/callback/google', async (c) => {
    if (!isGoogleConfigured()) return c.text('Not configured', 500);

    await cleanupExpiredOAuthStates();

    const code = c.req.query('code');
    const state = c.req.query('state');

    if (!code || !state) {
      return c.text('Invalid OAuth state', 400);
    }

    const oauthState = await consumeOAuthState(state, 'google');
    if (!oauthState?.codeVerifier) {
      return c.text('Invalid OAuth state', 400);
    }

    const accessToken = await exchangeGoogleAuthorizationCode(code, oauthState.codeVerifier);
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const googleUser = (await response.json()) as { sub: string; email: string; name?: string };
    const email = googleUser.email.toLowerCase();
    const user = await findOrCreateOAuthUser(
      'google',
      googleUser.sub,
      email,
      googleUser.name || email,
    );
    const appTokens = await createTokens(user);

    return c.redirect(buildFrontendCallbackUrl(appTokens));
  })
  .get('/oauth/callback/discord', async (c) => {
    if (!isDiscordConfigured()) return c.text('Not configured', 500);

    await cleanupExpiredOAuthStates();

    const code = c.req.query('code');
    const state = c.req.query('state');

    if (!code || !state) {
      return c.text('Invalid OAuth state', 400);
    }

    const oauthState = await consumeOAuthState(state, 'discord');
    if (!oauthState) {
      return c.text('Invalid OAuth state', 400);
    }

    const accessToken = await exchangeDiscordAuthorizationCode(code);
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const discordUser = (await response.json()) as {
      id: string;
      email?: string;
      username: string;
      global_name?: string;
    };
    const email = (discordUser.email || `${discordUser.id}@discord.noemail`).toLowerCase();
    const user = await findOrCreateOAuthUser(
      'discord',
      discordUser.id,
      email,
      discordUser.global_name || discordUser.username,
    );
    const appTokens = await createTokens(user);

    return c.redirect(buildFrontendCallbackUrl(appTokens));
  })
  .get('/oauth/callback/github', async (c) => {
    if (!isGitHubConfigured()) return c.text('Not configured', 500);

    await cleanupExpiredOAuthStates();

    const code = c.req.query('code');
    const state = c.req.query('state');

    if (!code || !state) {
      return c.text('Invalid OAuth state', 400);
    }

    const oauthState = await consumeOAuthState(state, 'github');
    if (!oauthState) {
      return c.text('Invalid OAuth state', 400);
    }

    const accessToken = await exchangeGitHubAuthorizationCode(code);

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'duel-log-app',
      },
    });
    const githubUser = (await userResponse.json()) as {
      id: number;
      login: string;
      name?: string;
    };

    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'duel-log-app',
      },
    });
    const emails = (await emailResponse.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;
    const primaryEmail =
      emails.find((entry) => entry.primary && entry.verified)?.email ??
      emails.find((entry) => entry.verified)?.email ??
      `${githubUser.id}@github.noemail`;

    const user = await findOrCreateOAuthUser(
      'github',
      String(githubUser.id),
      primaryEmail.toLowerCase(),
      githubUser.name || githubUser.login,
    );
    const appTokens = await createTokens(user);

    return c.redirect(buildFrontendCallbackUrl(appTokens));
  });
