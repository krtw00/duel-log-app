import { Outlet, createRoute, redirect } from '@tanstack/react-router';
import { AuthCallbackPage } from '../components/auth/AuthCallbackPage.js';
import { LoginPage } from '../components/auth/LoginPage.js';
import { RegisterPage } from '../components/auth/RegisterPage.js';
import { getAccessToken } from '../lib/auth.js';
import { rootRoute } from './__root.js';

/** 認証レイアウト: 認証済みならダッシュボードへリダイレクト */
export const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth-layout',
  beforeLoad: async () => {
    const token = await getAccessToken();
    if (token) {
      throw redirect({ to: '/' });
    }
  },
  component: () => (
    <div className="min-h-screen bg-brand-dark-1">
      <Outlet />
    </div>
  ),
});

export const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  component: LoginPage,
});

export const registerRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/register',
  component: RegisterPage,
});

export const callbackRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/auth/callback',
  component: AuthCallbackPage,
});
