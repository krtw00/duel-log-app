import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OBSOverlayView } from '../OBSOverlayView.js';

const apiMock = vi.fn();

vi.mock('../../../lib/api.js', () => ({
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('OBSOverlayView', () => {
  beforeEach(() => {
    apiMock.mockResolvedValue({
      data: {
        totalDuels: 10,
        wins: 6,
        losses: 4,
        winRate: 0.6,
        firstRate: 0.5,
        firstWinRate: 0.7,
        secondWinRate: 0.5,
        coinTossWinRate: 0.5,
        currentStreak: 2,
        currentStreakType: 'win',
        recentResults: [],
        sessionWins: 0,
        gameMode: 'RANK',
      },
    });
    window.history.replaceState(
      {},
      '',
      '/streamer/overlay?token=test-token&game_mode=RANK&stats_period=monthly&recent_count=10',
    );
  });

  afterEach(() => {
    cleanup();
    apiMock.mockReset();
  });

  it('fetches OBS stats through the shared API client', async () => {
    render(<OBSOverlayView />);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith('/obs/stats', {
        params: {
          token: 'test-token',
          game_mode: 'RANK',
          stats_period: 'monthly',
          recent_count: '10',
        },
      });
    });

    expect(screen.getByText('60.0%')).toBeInTheDocument();
  });
});
