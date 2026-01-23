import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameModeTabBar } from '../GameModeTabBar.js';

describe('GameModeTabBar', () => {
  it('renders all tabs', () => {
    render(<GameModeTabBar value={undefined} onChange={() => {}} />);

    expect(screen.getByText('全て')).toBeInTheDocument();
    expect(screen.getByText('ランク')).toBeInTheDocument();
    expect(screen.getByText('レート')).toBeInTheDocument();
    expect(screen.getByText('イベント')).toBeInTheDocument();
    expect(screen.getByText('DC')).toBeInTheDocument();
  });

  it('highlights "全て" tab when value is undefined', () => {
    render(<GameModeTabBar value={undefined} onChange={() => {}} />);
    const allTab = screen.getByText('全て');
    expect(allTab.className).toContain('border-blue-600');
  });

  it('highlights selected game mode tab', () => {
    render(<GameModeTabBar value="RANK" onChange={() => {}} />);
    const rankTab = screen.getByText('ランク');
    expect(rankTab.className).toContain('border-blue-600');
  });

  it('calls onChange with undefined when "全て" is clicked', () => {
    const onChange = vi.fn();
    render(<GameModeTabBar value="RANK" onChange={onChange} />);

    fireEvent.click(screen.getByText('全て'));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('calls onChange with game mode when tab is clicked', () => {
    const onChange = vi.fn();
    render(<GameModeTabBar value={undefined} onChange={onChange} />);

    fireEvent.click(screen.getByText('ランク'));
    expect(onChange).toHaveBeenCalledWith('RANK');

    fireEvent.click(screen.getByText('DC'));
    expect(onChange).toHaveBeenCalledWith('DC');
  });
});
