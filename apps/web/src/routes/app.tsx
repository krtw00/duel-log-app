import { createRoute, redirect } from '@tanstack/react-router';
import { AdminView } from '../components/admin/AdminView.js';
import { DashboardView } from '../components/dashboard/DashboardView.js';
import { DecksView } from '../components/decks/DecksView.js';
import { FeedbackView } from '../components/feedback/FeedbackView.js';
import { AppLayout } from '../components/layout/AppLayout.js';
import { ProfileView } from '../components/profile/ProfileView.js';
import { StatisticsView } from '../components/statistics/StatisticsView.js';
import { OBSOverlayView } from '../components/streamer/OBSOverlayView.js';
import { StreamerPopupView } from '../components/streamer/StreamerPopupView.js';
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
  component: DashboardView,
});

export const decksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/decks',
  component: DecksView,
});

export const statisticsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/statistics',
  component: StatisticsView,
});

export const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: ProfileView,
});

export const adminRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin',
  component: AdminView,
});

export const feedbackRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/feedback',
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || undefined,
  }),
  component: FeedbackView,
});

export const streamerPopupRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/streamer-popup',
  component: StreamerPopupView,
});

export const obsOverlayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/obs-overlay',
  component: OBSOverlayView,
});
