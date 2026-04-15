import { describe, expect, it } from 'vitest';
import { createInitialContext, transition } from '../fsm.js';
import type { AnalysisFrame, FSMContext } from '../types.js';

function createFrame(
  overrides: Partial<AnalysisFrame> = {},
  timestamp = 1_000,
): AnalysisFrame {
  return {
    coin: null,
    coinConfidence: 0,
    coinWinScore: 0,
    coinLossScore: 0,
    result: null,
    resultConfidence: 0,
    resultWinScore: 0,
    resultLossScore: 0,
    timestamp,
    ...overrides,
  };
}

function createCoinDetectedContext(overrides: Partial<FSMContext> = {}): FSMContext {
  return {
    ...createInitialContext(),
    state: 'coinDetected',
    coinResult: 'won',
    coinDetectedAt: 1_000,
    ...overrides,
  };
}

function createResultDetectingContext(overrides: Partial<FSMContext> = {}): FSMContext {
  return {
    ...createInitialContext(),
    state: 'resultDetecting',
    coinResult: 'won',
    coinDetectedAt: 1_000,
    resultStreak: 1,
    detectionResult: 'win',
    ...overrides,
  };
}

function createCooldownContext(overrides: Partial<FSMContext> = {}): FSMContext {
  return {
    ...createInitialContext(),
    state: 'cooldown',
    coinResult: 'won',
    detectionResult: 'win',
    coinDetectedAt: 1_000,
    resultDetectedAt: 10_000,
    cooldownUntil: 20_000,
    ...overrides,
  };
}

describe('transition', () => {
  it('keeps coinDetected state alive until a result arrives', () => {
    const ctx = createCoinDetectedContext();
    const frame = createFrame({}, 60_000);

    expect(transition(ctx, frame)).toEqual(ctx);
  });

  it('starts result detection even when the result appears long after coin detection', () => {
    const ctx = createCoinDetectedContext();
    const frame = createFrame(
      {
        result: 'win',
        resultConfidence: 0.8,
      },
      60_000,
    );

    expect(transition(ctx, frame)).toEqual({
      ...ctx,
      state: 'resultDetecting',
      resultStreak: 1,
      detectionResult: 'win',
    });
  });

  it('locks coin detection immediately when a high-confidence coin signal appears from idle', () => {
    const ctx = createInitialContext();
    const frame = createFrame(
      {
        coin: 'won',
        coinConfidence: 0.96,
      },
      2_000,
    );

    expect(transition(ctx, frame)).toEqual({
      ...createInitialContext(),
      state: 'coinDetected',
      coinStreak: 5,
      coinResult: 'won',
      coinDetectedAt: 2_000,
    });
  });

  it('re-arms coin detection for a fresh match after a long stale coinDetected state', () => {
    const ctx = createCoinDetectedContext({
      coinResult: 'won',
      coinDetectedAt: 1_000,
    });
    const frame = createFrame(
      {
        coin: 'lost',
        coinConfidence: 0.96,
      },
      20_000,
    );

    expect(transition(ctx, frame)).toEqual({
      ...createInitialContext(),
      state: 'coinDetected',
      coinStreak: 5,
      coinResult: 'lost',
      coinDetectedAt: 20_000,
    });
  });

  it('re-arms coin detection from resultDetecting after a long stale state', () => {
    const ctx = createResultDetectingContext();
    const frame = createFrame(
      {
        coin: 'lost',
        coinConfidence: 0.96,
      },
      20_000,
    );

    expect(transition(ctx, frame)).toEqual({
      ...createInitialContext(),
      state: 'coinDetected',
      coinStreak: 5,
      coinResult: 'lost',
      coinDetectedAt: 20_000,
    });
  });

  it('re-arms coin detection from cooldown as soon as a strong new coin signal appears', () => {
    const ctx = createCooldownContext();
    const frame = createFrame(
      {
        coin: 'lost',
        coinConfidence: 0.96,
      },
      12_000,
    );

    expect(transition(ctx, frame)).toEqual({
      ...createInitialContext(),
      state: 'coinDetected',
      coinStreak: 5,
      coinResult: 'lost',
      coinDetectedAt: 12_000,
    });
  });
});
