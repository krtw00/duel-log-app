/**
 * 画面解析FSM（有限状態機械）実装
 *
 * コイントス・勝敗検出の状態遷移を管理
 * メインスレッドで動作し、Vue DevToolsでデバッグ可能
 */

import { reactive, readonly, type DeepReadonly } from 'vue';
import { createLogger } from '@/utils/logger';
import type {
  FSMState,
  FSMConfig,
  DetectionScores,
  DetectionEvent,
  CoinResult,
  MatchResult,
  DetectionPhase,
} from './types';

const logger = createLogger('ScreenAnalysisFSM');

/**
 * 初期状態を生成
 */
function createInitialState(): FSMState {
  return {
    phase: 'idle',
    // コイントス
    coinStreak: 0,
    coinCandidate: null,
    coinActiveUntil: 0,
    coinCooldownUntil: 0,
    // 勝敗
    resultStreak: 0,
    resultCandidate: null,
    resultCooldownUntil: 0,
    resultLocked: true, // 初期状態はロック（コイントス検出後にアンロック）
    // イベントID
    coinEventId: 0,
    resultEventId: 0,
    // エラー
    lastError: null,
  };
}

/**
 * streak減衰ロジック
 *
 * @param currentStreak 現在のstreak値
 * @param score 検出スコア
 * @param threshold 閾値
 * @param candidate 現在の候補
 * @param newCandidate 新しい候補
 * @param config streak設定
 * @returns 更新後のstreak値
 */
function updateStreak(
  currentStreak: number,
  score: number,
  threshold: number,
  candidate: string | null,
  newCandidate: string,
  config: FSMConfig['streak'],
): number {
  // 1. スコアが閾値未満 → 緩やかに減衰
  if (score < threshold) {
    return Math.max(0, currentStreak - config.decayOnLowScore);
  }

  // 2. 候補が変わった → 大きく減衰（ただしリセットではない）
  if (candidate && candidate !== newCandidate) {
    return Math.max(0, currentStreak - config.decayOnCandidateChange);
  }

  // 3. 同じ候補で閾値以上 → 増加
  return currentStreak + config.increment;
}

/**
 * コイントススコアを処理
 */
function processCoinScores(
  state: FSMState,
  scores: DetectionScores,
  now: number,
  config: FSMConfig,
): DetectionEvent | null {
  // クールダウン中はスキップ
  if (now < state.coinCooldownUntil) {
    return null;
  }

  // 最高スコアの候補を決定
  const coinScore = Math.max(scores.coinWin, scores.coinLose);
  const newCandidate: CoinResult = scores.coinWin >= scores.coinLose ? 'win' : 'lose';

  // none ラベルの場合はスコアを0扱い
  if (scores.coinLabel === 'none') {
    state.coinStreak = Math.max(0, state.coinStreak - config.streak.decayOnLowScore);
    if (state.coinStreak === 0) {
      state.coinCandidate = null;
      if (state.phase === 'coinDetecting') {
        state.phase = 'idle';
      }
    }
    return null;
  }

  // streak更新
  const newStreak = updateStreak(
    state.coinStreak,
    coinScore,
    config.coin.threshold,
    state.coinCandidate,
    newCandidate,
    config.streak,
  );

  state.coinStreak = newStreak;

  // スコアが閾値未満の場合
  if (coinScore < config.coin.threshold) {
    if (state.coinStreak === 0) {
      state.coinCandidate = null;
      if (state.phase === 'coinDetecting') {
        state.phase = 'idle';
      }
    }
    return null;
  }

  // 候補を更新
  state.coinCandidate = newCandidate;

  // 状態遷移: idle → coinDetecting
  if (state.phase === 'idle' && state.coinStreak > 0) {
    state.phase = 'coinDetecting';
  }

  // 検出確定判定
  if (state.coinStreak >= config.coin.requiredStreak) {
    // コイントス検出確定
    state.coinStreak = 0;
    state.coinCandidate = null;
    state.coinActiveUntil = now + config.coin.activeMs;
    state.coinCooldownUntil = now + config.coin.cooldownMs;
    state.coinEventId += 1;
    state.resultLocked = false; // 勝敗検出をアンロック
    state.phase = 'coinDetected';

    logger.info(`Coin detected: ${newCandidate} (eventId: ${state.coinEventId})`);

    return {
      type: 'coinDetected',
      result: newCandidate,
      eventId: state.coinEventId,
      timestamp: now,
    };
  }

  return null;
}

/**
 * 勝敗スコアを処理
 */
function processResultScores(
  state: FSMState,
  scores: DetectionScores,
  now: number,
  config: FSMConfig,
): DetectionEvent | null {
  // クールダウン中はスキップ
  if (now < state.resultCooldownUntil) {
    return null;
  }

  // ロック状態（コイントス未検出）はスキップ
  if (state.resultLocked) {
    return null;
  }

  // コイントス有効期間中はスキップ（コイントス検出直後の誤検出防止）
  if (now < state.coinActiveUntil && state.phase === 'coinDetected') {
    // ただし、勝敗検出中の場合は継続
    if (state.resultStreak === 0) {
      return null;
    }
  }

  // 最高スコアの候補を決定
  const resultScore = Math.max(scores.resultWin, scores.resultLose);
  const newCandidate: MatchResult = scores.resultWin >= scores.resultLose ? 'win' : 'lose';

  // none ラベルの場合はスコアを0扱い
  if (scores.resultLabel === 'none') {
    state.resultStreak = Math.max(0, state.resultStreak - config.streak.decayOnLowScore);
    if (state.resultStreak === 0) {
      state.resultCandidate = null;
      if (state.phase === 'resultDetecting') {
        state.phase = 'coinDetected';
      }
    }
    return null;
  }

  // streak更新
  const newStreak = updateStreak(
    state.resultStreak,
    resultScore,
    config.result.threshold,
    state.resultCandidate,
    newCandidate,
    config.streak,
  );

  state.resultStreak = newStreak;

  // スコアが閾値未満の場合
  if (resultScore < config.result.threshold) {
    if (state.resultStreak === 0) {
      state.resultCandidate = null;
      if (state.phase === 'resultDetecting') {
        state.phase = 'coinDetected';
      }
    }
    return null;
  }

  // 候補を更新
  state.resultCandidate = newCandidate;

  // 状態遷移: coinDetected → resultDetecting
  if (state.phase === 'coinDetected' && state.resultStreak > 0) {
    state.phase = 'resultDetecting';
  }

  // 検出確定判定
  if (state.resultStreak >= config.result.requiredStreak) {
    // 勝敗検出確定
    state.resultStreak = 0;
    state.resultCandidate = null;
    state.resultCooldownUntil = now + config.result.cooldownMs;
    state.resultEventId += 1;
    state.resultLocked = true; // 次のコイントスまでロック
    state.phase = 'resultDetected';

    logger.info(`Result detected: ${newCandidate} (eventId: ${state.resultEventId})`);

    return {
      type: 'resultDetected',
      result: newCandidate,
      eventId: state.resultEventId,
      timestamp: now,
    };
  }

  return null;
}

/**
 * クールダウン状態を更新
 */
function updateCooldownPhase(state: FSMState, now: number): void {
  // コインクールダウン終了
  if (state.phase === 'coinCooldown' && now >= state.coinCooldownUntil) {
    state.phase = 'idle';
    return;
  }

  // 勝敗クールダウン終了
  if (state.phase === 'resultCooldown' && now >= state.resultCooldownUntil) {
    state.phase = 'idle';
    return;
  }

  // 検出後 → クールダウンへの遷移
  if (state.phase === 'coinDetected' && now >= state.coinActiveUntil) {
    if (now < state.coinCooldownUntil) {
      state.phase = 'coinCooldown';
    } else {
      state.phase = 'idle';
    }
  }

  if (state.phase === 'resultDetected') {
    if (now < state.resultCooldownUntil) {
      state.phase = 'resultCooldown';
    } else {
      state.phase = 'idle';
    }
  }
}

/**
 * FSMを作成
 */
export function createFSM(config: FSMConfig) {
  const state = reactive<FSMState>(createInitialState());

  /**
   * スコアを処理して状態遷移を行う
   */
  function processScores(scores: DetectionScores): DetectionEvent | null {
    const now = scores.timestamp;

    // クールダウン状態を更新
    updateCooldownPhase(state, now);

    // コイントス検出
    const coinEvent = processCoinScores(state, scores, now, config);
    if (coinEvent) {
      return coinEvent;
    }

    // クールダウン状態を再更新（コイン検出後）
    updateCooldownPhase(state, now);

    // 勝敗検出
    const resultEvent = processResultScores(state, scores, now, config);
    if (resultEvent) {
      return resultEvent;
    }

    return null;
  }

  /**
   * 状態をリセット（次の対戦用）
   */
  function reset(): void {
    const initial = createInitialState();
    Object.assign(state, initial);
    logger.info('FSM state reset');
  }

  /**
   * 部分リセット（検出状態のみ、eventIdは維持）
   */
  function softReset(): void {
    state.phase = 'idle';
    state.coinStreak = 0;
    state.coinCandidate = null;
    state.resultStreak = 0;
    state.resultCandidate = null;
    state.coinActiveUntil = 0;
    state.coinCooldownUntil = 0;
    state.resultCooldownUntil = 0;
    // resultLockedは維持（前回の状態を引き継ぐ）
    state.lastError = null;
    logger.info('FSM soft reset');
  }

  /**
   * エラーを記録
   */
  function setError(error: string): void {
    state.lastError = error;
    logger.error('FSM error:', error);
  }

  /**
   * コイントスが有効期間中かどうか
   */
  function isCoinActive(now: number): boolean {
    return now < state.coinActiveUntil;
  }

  /**
   * 現在のフェーズを取得
   */
  function getPhase(): DetectionPhase {
    return state.phase;
  }

  return {
    state: readonly(state) as DeepReadonly<FSMState>,
    processScores,
    reset,
    softReset,
    setError,
    isCoinActive,
    getPhase,
  };
}

export type FSM = ReturnType<typeof createFSM>;
