import { describe, it, expect } from 'vitest';
import { RANKS, getRankName, getRankValue } from '../ranks';

describe('ranks utility', () => {
  it('RANKS should be an array of rank objects', () => {
    expect(Array.isArray(RANKS)).toBe(true);
    expect(RANKS.length).toBeGreaterThan(0);
    expect(RANKS[0]).toHaveProperty('value');
    expect(RANKS[0]).toHaveProperty('label');
  });

  it('getRankName should return the correct rank label for a given value', () => {
    expect(getRankName(1)).toBe('ビギナー2');
    expect(getRankName(18)).toBe('プラチナ5');
    expect(getRankName(32)).toBe('マスター1');
  });

  it('getRankName should return "不明" for an unknown rank value', () => {
    expect(getRankName(0)).toBe('不明');
    expect(getRankName(99)).toBe('不明');
  });

  it('getRankValue should return the correct rank value for a given label', () => {
    expect(getRankValue('ビギナー2')).toBe(1);
    expect(getRankValue('プラチナ5')).toBe(18);
    expect(getRankValue('マスター1')).toBe(32);
  });

  it('getRankValue should return null for an unknown rank label', () => {
    expect(getRankValue('未知のランク')).toBeNull();
    expect(getRankValue('ルーキー')).toBeNull();
  });
});
