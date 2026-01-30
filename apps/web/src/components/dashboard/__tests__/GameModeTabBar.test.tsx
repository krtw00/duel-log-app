import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameModeTabBar } from '../GameModeTabBar.js';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'gameMode.RANK': 'RANK',
        'gameMode.RATE': 'RATE',
        'gameMode.EVENT': 'EVENT',
        'gameMode.DC': 'DC',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('GameModeTabBar', () => {
  it('renders all game mode tabs', () => {
    render(<GameModeTabBar value="RANK" onChange={() => {}} />);

    expect(screen.getAllByText('RANK').length).toBeGreaterThan(0);
    expect(screen.getAllByText('RATE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('EVENT').length).toBeGreaterThan(0);
    expect(screen.getAllByText('DC').length).toBeGreaterThan(0);
  });

  it('highlights selected game mode tab with active class', () => {
    render(<GameModeTabBar value="RANK" onChange={() => {}} />);
    const rankTab = screen.getAllByText('RANK')[0]?.closest('button');
    expect(rankTab?.className).toContain('active');
  });

  it('calls onChange with game mode when tab is clicked', () => {
    const onChange = vi.fn();
    render(<GameModeTabBar value="RANK" onChange={onChange} />);

    const rateButton = screen.getAllByText('RATE')[0];
    if (rateButton) fireEvent.click(rateButton);
    expect(onChange).toHaveBeenCalledWith('RATE');

    const dcButton = screen.getAllByText('DC')[0];
    if (dcButton) fireEvent.click(dcButton);
    expect(onChange).toHaveBeenCalledWith('DC');
  });
});
