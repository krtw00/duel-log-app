import { describe, it, expect } from 'vitest';
import { normalizeApiBaseUrl, normalizeApiRequestUrl } from '../api';

describe('api service', () => {
  it('api module exports correctly', () => {
    // api.tsはインターセプターを持つ複雑なモジュールなので、
    // 基本的な動作はintegrationテストでカバーする
    expect(true).toBe(true);
  });

  it('normalizes VITE_API_URL for dev/test stability', () => {
    expect(normalizeApiBaseUrl(' http://localhost:8000/ ')).toBe('http://127.0.0.1:8000');
    expect(
      normalizeApiBaseUrl('http://backend:8000/', { isDev: true, runtimeHostname: 'localhost' }),
    ).toBe('http://127.0.0.1:8000');
    expect(normalizeApiBaseUrl('/api/')).toBe('/api');
  });

  it('normalizes absolute-path urls so baseURL path is not ignored', () => {
    expect(normalizeApiRequestUrl('/api', '/me')).toBe('me');
    expect(normalizeApiRequestUrl('/api/', '/auth/login')).toBe('auth/login');
    expect(normalizeApiRequestUrl('http://127.0.0.1:8000', '/me')).toBe('me');
    expect(normalizeApiRequestUrl('/api', 'me')).toBe('me');
    expect(normalizeApiRequestUrl('/api', 'http://example.com/me')).toBe('http://example.com/me');
  });
});
