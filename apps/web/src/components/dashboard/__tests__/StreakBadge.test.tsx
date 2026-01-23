import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StreakBadge } from '../StreakBadge.js';

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
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/連勝中/)).toBeInTheDocument();
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
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/連敗中/)).toBeInTheDocument();
  });

  it('applies green color for win streak', () => {
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
    const badge = screen.getByText(/連勝中/).closest('span');
    expect(badge?.className).toContain('bg-green-100');
  });

  it('applies red color for loss streak', () => {
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
    const badge = screen.getByText(/連敗中/).closest('span');
    expect(badge?.className).toContain('bg-red-100');
  });
});
