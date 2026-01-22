/**
 * 画面解析FSM 単体テスト
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createFSM } from '../fsm';
import type { FSMConfig, DetectionScores } from '../types';

// テスト用設定（本番より短いタイミング）
// 注意: cooldownMs >= activeMs にしないと、activeMs後にidle状態に遷移してしまう
const TEST_CONFIG: FSMConfig = {
  coin: {
    threshold: 0.6,
    requiredStreak: 3,
    cooldownMs: 3000, // activeMs以上に設定
    activeMs: 2000,
  },
  result: {
    threshold: 0.6,
    requiredStreak: 2,
    cooldownMs: 1000,
  },
  streak: {
    decayOnLowScore: 0.5,
    decayOnCandidateChange: 1.5,
    increment: 1.0,
  },
};

// スコア生成ヘルパー
function createScores(
  overrides: Partial<DetectionScores> = {},
  timestamp = Date.now(),
): DetectionScores {
  return {
    coinWin: 0,
    coinLose: 0,
    resultWin: 0,
    resultLose: 0,
    coinLabel: 'none',
    resultLabel: 'none',
    timestamp,
    ...overrides,
  };
}

describe('FSM（有限状態機械）', () => {
  describe('初期状態', () => {
    it('idle状態で開始する', () => {
      const fsm = createFSM(TEST_CONFIG);
      expect(fsm.state.phase).toBe('idle');
    });

    it('resultLockedがtrueで開始する', () => {
      const fsm = createFSM(TEST_CONFIG);
      expect(fsm.state.resultLocked).toBe(true);
    });

    it('streakが0で開始する', () => {
      const fsm = createFSM(TEST_CONFIG);
      expect(fsm.state.coinStreak).toBe(0);
      expect(fsm.state.resultStreak).toBe(0);
    });
  });

  describe('streak減衰ロジック', () => {
    it('閾値以上のスコアでstreakが増加する', () => {
      const fsm = createFSM(TEST_CONFIG);
      const now = Date.now();

      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now));
      expect(fsm.state.coinStreak).toBe(1);

      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 200));
      expect(fsm.state.coinStreak).toBe(2);
    });

    it('閾値未満のスコアでstreakが減衰する（即リセットではない）', () => {
      const fsm = createFSM(TEST_CONFIG);
      const now = Date.now();

      // まずstreakを上げる
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 200));
      expect(fsm.state.coinStreak).toBe(2);

      // 閾値未満のスコアで減衰
      fsm.processScores(createScores({ coinWin: 0.3, coinLabel: 'none' }, now + 400));
      expect(fsm.state.coinStreak).toBe(1.5); // 2 - 0.5
    });

    it('候補が変わると大きく減衰する', () => {
      const fsm = createFSM(TEST_CONFIG);
      const now = Date.now();

      // winでstreakを上げる
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 200));
      expect(fsm.state.coinStreak).toBe(2);

      // loseに変わると大きく減衰
      fsm.processScores(createScores({ coinLose: 0.8, coinLabel: 'lose' }, now + 400));
      expect(fsm.state.coinStreak).toBe(0.5); // 2 - 1.5
    });
  });

  describe('コイントス検出', () => {
    it('requiredStreak到達でcoinDetectedイベントが発火する', () => {
      const fsm = createFSM(TEST_CONFIG);
      const now = Date.now();

      // 3回連続でcoin検出
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 200));
      const event = fsm.processScores(
        createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 400),
      );

      expect(event).not.toBeNull();
      expect(event?.type).toBe('coinDetected');
      expect(event?.result).toBe('win');
    });

    it('coinDetected後にresultLockedがfalseになる', () => {
      const fsm = createFSM(TEST_CONFIG);
      const now = Date.now();

      expect(fsm.state.resultLocked).toBe(true);

      // コイントス検出
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 200));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 400));

      expect(fsm.state.resultLocked).toBe(false);
    });

    it('クールダウン中はコイントス検出しない', () => {
      const fsm = createFSM(TEST_CONFIG);
      const now = Date.now();

      // 最初のコイントス検出
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 200));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 400));

      // クールダウン中に再度検出しようとする
      const event = fsm.processScores(
        createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 600),
      );
      expect(event?.type).not.toBe('coinDetected');
    });
  });

  describe('勝敗検出', () => {
    let fsm: ReturnType<typeof createFSM>;
    let baseTime: number;

    beforeEach(() => {
      fsm = createFSM(TEST_CONFIG);
      baseTime = Date.now();

      // まずコイントスを検出してresultLockedを解除
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, baseTime));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, baseTime + 200));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, baseTime + 400));
    });

    it('コイントス検出後に勝敗検出が可能になる', () => {
      expect(fsm.state.resultLocked).toBe(false);
    });

    it('requiredStreak到達でresultDetectedイベントが発火する', () => {
      // コイントス検出時刻は baseTime + 400
      // coinActiveUntilを過ぎてから勝敗検出
      const coinDetectedAt = baseTime + 400;
      const afterActive = coinDetectedAt + TEST_CONFIG.coin.activeMs + 100;

      fsm.processScores(createScores({ resultWin: 0.8, resultLabel: 'victory' }, afterActive));
      const event = fsm.processScores(
        createScores({ resultWin: 0.8, resultLabel: 'victory' }, afterActive + 200),
      );

      expect(event).not.toBeNull();
      expect(event?.type).toBe('resultDetected');
      expect(event?.result).toBe('win');
    });

    it('resultDetected後にresultLockedがtrueに戻る', () => {
      const coinDetectedAt = baseTime + 400;
      const afterActive = coinDetectedAt + TEST_CONFIG.coin.activeMs + 100;

      fsm.processScores(createScores({ resultWin: 0.8, resultLabel: 'victory' }, afterActive));
      fsm.processScores(
        createScores({ resultWin: 0.8, resultLabel: 'victory' }, afterActive + 200),
      );

      expect(fsm.state.resultLocked).toBe(true);
    });

    it('resultLocked状態では勝敗検出しない', () => {
      // 勝敗検出してロック状態に
      const coinDetectedAt = baseTime + 400;
      const afterActive = coinDetectedAt + TEST_CONFIG.coin.activeMs + 100;
      fsm.processScores(createScores({ resultWin: 0.8, resultLabel: 'victory' }, afterActive));
      fsm.processScores(
        createScores({ resultWin: 0.8, resultLabel: 'victory' }, afterActive + 200),
      );

      expect(fsm.state.resultLocked).toBe(true);

      // ロック中は検出しない
      const afterCooldown = afterActive + TEST_CONFIG.result.cooldownMs + 100;
      const event = fsm.processScores(
        createScores({ resultWin: 0.8, resultLabel: 'victory' }, afterCooldown),
      );

      expect(event?.type).not.toBe('resultDetected');
    });
  });

  describe('状態遷移', () => {
    it('idle → coinDetecting → coinDetected', () => {
      const fsm = createFSM(TEST_CONFIG);
      const now = Date.now();

      expect(fsm.state.phase).toBe('idle');

      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now));
      expect(fsm.state.phase).toBe('coinDetecting');

      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 200));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 400));
      expect(fsm.state.phase).toBe('coinDetected');
    });

    it('coinDetected → coinCooldown → idle（勝敗検出はcoinDetectedフェーズでのみ可能）', () => {
      const fsm = createFSM(TEST_CONFIG);
      const now = Date.now();

      // コイントス検出
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 200));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 400));
      expect(fsm.state.phase).toBe('coinDetected');
      expect(fsm.state.resultLocked).toBe(false);

      // コイントス検出時刻 = now + 400
      // activeMs後はcoinCooldownに遷移
      const coinDetectedAt = now + 400;
      const afterActive = coinDetectedAt + TEST_CONFIG.coin.activeMs + 100;
      fsm.processScores(createScores({ resultLabel: 'none' }, afterActive));
      expect(fsm.state.phase).toBe('coinCooldown');

      // cooldownMs後にidle状態に戻る
      const afterCooldown = coinDetectedAt + TEST_CONFIG.coin.cooldownMs + 100;
      fsm.processScores(createScores({ resultLabel: 'none' }, afterCooldown));
      expect(fsm.state.phase).toBe('idle');

      // idle状態ではresultDetectingに遷移できない（設計上の制約）
      // resultLockedはfalseのままだが、フェーズ遷移は起きない
      fsm.processScores(createScores({ resultWin: 0.8, resultLabel: 'victory' }, afterCooldown + 200));
      expect(fsm.state.phase).toBe('idle'); // resultDetectingにはならない
    });

    it('coinDetecting → idle（streak減衰で0になった場合）', () => {
      const fsm = createFSM(TEST_CONFIG);
      const now = Date.now();

      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now));
      expect(fsm.state.phase).toBe('coinDetecting');

      // noneラベルで減衰させる
      fsm.processScores(createScores({ coinLabel: 'none' }, now + 200));
      fsm.processScores(createScores({ coinLabel: 'none' }, now + 400));
      expect(fsm.state.phase).toBe('idle');
    });
  });

  describe('reset / softReset', () => {
    it('resetで完全に初期状態に戻る', () => {
      const fsm = createFSM(TEST_CONFIG);
      const now = Date.now();

      // コイントス検出
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 200));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 400));

      expect(fsm.state.coinEventId).toBe(1);
      expect(fsm.state.resultLocked).toBe(false);

      fsm.reset();

      expect(fsm.state.phase).toBe('idle');
      expect(fsm.state.coinEventId).toBe(0);
      expect(fsm.state.resultEventId).toBe(0);
      expect(fsm.state.resultLocked).toBe(true);
    });

    it('softResetでeventIdは維持される', () => {
      const fsm = createFSM(TEST_CONFIG);
      const now = Date.now();

      // コイントス検出
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 200));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 400));

      expect(fsm.state.coinEventId).toBe(1);

      fsm.softReset();

      expect(fsm.state.phase).toBe('idle');
      expect(fsm.state.coinEventId).toBe(1); // 維持される
      expect(fsm.state.coinStreak).toBe(0);
    });
  });

  describe('isCoinActive', () => {
    it('コイントス検出後のactiveMs以内はtrueを返す', () => {
      const fsm = createFSM(TEST_CONFIG);
      const now = Date.now();

      // コイントス検出
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 200));
      fsm.processScores(createScores({ coinWin: 0.8, coinLabel: 'win' }, now + 400));

      // コイントス検出時刻 = now + 400
      // coinActiveUntil = now + 400 + activeMs(2000) = now + 2400
      const coinDetectedAt = now + 400;
      expect(fsm.isCoinActive(coinDetectedAt + 500)).toBe(true); // まだactive期間内
      expect(fsm.isCoinActive(coinDetectedAt + TEST_CONFIG.coin.activeMs + 100)).toBe(false); // active期間外
    });
  });

  describe('エラー処理', () => {
    it('setErrorでエラーが記録される', () => {
      const fsm = createFSM(TEST_CONFIG);

      expect(fsm.state.lastError).toBeNull();

      fsm.setError('Test error');

      expect(fsm.state.lastError).toBe('Test error');
    });

    it('softResetでエラーがクリアされる', () => {
      const fsm = createFSM(TEST_CONFIG);

      fsm.setError('Test error');
      expect(fsm.state.lastError).toBe('Test error');

      fsm.softReset();
      expect(fsm.state.lastError).toBeNull();
    });
  });
});
