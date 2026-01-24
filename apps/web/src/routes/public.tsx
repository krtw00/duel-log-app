import { createRoute } from '@tanstack/react-router';
import { SharedStatisticsView } from '../components/sharing/SharedStatisticsView.js';
import { rootRoute } from './__root.js';

export const sharedStatsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shared/$token',
  component: SharedStatisticsView,
});
