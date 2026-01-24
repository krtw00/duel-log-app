import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatsDisplayCards } from '../StatsDisplayCards.js';

describe('StatsDisplayCards', () => {
  it('shows skeleton when loading', () => {
    const { container } = render(<StatsDisplayCards stats={undefined} loading={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders stat cards when stats provided', () => {
    const stats = {
      totalDuels: 100,
      wins: 60,
      losses: 40,
      winRate: 0.6,
      firstRate: 0.55,
      firstWinRate: 0.65,
      secondWinRate: 0.53,
      coinTossWinRate: 0.48,
    };

    const { container } = render(<StatsDisplayCards stats={stats} loading={false} />);
    const cards = container.querySelectorAll('.stat-card');
    expect(cards.length).toBe(6);
  });

  it('renders default values when stats is undefined', () => {
    const { container } = render(<StatsDisplayCards stats={undefined} loading={false} />);
    const cards = container.querySelectorAll('.stat-card');
    expect(cards.length).toBe(6);
  });
});
