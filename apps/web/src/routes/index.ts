import { createRouter } from '@tanstack/react-router';
import { rootRoute } from './__root.js';
import {
  adminRoute,
  appLayoutRoute,
  dashboardRoute,
  decksRoute,
  feedbackRoute,
  obsOverlayRoute,
  profileRoute,
  statisticsRoute,
  streamerPopupRoute,
  streamerRoute,
} from './app.js';
import {
  authLayoutRoute,
  callbackRoute,
  forgotPasswordRoute,
  loginRoute,
  registerRoute,
  resetPasswordRoute,
} from './auth.js';
import { sharedStatsRoute } from './public.js';

const routeTree = rootRoute.addChildren([
  authLayoutRoute.addChildren([
    loginRoute,
    registerRoute,
    callbackRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
  ]),
  appLayoutRoute.addChildren([
    dashboardRoute,
    decksRoute,
    statisticsRoute,
    profileRoute,
    streamerRoute,
    adminRoute,
    feedbackRoute,
    streamerPopupRoute,
  ]),
  obsOverlayRoute,
  sharedStatsRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
