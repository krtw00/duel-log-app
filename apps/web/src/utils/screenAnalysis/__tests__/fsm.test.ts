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
});
