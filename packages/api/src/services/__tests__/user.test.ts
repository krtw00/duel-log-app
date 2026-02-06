import { describe, expect, it, vi } from 'vitest';

let mockQueryResult: unknown[] = [];

vi.mock('../../db/index.js', () => ({
  sql: Object.assign(() => Promise.resolve(mockQueryResult), {
    call: (_: unknown, obj: Record<string, unknown>) => obj,
  }),
}));

const loadUserService = async () => {
  vi.resetModules();
  return import('../user.js');
};

describe('user service', () => {
  describe('getUser', () => {
    it('returns user when found', async () => {
      mockQueryResult = [
        {
          id: 'user-1',
          email: 'test@example.com',
          displayName: 'Test User',
          isAdmin: false,
          isDebugger: false,
          themePreference: 'system',
          streamerMode: false,
        },
      ];
      const { getUser } = await loadUserService();

      const result = await getUser('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        isAdmin: false,
        isDebugger: false,
        themePreference: 'system',
        streamerMode: false,
      });
    });

    it('returns undefined when user not found', async () => {
      mockQueryResult = [];
      const { getUser } = await loadUserService();

      const result = await getUser('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('updates user display name', async () => {
      mockQueryResult = [
        {
          id: 'user-1',
          email: 'test@example.com',
          displayName: 'Updated Name',
        },
      ];
      const { updateUser } = await loadUserService();

      const result = await updateUser('user-1', { displayName: 'Updated Name' });

      expect(result?.displayName).toBe('Updated Name');
    });

    it('updates user theme preference', async () => {
      mockQueryResult = [
        {
          id: 'user-1',
          themePreference: 'dark',
        },
      ];
      const { updateUser } = await loadUserService();

      const result = await updateUser('user-1', { themePreference: 'dark' });

      expect(result?.themePreference).toBe('dark');
    });

    it('updates streamer mode', async () => {
      mockQueryResult = [
        {
          id: 'user-1',
          streamerMode: true,
        },
      ];
      const { updateUser } = await loadUserService();

      const result = await updateUser('user-1', { streamerMode: true });

      expect(result?.streamerMode).toBe(true);
    });

    it('returns undefined when user not found', async () => {
      mockQueryResult = [];
      const { updateUser } = await loadUserService();

      const result = await updateUser('nonexistent', { displayName: 'New Name' });

      expect(result).toBeUndefined();
    });
  });

  describe('deleteUser', () => {
    it('deletes user without returning value', async () => {
      mockQueryResult = [];
      const { deleteUser } = await loadUserService();

      // Should not throw
      await expect(deleteUser('user-1')).resolves.toBeUndefined();
    });
  });
});
