import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StreakBadge } from '../StreakBadge.js';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'streak.winStreak') return `${opts?.count} Win Streak`;
      if (key === 'streak.lossStreak') return `${opts?.count} Loss Streak`;
      return key;
    },
  }),
}));

describe('StreakBadge', () => {
  it('renders nothing when streaks is undefined', () => {
    const { container } = render(<StreakBadge streaks={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when currentStreak is 0', () => {
    const { container } = render(
      <StreakBadge
        streaks={{
          currentStreak: 0,
          currentStreakType: null,
          longestWinStreak: 5,
          longestLossStreak: 3,
        }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders win streak badge', () => {
    render(
      <StreakBadge
        streaks={{
          currentStreak: 5,
          currentStreakType: 'win',
          longestWinStreak: 10,
          longestLossStreak: 3,
        }}
      />,
    );
    expect(screen.getByText('5 Win Streak')).toBeInTheDocument();
  });

  it('renders loss streak badge', () => {
    render(
      <StreakBadge
        streaks={{
          currentStreak: 3,
          currentStreakType: 'loss',
          longestWinStreak: 10,
          longestLossStreak: 5,
        }}
      />,
    );
    expect(screen.getByText('3 Loss Streak')).toBeInTheDocument();
  });

  it('applies chip-success class for win streak', () => {
    render(
      <StreakBadge
        streaks={{
          currentStreak: 5,
          currentStreakType: 'win',
          longestWinStreak: 10,
          longestLossStreak: 3,
        }}
      />,
    );
    const badge = screen.getByText('5 Win Streak').closest('span');
    expect(badge?.className).toContain('chip-success');
  });

  it('applies chip-error class for loss streak', () => {
    render(
      <StreakBadge
        streaks={{
          currentStreak: 3,
          currentStreakType: 'loss',
          longestWinStreak: 10,
          longestLossStreak: 5,
        }}
      />,
    );
    const badge = screen.getByText('3 Loss Streak').closest('span');
    expect(badge?.className).toContain('chip-error');
  });
});
