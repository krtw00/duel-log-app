import { describe, it, expect } from 'vitest';
import { routes } from '../index';

describe('Router', () => {
  it('should have a route for shared statistics that does not require authentication', () => {
    const sharedStatsRoute = routes.find((route) => route.name === 'SharedStatistics');

    expect(sharedStatsRoute).toBeDefined();
    expect(sharedStatsRoute?.path).toBe('/shared-stats/:share_id');
    // component is lazy-loaded, so we just check it exists and is a function
    expect(sharedStatsRoute?.component).toBeDefined();
    expect(typeof sharedStatsRoute?.component).toBe('function');
    expect(sharedStatsRoute?.meta?.requiresAuth).toBe(false);
  });
});
