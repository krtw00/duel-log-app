import { describe, expect, it } from 'vitest';
import {
  deriveIsFirstFromWonCoinToss,
  deriveWonCoinTossFromIsFirst,
  getDefaultTurnValues,
} from '../duelDefaults.js';

describe('getDefaultTurnValues', () => {
  it('defaults to winning the coin toss and choosing first when first is preferred', () => {
    expect(getDefaultTurnValues(true)).toEqual({
      isFirst: true,
      wonCoinToss: true,
    });
  });

  it('defaults to winning the coin toss and choosing second when second is preferred', () => {
    expect(getDefaultTurnValues(false)).toEqual({
      isFirst: false,
      wonCoinToss: true,
    });
  });
});

describe('deriveIsFirstFromWonCoinToss', () => {
  it('maps a coin-toss win to the preferred turn order', () => {
    expect(deriveIsFirstFromWonCoinToss(true, true)).toBe(true);
    expect(deriveIsFirstFromWonCoinToss(true, false)).toBe(false);
  });

  it('maps a coin-toss loss to the opposite turn order', () => {
    expect(deriveIsFirstFromWonCoinToss(false, true)).toBe(false);
    expect(deriveIsFirstFromWonCoinToss(false, false)).toBe(true);
  });
});

describe('deriveWonCoinTossFromIsFirst', () => {
  it('treats the preferred turn order as a coin-toss win', () => {
    expect(deriveWonCoinTossFromIsFirst(true, true)).toBe(true);
    expect(deriveWonCoinTossFromIsFirst(false, false)).toBe(true);
  });

  it('treats the opposite turn order as a coin-toss loss', () => {
    expect(deriveWonCoinTossFromIsFirst(false, true)).toBe(false);
    expect(deriveWonCoinTossFromIsFirst(true, false)).toBe(false);
  });
});
