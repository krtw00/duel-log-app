import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useThemeStore } from '../theme';
import { useAuthStore } from '../auth';
import { api } from '@/services/api';

vi.mock('@/services/api', () => ({
  __esModule: true,
  api: {
    put: vi.fn(),
  },
}));

const createUser = () => ({
  id: 1,
  email: 'test@example.com',
  username: 'tester',
  streamer_mode: false,
  theme_preference: 'dark',
});

describe('theme store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('loads guest theme from local storage when unauthenticated', () => {
    localStorage.setItem('theme', 'light');
    const themeStore = useThemeStore();

    themeStore.loadTheme();

    expect(themeStore.isDark).toBe(false);
    expect(themeStore.themeName).toBe('customLightTheme');
  });

  it('prefers authenticated user theme preference', () => {
    const themeStore = useThemeStore();
    const authStore = useAuthStore();
    authStore.user = { ...createUser(), theme_preference: 'light' };

    themeStore.loadTheme();

    expect(themeStore.isDark).toBe(false);
    expect(themeStore.themeName).toBe('customLightTheme');
  });

  it('persists toggle via API for authenticated users', async () => {
    const themeStore = useThemeStore();
    const authStore = useAuthStore();
    authStore.user = createUser();

    const putMock = api.put as unknown as ReturnType<typeof vi.fn>;
    putMock.mockResolvedValue(undefined);
    const fetchUserSpy = vi.spyOn(authStore, 'fetchUser').mockResolvedValue(undefined);

    await themeStore.toggleTheme();

    expect(putMock).toHaveBeenCalledWith('/me', { theme_preference: 'light' });
    expect(fetchUserSpy).toHaveBeenCalled();
    expect(themeStore.isDark).toBe(false);
  });

  it('persists toggle locally for guests', async () => {
    const themeStore = useThemeStore();

    await themeStore.toggleTheme();

    expect(localStorage.getItem('theme')).toBe('light');
    expect(themeStore.isDark).toBe(false);
  });
});
