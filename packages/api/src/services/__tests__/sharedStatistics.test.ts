import { describe, expect, it, vi } from 'vitest';

let mockQueryResult: unknown[] = [];

vi.mock('../../db/index.js', () => ({
  sql: Object.assign(() => Promise.resolve(mockQueryResult), {
    json: (obj: unknown) => JSON.stringify(obj),
    call: (_: unknown, obj: Record<string, unknown>) => obj,
  }),
}));

const loadSharedStatsService = async () => {
  vi.resetModules();
  return import('../sharedStatistics.js');
};

describe('sharedStatistics service', () => {
  describe('createSharedStats', () => {
    it('creates shared statistics with token', async () => {
      mockQueryResult = [
        {
          id: 'stats-1',
          userId: 'user-1',
          token: 'generated-token',
          filters: { gameMode: 'RANK' },
          expiresAt: null,
        },
      ];
      const { createSharedStats } = await loadSharedStatsService();

      const result = await createSharedStats('user-1', {
        filters: { gameMode: 'RANK' },
      });

      expect(result).toHaveProperty('token');
      expect(result?.userId).toBe('user-1');
    });

    it('creates shared statistics with expiration', async () => {
      const expiresAt = new Date('2025-12-31T23:59:59Z');
      mockQueryResult = [
        {
          id: 'stats-1',
          userId: 'user-1',
          token: 'generated-token',
          filters: {},
          expiresAt,
        },
      ];
      const { createSharedStats } = await loadSharedStatsService();

      const result = await createSharedStats('user-1', {
        filters: {},
        expiresAt: expiresAt.toISOString(),
      });

      expect(result?.expiresAt).toEqual(expiresAt);
    });
  });

  describe('getSharedStats', () => {
    it('returns shared stats when found and not expired', async () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      mockQueryResult = [
        {
          id: 'stats-1',
          userId: 'user-1',
          token: 'valid-token',
          filters: { gameMode: 'RANK' },
          expiresAt: futureDate,
        },
      ];
      const { getSharedStats } = await loadSharedStatsService();

      const result = await getSharedStats('valid-token');

      expect(result).not.toBeNull();
      expect(result?.token).toBe('valid-token');
    });

    it('returns null when token not found', async () => {
      mockQueryResult = [];
      const { getSharedStats } = await loadSharedStatsService();

      const result = await getSharedStats('nonexistent-token');

      expect(result).toBeNull();
    });

    it('returns null when expired', async () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      mockQueryResult = [
        {
          id: 'stats-1',
          userId: 'user-1',
          token: 'expired-token',
          filters: {},
          expiresAt: pastDate,
        },
      ];
      const { getSharedStats } = await loadSharedStatsService();

      const result = await getSharedStats('expired-token');

      expect(result).toBeNull();
    });

    it('returns stats when no expiration set', async () => {
      mockQueryResult = [
        {
          id: 'stats-1',
          userId: 'user-1',
          token: 'no-expiry-token',
          filters: {},
          expiresAt: null,
        },
      ];
      const { getSharedStats } = await loadSharedStatsService();

      const result = await getSharedStats('no-expiry-token');

      expect(result).not.toBeNull();
    });
  });

  describe('deleteSharedStats', () => {
    it('deletes and returns deleted record', async () => {
      mockQueryResult = [{ id: 'stats-1', token: 'token-to-delete' }];
      const { deleteSharedStats } = await loadSharedStatsService();

      const result = await deleteSharedStats('user-1', 'token-to-delete');

      expect(result?.token).toBe('token-to-delete');
    });

    it('returns undefined when not found or unauthorized', async () => {
      mockQueryResult = [];
      const { deleteSharedStats } = await loadSharedStatsService();

      const result = await deleteSharedStats('user-1', 'nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('cleanupExpiredSharedStats', () => {
    it('returns count of deleted expired stats', async () => {
      mockQueryResult = [{ id: 'stats-1' }, { id: 'stats-2' }, { id: 'stats-3' }];
      const { cleanupExpiredSharedStats } = await loadSharedStatsService();

      const result = await cleanupExpiredSharedStats();

      expect(result).toBe(3);
    });

    it('returns 0 when no expired stats', async () => {
      mockQueryResult = [];
      const { cleanupExpiredSharedStats } = await loadSharedStatsService();

      const result = await cleanupExpiredSharedStats();

      expect(result).toBe(0);
    });
  });

  describe('cleanupOrphanedSharedStats', () => {
    it('returns count of deleted orphaned stats', async () => {
      mockQueryResult = [{ id: 'stats-1' }, { id: 'stats-2' }];
      const { cleanupOrphanedSharedStats } = await loadSharedStatsService();

      const result = await cleanupOrphanedSharedStats();

      expect(result).toBe(2);
    });

    it('returns 0 when no orphaned stats', async () => {
      mockQueryResult = [];
      const { cleanupOrphanedSharedStats } = await loadSharedStatsService();

      const result = await cleanupOrphanedSharedStats();

      expect(result).toBe(0);
    });
  });
});
