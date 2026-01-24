import {
  COIN_STREAK_THRESHOLD,
  COIN_VALIDITY_MS,
  CONFIDENCE_THRESHOLD,
  COOLDOWN_MS,
  RESULT_STREAK_THRESHOLD,
  STREAK_CHANGE_PENALTY,
  STREAK_DECREASE_RATE,
  STREAK_INCREASE_RATE,
} from './config.js';
import type { AnalysisFrame, CoinResult, DetectionResult, FSMContext } from './types.js';

export function createInitialContext(): FSMContext {
  return {
    state: 'idle',
    coinResult: null,
    coinStreak: 0,
    resultStreak: 0,
    detectionResult: null,
    coinDetectedAt: 0,
    resultDetectedAt: 0,
    cooldownUntil: 0,
  };
}

type StreakState = {
  streak: number;
  candidate: CoinResult | DetectionResult;
};

function updateStreak(
  current: StreakState,
  newCandidate: CoinResult | DetectionResult,
  confidence: number,
): StreakState {
  if (!newCandidate || confidence < CONFIDENCE_THRESHOLD) {
    return {
      streak: Math.max(0, current.streak - STREAK_DECREASE_RATE),
      candidate: current.candidate,
    };
  }
  if (newCandidate === current.candidate) {
    return { streak: current.streak + STREAK_INCREASE_RATE, candidate: current.candidate };
  }
  // Candidate changed
  return { streak: Math.max(0, current.streak - STREAK_CHANGE_PENALTY), candidate: newCandidate };
}

export function transition(ctx: FSMContext, frame: AnalysisFrame): FSMContext {
  const now = frame.timestamp;

  // Check cooldown
  if (ctx.state === 'cooldown') {
    if (now >= ctx.cooldownUntil) {
      return { ...createInitialContext(), state: 'idle' };
    }
    return ctx;
  }

  // Check result detected → cooldown
  if (ctx.state === 'resultDetected') {
    return {
      ...ctx,
      state: 'cooldown',
      cooldownUntil: now + COOLDOWN_MS,
    };
  }

  // idle → coinDetecting
  if (ctx.state === 'idle') {
    if (frame.coin && frame.coinConfidence >= CONFIDENCE_THRESHOLD) {
      return {
        ...ctx,
        state: 'coinDetecting',
        coinStreak: STREAK_INCREASE_RATE,
        coinResult: frame.coin,
      };
    }
    return ctx;
  }

  // coinDetecting → coinDetected
  if (ctx.state === 'coinDetecting') {
    const coinState = updateStreak(
      { streak: ctx.coinStreak, candidate: ctx.coinResult },
      frame.coin,
      frame.coinConfidence,
    );

    if (coinState.streak >= COIN_STREAK_THRESHOLD) {
      return {
        ...ctx,
        state: 'coinDetected',
        coinResult: coinState.candidate as CoinResult,
        coinStreak: coinState.streak,
        coinDetectedAt: now,
      };
    }

    if (coinState.streak <= 0) {
      return createInitialContext();
    }

    return {
      ...ctx,
      coinStreak: coinState.streak,
      coinResult: coinState.candidate as CoinResult,
    };
  }

  // coinDetected → resultDetecting
  if (ctx.state === 'coinDetected') {
    // Check coin validity timeout
    if (now - ctx.coinDetectedAt > COIN_VALIDITY_MS) {
      return createInitialContext();
    }

    if (frame.result && frame.resultConfidence >= CONFIDENCE_THRESHOLD) {
      return {
        ...ctx,
        state: 'resultDetecting',
        resultStreak: STREAK_INCREASE_RATE,
        detectionResult: frame.result,
      };
    }
    return ctx;
  }

  // resultDetecting → resultDetected
  if (ctx.state === 'resultDetecting') {
    // Check coin validity timeout
    if (now - ctx.coinDetectedAt > COIN_VALIDITY_MS) {
      return createInitialContext();
    }

    const resultState = updateStreak(
      { streak: ctx.resultStreak, candidate: ctx.detectionResult },
      frame.result,
      frame.resultConfidence,
    );

    if (resultState.streak >= RESULT_STREAK_THRESHOLD) {
      return {
        ...ctx,
        state: 'resultDetected',
        detectionResult: resultState.candidate as DetectionResult,
        resultStreak: resultState.streak,
        resultDetectedAt: now,
      };
    }

    if (resultState.streak <= 0) {
      return { ...ctx, state: 'coinDetected', resultStreak: 0, detectionResult: null };
    }

    return {
      ...ctx,
      resultStreak: resultState.streak,
      detectionResult: resultState.candidate as DetectionResult,
    };
  }

  return ctx;
}
