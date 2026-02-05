import { describe, expect, it, vi } from 'vitest';

let mockQueryResult: unknown[] = [];

vi.mock('../../db/index.js', () => ({
  sql: Object.assign(() => Promise.resolve(mockQueryResult), {
    call: (_: unknown, obj: Record<string, unknown>) => obj,
  }),
}));

const loadAdminService = async () => {
  vi.resetModules();
  return import('../admin.js');
};

describe('admin service', () => {
  describe('listUsers', () => {
    it('returns all users', async () => {
      mockQueryResult = [
        { id: 'user-1', email: 'user1@example.com', displayName: 'User 1' },
        { id: 'user-2', email: 'user2@example.com', displayName: 'User 2' },
      ];
      const { listUsers } = await loadAdminService();

      const result = await listUsers();

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('user1@example.com');
    });

    it('returns empty array when no users', async () => {
      mockQueryResult = [];
      const { listUsers } = await loadAdminService();

      const result = await listUsers();

      expect(result).toEqual([]);
    });
  });

  describe('updateUserStatus', () => {
    it('updates user status to banned', async () => {
      mockQueryResult = [
        { id: 'user-1', status: 'banned', statusReason: 'Violation of TOS' },
      ];
      const { updateUserStatus } = await loadAdminService();

      const result = await updateUserStatus('user-1', {
        status: 'banned',
        statusReason: 'Violation of TOS',
      });

      expect(result?.status).toBe('banned');
      expect(result?.statusReason).toBe('Violation of TOS');
    });

    it('updates user status to active without reason', async () => {
      mockQueryResult = [
        { id: 'user-1', status: 'active', statusReason: null },
      ];
      const { updateUserStatus } = await loadAdminService();

      const result = await updateUserStatus('user-1', { status: 'active' });

      expect(result?.status).toBe('active');
      expect(result?.statusReason).toBeNull();
    });

    it('returns undefined when user not found', async () => {
      mockQueryResult = [];
      const { updateUserStatus } = await loadAdminService();

      const result = await updateUserStatus('nonexistent', { status: 'banned' });

      expect(result).toBeUndefined();
    });
  });

  describe('getAdminStatistics', () => {
    it('returns admin statistics', async () => {
      // This function makes multiple queries, but our simple mock returns same result each time
      mockQueryResult = [{ count: 100 }];
      const { getAdminStatistics } = await loadAdminService();

      const result = await getAdminStatistics();

      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('totalDuels');
      expect(result).toHaveProperty('todayDuels');
    });

    it('returns zero counts when no data', async () => {
      mockQueryResult = [{ count: 0 }];
      const { getAdminStatistics } = await loadAdminService();

      const result = await getAdminStatistics();

      expect(result.totalUsers).toBe(0);
      expect(result.totalDuels).toBe(0);
      expect(result.todayDuels).toBe(0);
    });
  });
});
