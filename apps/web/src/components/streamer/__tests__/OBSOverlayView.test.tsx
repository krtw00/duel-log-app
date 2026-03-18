import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../../lib/api.js', () => ({
  api: apiMock,
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
}));

vi.mock('../../../utils/ranks.js', () => ({
  getRankLabel: () => 'Master I',
}));

describe('OBSOverlayView', () => {
  beforeEach(() => {
    apiMock.mockReset();
    window.history.pushState({}, '', '/obs-overlay?token=test-token&game_mode=RANK&stats_period=monthly');
  });

  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('fetches OBS stats via the shared api client', async () => {
    apiMock.mockResolvedValue({
      data: {
        totalDuels: 10,
        wins: 6,
        losses: 4,
        winRate: 0.6,
        firstRate: 0.5,
        firstWinRate: 0.7,
        secondWinRate: 0.5,
        coinTossWinRate: 0.4,
        currentStreak: 2,
        currentStreakType: 'win',
        currentDeck: 'Blue-Eyes',
        recentResults: [],
        sessionWins: 6,
        gameMode: 'RANK',
        rank: 1,
      },
    });

    const { OBSOverlayView } = await import('../OBSOverlayView.js');
    const view = render(<OBSOverlayView />);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        '/obs/stats',
        expect.objectContaining({
          params: expect.objectContaining({
            token: 'test-token',
            game_mode: 'RANK',
            stats_period: 'monthly',
            recent_count: '10',
          }),
        }),
      );
    });

    view.unmount();
  });
});
