import { createRoute, redirect } from '@tanstack/react-router';
import { AppLayout } from '../components/layout/AppLayout.js';
import { supabase } from '../lib/supabase.js';
import { rootRoute } from './__root.js';

/** アプリレイアウト: 未認証ならログインへリダイレクト */
export const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app-layout',
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
  },
  component: AppLayout,
});

export const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: () => <div>Dashboard (実装中)</div>,
});

export const decksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/decks',
  component: () => <div>Decks (実装中)</div>,
});

export const statisticsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/statistics',
  component: () => <div>Statistics (実装中)</div>,
});

export const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: () => <div>Profile (実装中)</div>,
});

export const adminRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin',
  component: () => <div>Admin (実装中)</div>,
});
