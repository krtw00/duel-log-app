import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
  clearSupabaseLocalStorage: vi.fn(),
}));

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

  it('sets user on successful fetchUser with session', async () => {
    const mockSession = {
      user: {
        id: 'test-uuid',
        email: 'test@example.com',
        user_metadata: { username: 'testuser' },
      },
    };
    const mockProfile = {
      id: 'test-uuid',
      email: 'test@example.com',
      username: 'testuser',
      streamer_mode: false,
      theme_preference: 'dark',
      is_admin: false,
      enable_screen_analysis: false,
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      }),
    } as any);

    const authStore = useAuthStore();
    await authStore.fetchUser();

    expect(authStore.user).toEqual(mockProfile);
    expect(authStore.isAuthenticated).toBe(true);
    expect(authStore.isInitialized).toBe(true);
  });

  it('clears user when no session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

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
    expect(localStorage.getItem('streamerMode')).toBe('true');

    authStore.toggleStreamerMode(false);
    expect(authStore.localStreamerMode).toBe(false);
    expect(localStorage.getItem('streamerMode')).toBe('false');
  });

  it('sets user and navigates on successful login', async () => {
    const mockUser = {
      id: 'test-uuid',
      email: 'test@example.com',
      user_metadata: { username: 'testuser' },
    };
    const mockSession = { user: mockUser, access_token: 'token123' };
    const mockProfile = {
      id: 'test-uuid',
      email: 'test@example.com',
      username: 'testuser',
      streamer_mode: false,
      theme_preference: 'dark',
      is_admin: false,
      enable_screen_analysis: false,
    };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      }),
    } as any);

    const authStore = useAuthStore();
    await authStore.login('test@example.com', 'password123');

    expect(authStore.user).toEqual(mockProfile);
    expect(authStore.isAuthenticated).toBe(true);

    const router = await import('@/router');
    expect(vi.mocked(router.default.push)).toHaveBeenCalledWith('/');
  });

  it('throws error when login credentials are invalid', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    } as any);

    const authStore = useAuthStore();
    await expect(authStore.login('test@example.com', 'wrongpassword')).rejects.toThrow(
      'メールアドレスまたはパスワードが正しくありません',
    );

    expect(authStore.user).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
  });

  it('isStreamerModeEnabled uses user setting when authenticated', () => {
    const authStore = useAuthStore();

    // ログインしていない場合はローカル設定を使用
    expect(authStore.isStreamerModeEnabled).toBe(false);

    authStore.toggleStreamerMode(true);
    expect(authStore.isStreamerModeEnabled).toBe(true);

    // ユーザーがログインしている場合はユーザー設定を使用
    (authStore as any).user = {
      id: 'test-uuid',
      streamer_mode: false,
    };
    expect(authStore.isStreamerModeEnabled).toBe(false);

    (authStore as any).user.streamer_mode = true;
    expect(authStore.isStreamerModeEnabled).toBe(true);
  });
});
