import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatsDisplayCards } from '../StatsDisplayCards.js';

describe('StatsDisplayCards', () => {
  it('shows skeleton when loading', () => {
    const { container } = render(<StatsDisplayCards stats={undefined} loading={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(4);
  });

  it('renders nothing when stats is undefined and not loading', () => {
    const { container } = render(<StatsDisplayCards stats={undefined} loading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays stats correctly', () => {
    const stats = {
      totalDuels: 100,
      wins: 60,
      losses: 40,
      winRate: 0.6,
      firstRate: 0.55,
      coinTossWinRate: 0.48,
    };

    render(<StatsDisplayCards stats={stats} loading={false} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('60.0%')).toBeInTheDocument();
    expect(screen.getByText('55.0%')).toBeInTheDocument();
    expect(screen.getByText('48.0%')).toBeInTheDocument();
    expect(screen.getByText('60勝 40敗')).toBeInTheDocument();
  });

  it('applies green color for win rate >= 50%', () => {
    const stats = {
      totalDuels: 10,
      wins: 6,
      losses: 4,
      winRate: 0.6,
      firstRate: 0.5,
      coinTossWinRate: 0.5,
    };

    render(<StatsDisplayCards stats={stats} loading={false} />);
    const winRateEl = screen.getByText('60.0%');
    expect(winRateEl.className).toContain('text-green-600');
  });

  it('applies red color for win rate < 50%', () => {
    const stats = {
      totalDuels: 10,
      wins: 3,
      losses: 7,
      winRate: 0.3,
      firstRate: 0.5,
      coinTossWinRate: 0.5,
    };

    render(<StatsDisplayCards stats={stats} loading={false} />);
    const winRateEl = screen.getByText('30.0%');
    expect(winRateEl.className).toContain('text-red-600');
  });
});
