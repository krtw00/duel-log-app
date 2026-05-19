const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

type AuthResponse = {
  data: AuthTokens & { user: AuthUser };
};

type JwtPayload = {
  sub: string;
  email: string;
  exp: number;
};

function normalizeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  if (padding === 0) return normalized;
  return normalized.padEnd(normalized.length + (4 - padding), '=');
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    return JSON.parse(atob(normalizeBase64Url(payload))) as JwtPayload;
  } catch {
    return null;
  }
}

function getTokens(): AuthTokens | null {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

function setTokens(tokens: AuthTokens): void {
  localStorage.setItem('access_token', tokens.accessToken);
  localStorage.setItem('refresh_token', tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now();
}

export function getUserFromAccessToken(token: string): Pick<AuthUser, 'id' | 'email'> | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.sub || !payload.email) return null;
  return {
    id: payload.sub,
    email: payload.email,
  };
}

let refreshPromise: Promise<string | null> | null = null;

export async function getAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens) return null;

  if (!isTokenExpired(tokens.accessToken)) {
    return tokens.accessToken;
  }

  // Deduplicate concurrent refresh calls
  if (refreshPromise) return refreshPromise;

  refreshPromise = refreshAccessToken(tokens.refreshToken);
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const body = (await response.json()) as AuthResponse;
    setTokens({
      accessToken: body.data.accessToken,
      refreshToken: body.data.refreshToken,
    });
    return body.data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json();
  if (!response.ok) throw body;
  setTokens({ accessToken: body.data.accessToken, refreshToken: body.data.refreshToken });
  return body;
}

export async function register(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });
  const body = await response.json();
  if (!response.ok) throw body;
  setTokens({ accessToken: body.data.accessToken, refreshToken: body.data.refreshToken });
  return body;
}

export function getOAuthUrl(provider: 'google' | 'discord' | 'github'): string {
  return `${API_BASE_URL}/auth/oauth/${provider}`;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/password/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const body = await response.json();
  if (!response.ok) throw body;
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  const body = await response.json();
  if (!response.ok) throw body;
}

export async function signOut(): Promise<void> {
  const tokens = getTokens();

  if (tokens?.refreshToken) {
    await fetch(`${API_BASE_URL}/auth/signout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    }).catch(() => {});
  }

  clearTokens();
}

export function handleOAuthCallback(): AuthTokens | null {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    return null;
  }

  const tokens = { accessToken, refreshToken };
  setTokens(tokens);
  window.history.replaceState({}, '', window.location.pathname);
  return tokens;
}
