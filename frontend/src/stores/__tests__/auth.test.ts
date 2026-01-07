import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';
import { api } from '@/services/api';

vi.mock('@/services/api');
vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
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
    localStorage.setItem('access_token', 'stale');

    const authStore = useAuthStore();
    await authStore.fetchUser();

    expect(authStore.user).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
    expect(authStore.isInitialized).toBe(true);
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('toggles streamer mode', () => {
    const authStore = useAuthStore();

    expect(authStore.localStreamerMode).toBe(false);

    authStore.toggleStreamerMode(true);
    expect(authStore.localStreamerMode).toBe(true);

    authStore.toggleStreamerMode(false);
    expect(authStore.localStreamerMode).toBe(false);
  });

  it('sets user and navigates on successful login', async () => {
    vi.useFakeTimers();

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      streamer_mode: false,
      theme_preference: 'dark',
    };
    vi.mocked(api.post).mockResolvedValue({
      data: { user: mockUser, access_token: 'token123' },
    } as any);

    const authStore = useAuthStore();
    const loginPromise = authStore.login('test@example.com', 'password123');

    await vi.runAllTimersAsync();
    await loginPromise;

    expect(authStore.user).toEqual(mockUser);
    expect(authStore.isAuthenticated).toBe(true);
    expect(localStorage.getItem('access_token')).toBe('token123');

    const router = await import('@/router');
    expect(vi.mocked(router.default.push)).toHaveBeenCalledWith('/');

    vi.useRealTimers();
  });

  it('does not navigate when login response is invalid', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} } as any);
    localStorage.setItem('access_token', 'stale');

    const authStore = useAuthStore();
    await expect(authStore.login('test@example.com', 'password123')).rejects.toThrow();

    expect(authStore.user).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();

    const router = await import('@/router');
    expect(vi.mocked(router.default.push)).not.toHaveBeenCalled();
  });
});
