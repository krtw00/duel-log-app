import { Outlet, createRoute, redirect } from '@tanstack/react-router';
import { AuthCallbackPage } from '../components/auth/AuthCallbackPage.js';
import { ForgotPasswordPage } from '../components/auth/ForgotPasswordPage.js';
import { LoginPage } from '../components/auth/LoginPage.js';
import { RegisterPage } from '../components/auth/RegisterPage.js';
import { ResetPasswordPage } from '../components/auth/ResetPasswordPage.js';
import { supabase } from '../lib/supabase.js';
import { rootRoute } from './__root.js';

/** 認証レイアウト: 認証済みならダッシュボードへリダイレクト */
export const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth-layout',
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
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

export const forgotPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
});

export const resetPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/reset-password',
  component: ResetPasswordPage,
});
