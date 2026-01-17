import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSmartPolling } from '../useSmartPolling';

describe('useSmartPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // document.visibilityStateをモック
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: 'visible',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('ポーリングを開始して停止できる', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { start, stop, isPolling } = useSmartPolling({
      fn,
      interval: 1000,
    });

    expect(isPolling.value).toBe(false);

    start();
    expect(isPolling.value).toBe(true);

    stop();
    expect(isPolling.value).toBe(false);
  });

  it('指定された間隔でポーリングを実行する', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { start, stop } = useSmartPolling({
      fn,
      interval: 1000,
    });

    start();

    // 最初の実行（即座に実行される）
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);

    // 1秒後に2回目
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(2);

    // さらに1秒後に3回目
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(3);

    stop();
  });

  it('エラー時にエクスポネンシャルバックオフを適用する', async () => {
    let callCount = 0;
    const fn = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount <= 3) {
        throw new Error('Test error');
      }
    });

    const { start, stop } = useSmartPolling({
      fn,
      interval: 1000,
      maxBackoff: 60000,
    });

    start();

    // 1回目の実行（即座に実行、エラー）
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);

    // 2回目: 1000ms後（2^0 * 1000 = 1000）
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(2);

    // 3回目: 2000ms後（2^1 * 1000 = 2000）
    await vi.advanceTimersByTimeAsync(2000);
    expect(fn).toHaveBeenCalledTimes(3);

    // 4回目: 4000ms後（2^2 * 1000 = 4000）、成功
    await vi.advanceTimersByTimeAsync(4000);
    expect(fn).toHaveBeenCalledTimes(4);

    // 5回目: 元の間隔に戻る（1000ms）
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(5);

    stop();
  });

  it('エクスポネンシャルバックオフがmaxBackoffを超えない', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Test error'));
    const { start, stop } = useSmartPolling({
      fn,
      interval: 1000,
      maxBackoff: 5000,
    });

    start();

    // 1回目: 即座に実行
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);

    // 2回目: 1000ms後（2^0 * 1000 = 1000）
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(2);

    // 3回目: 2000ms後（2^1 * 1000 = 2000）
    await vi.advanceTimersByTimeAsync(2000);
    expect(fn).toHaveBeenCalledTimes(3);

    // 4回目: 4000ms後（2^2 * 1000 = 4000）
    await vi.advanceTimersByTimeAsync(4000);
    expect(fn).toHaveBeenCalledTimes(4);

    // 5回目: 5000ms後（2^3 * 1000 = 8000だが、maxBackoff=5000でキャップ）
    await vi.advanceTimersByTimeAsync(5000);
    expect(fn).toHaveBeenCalledTimes(5);

    // 6回目も5000ms後
    await vi.advanceTimersByTimeAsync(5000);
    expect(fn).toHaveBeenCalledTimes(6);

    stop();
  });

  it('pauseOnHidden=trueの時、非表示時はポーリングを停止する', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { start, stop } = useSmartPolling({
      fn,
      interval: 1000,
      pauseOnHidden: true,
    });

    start();

    // 1回目の実行
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);

    // 2回目の実行
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(2);

    // ページを非表示にする
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));

    // すでにスケジュールされていたタイマーが1回実行される
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(3);

    // その後はポーリングされない（1秒ごとに可視性チェックのみ）
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(3);

    // ページを表示に戻す
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));

    // 即座にポーリングが再開される
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(4);

    // 通常通りポーリングが続く
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(5);

    stop();
  });

  it('pauseOnHidden=falseの時、非表示時もポーリングを継続する', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { start, stop } = useSmartPolling({
      fn,
      interval: 1000,
      pauseOnHidden: false,
    });

    start();

    // 1回目の実行
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);

    // ページを非表示にする
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: 'hidden',
    });

    // 非表示でもポーリングが継続される
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(3);

    stop();
  });

  it('二重にstartを呼んでも問題ない', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { start, stop } = useSmartPolling({
      fn,
      interval: 1000,
    });

    start();
    start(); // 2回目のstartは無視される

    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(2);

    stop();
  });

  it('二重にstopを呼んでも問題ない', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { start, stop } = useSmartPolling({
      fn,
      interval: 1000,
    });

    start();
    stop();
    stop(); // 2回目のstopは無視される

    expect(() => stop()).not.toThrow();
  });
});
