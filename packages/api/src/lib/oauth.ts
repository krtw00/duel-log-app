import { createHash, randomBytes } from 'node:crypto';

type OAuthTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET ?? '';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? '';
const AUTH_CALLBACK_URL = process.env.AUTH_CALLBACK_URL?.replace(/\/$/, '') ?? '';

function encodeBase64Url(value: Buffer): string {
  return value.toString('base64url');
}

function buildUrl(base: string, params: Record<string, string>): URL {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

async function exchangeToken(
  url: string,
  body: Record<string, string>,
  headers: Record<string, string> = {},
): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers,
    },
    body: new URLSearchParams(body),
  });

  const payload = (await response.json()) as OAuthTokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || 'OAuth token exchange failed');
  }

  return payload.access_token;
}

export function generateState(): string {
  return encodeBase64Url(randomBytes(24));
}

export function generateCodeVerifier(): string {
  return encodeBase64Url(randomBytes(32));
}

function generateCodeChallenge(codeVerifier: string): string {
  return createHash('sha256').update(codeVerifier).digest('base64url');
}

export function isGoogleConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && AUTH_CALLBACK_URL);
}

export function isDiscordConfigured(): boolean {
  return Boolean(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET && AUTH_CALLBACK_URL);
}

export function isGitHubConfigured(): boolean {
  return Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET && AUTH_CALLBACK_URL);
}

export function createGoogleAuthorizationUrl(state: string, codeVerifier: string): URL {
  return buildUrl('https://accounts.google.com/o/oauth2/v2/auth', {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${AUTH_CALLBACK_URL}/google`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: generateCodeChallenge(codeVerifier),
    code_challenge_method: 'S256',
  });
}

export async function exchangeGoogleAuthorizationCode(
  code: string,
  codeVerifier: string,
): Promise<string> {
  return exchangeToken('https://oauth2.googleapis.com/token', {
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    code,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: `${AUTH_CALLBACK_URL}/google`,
  });
}

export function createDiscordAuthorizationUrl(state: string): URL {
  return buildUrl('https://discord.com/oauth2/authorize', {
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: `${AUTH_CALLBACK_URL}/discord`,
    response_type: 'code',
    scope: 'identify email',
    state,
  });
}

export async function exchangeDiscordAuthorizationCode(code: string): Promise<string> {
  return exchangeToken('https://discord.com/api/oauth2/token', {
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: `${AUTH_CALLBACK_URL}/discord`,
  });
}

export function createGitHubAuthorizationUrl(state: string): URL {
  return buildUrl('https://github.com/login/oauth/authorize', {
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${AUTH_CALLBACK_URL}/github`,
    scope: 'user:email',
    state,
  });
}

export async function exchangeGitHubAuthorizationCode(code: string): Promise<string> {
  return exchangeToken(
    'https://github.com/login/oauth/access_token',
    {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${AUTH_CALLBACK_URL}/github`,
    },
    {
      'User-Agent': 'duel-log-app',
    },
  );
}
