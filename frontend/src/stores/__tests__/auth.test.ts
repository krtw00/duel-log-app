import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';
import { api } from '@/services/api';

vi.mock('@/services/api');

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with null user and isAuthenticated false', () => {
    const authStore = useAuthStore();

    expect(authStore.user).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
    expect(authStore.isInitialized).toBe(false);
  });

  it('sets user on successful fetchUser', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      streamer_mode: false,
    };
    vi.mocked(api.get).mockResolvedValue({ data: mockUser });

    const authStore = useAuthStore();
    await authStore.fetchUser();

    expect(authStore.user).toEqual(mockUser);
    expect(authStore.isAuthenticated).toBe(true);
    expect(authStore.isInitialized).toBe(true);
  });

  it('clears user on failed fetchUser', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Unauthorized'));

    const authStore = useAuthStore();
    await authStore.fetchUser();

    expect(authStore.user).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
    expect(authStore.isInitialized).toBe(true);
  });

  it('toggles streamer mode', () => {
    const authStore = useAuthStore();

    expect(authStore.localStreamerMode).toBe(false);

    authStore.toggleStreamerMode(true);
    expect(authStore.localStreamerMode).toBe(true);

    authStore.toggleStreamerMode(false);
    expect(authStore.localStreamerMode).toBe(false);
  });
});
