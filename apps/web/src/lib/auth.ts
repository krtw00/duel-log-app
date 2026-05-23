const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

type LoginResponse = {
  data: { user: AuthUser };
};

export function getCsrfToken(): string | null {
  const pairs = document.cookie.split(';');
  for (const pair of pairs) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) continue;
    const key = pair.slice(0, eqIndex).trim();
    const value = pair.slice(eqIndex + 1);
    if (key === 'dlog_csrf') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json();
  if (!response.ok) throw body;
  return (body as LoginResponse).data.user;
}

export async function register(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, displayName }),
  });
  const body = await response.json();
  if (!response.ok) throw body;
  return (body as LoginResponse).data.user;
}

export async function signOut(): Promise<void> {
  const csrf = getCsrfToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (csrf) headers['X-CSRF-Token'] = csrf;

  await fetch(`${API_BASE_URL}/auth/signout`, {
    method: 'POST',
    headers,
    credentials: 'include',
  }).catch(() => {});
}

export async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      credentials: 'include',
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { data: AuthUser };
    return body.data;
  } catch {
    return null;
  }
}

export function getOAuthUrl(provider: 'google' | 'discord' | 'github'): string {
  return `${API_BASE_URL}/auth/oauth/${provider}`;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/password/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  const body = await response.json();
  if (!response.ok) throw body;
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token, password }),
  });
  const body = await response.json();
  if (!response.ok) throw body;
}
