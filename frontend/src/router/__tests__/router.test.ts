import { describe, it, expect } from 'vitest';
import { routes } from '../index';
import SharedStatisticsView from '../../views/SharedStatisticsView.vue';

describe('Router', () => {
  it('should have a route for shared statistics that does not require authentication', () => {
    const sharedStatsRoute = routes.find((route) => route.name === 'SharedStatistics');

    expect(sharedStatsRoute).toBeDefined();
    expect(sharedStatsRoute?.path).toBe('/shared-stats/:share_id');
    expect(sharedStatsRoute?.component).toBe(SharedStatisticsView);
    expect(sharedStatsRoute?.meta?.requiresAuth).toBe(false);
  });
});
