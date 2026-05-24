import { create } from 'zustand';
import { signOut as authSignOut, fetchCurrentUser } from '../lib/auth.js';

type AuthUser = {
  id: string;
  email: string;
  displayName?: string;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  initialize: async () => {
    const user = await fetchCurrentUser();
    set({ user, loading: false });
  },

  signOut: async () => {
    await authSignOut();
    set({ user: null, loading: false });
  },

  setUser: (user) => set({ user }),
}));
