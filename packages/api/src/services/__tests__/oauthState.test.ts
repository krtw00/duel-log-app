import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnsureOAuthStateTable = vi.fn(() => Promise.resolve());
const mockSql = vi.fn<(...args: unknown[]) => Promise<unknown[]>>(() => Promise.resolve([]));

vi.mock('../../db/index.js', () => ({
  ensureOAuthStateTable: mockEnsureOAuthStateTable,
  sql: Object.assign(mockSql, {
    call: (_: unknown, obj: Record<string, unknown>) => obj,
  }),
}));

const loadOAuthStateService = async () => {
  vi.resetModules();
  return import('../oauthState.js');
};

describe('oauthState service', () => {
  beforeEach(() => {
    mockEnsureOAuthStateTable.mockClear();
    mockSql.mockReset();
  });

  it('creates an OAuth state row with an optional code verifier', async () => {
    const createdAt = new Date('2026-03-30T00:00:00Z');
    const expiresAt = new Date('2026-03-30T00:10:00Z');
    mockSql.mockResolvedValueOnce([
      {
        id: 'state-row-1',
        state: 'oauth-state',
        codeVerifier: 'pkce-verifier',
        provider: 'google',
        createdAt,
        expiresAt,
      },
    ]);

    const { createOAuthState } = await loadOAuthStateService();
    const result = await createOAuthState({
      state: 'oauth-state',
      provider: 'google',
      codeVerifier: 'pkce-verifier',
    });

    expect(mockEnsureOAuthStateTable).toHaveBeenCalledTimes(1);
    expect(mockSql).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      state: 'oauth-state',
      codeVerifier: 'pkce-verifier',
      provider: 'google',
    });
  });

  it('consumes only matching non-expired OAuth state rows', async () => {
    mockSql.mockResolvedValueOnce([
      {
        id: 'state-row-2',
        state: 'oauth-state',
        codeVerifier: null,
        provider: 'discord',
        createdAt: new Date('2026-03-30T00:00:00Z'),
        expiresAt: new Date('2026-03-30T00:10:00Z'),
      },
    ]);

    const { consumeOAuthState } = await loadOAuthStateService();
    const result = await consumeOAuthState('oauth-state', 'discord');

    expect(mockEnsureOAuthStateTable).toHaveBeenCalledTimes(1);
    expect(mockSql).toHaveBeenCalledTimes(1);
    expect(result?.provider).toBe('discord');
  });

  it('returns the number of expired rows deleted during cleanup', async () => {
    mockSql.mockResolvedValueOnce([{ id: '1' }, { id: '2' }]);

    const { cleanupExpiredOAuthStates } = await loadOAuthStateService();
    const result = await cleanupExpiredOAuthStates();

    expect(mockEnsureOAuthStateTable).toHaveBeenCalledTimes(1);
    expect(mockSql).toHaveBeenCalledTimes(1);
    expect(result).toBe(2);
  });
});
