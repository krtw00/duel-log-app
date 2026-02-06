import type { Duel } from '@duel-log/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDueledAtForSubmit } from '../duel.js';

describe('getDueledAtForSubmit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('新規登録時は送信時点の現在時刻を返す', () => {
    const submitTime = new Date('2026-02-02T10:30:00.000Z');
    vi.setSystemTime(submitTime);

    const formDueledAt = '2026-02-02T10:00:00.000Z'; // フォーム初期化時の古い時刻

    const result = getDueledAtForSubmit(null, formDueledAt);

    expect(result).toBe(submitTime.toISOString());
    expect(result).not.toBe(formDueledAt); // フォームの古い時刻ではない
  });

  it('新規登録時、連続送信で毎回異なる時刻が返される', () => {
    // 1回目の送信
    const submitTime1 = new Date('2026-02-02T10:30:00.000Z');
    vi.setSystemTime(submitTime1);
    const result1 = getDueledAtForSubmit(null, '2026-02-02T10:00:00.000Z');

    // 5分後に2回目の送信
    const submitTime2 = new Date('2026-02-02T10:35:00.000Z');
    vi.setSystemTime(submitTime2);
    const result2 = getDueledAtForSubmit(null, '2026-02-02T10:00:00.000Z');

    expect(result1).toBe('2026-02-02T10:30:00.000Z');
    expect(result2).toBe('2026-02-02T10:35:00.000Z');
    expect(result1).not.toBe(result2);
  });

  it('編集時はフォームのdueledAtをそのまま返す', () => {
    const submitTime = new Date('2026-02-02T10:30:00.000Z');
    vi.setSystemTime(submitTime);

    const editingDuel: Duel = {
      id: 'duel-1',
      userId: 'user-1',
      deckId: 'deck-1',
      opponentDeckId: 'opponent-deck-1',
      result: 'win',
      gameMode: 'RANK',
      isFirst: true,
      wonCoinToss: true,
      rank: 18,
      rateValue: null,
      dcValue: null,
      memo: null,
      dueledAt: '2026-01-15T14:30:00.000Z',
      createdAt: '2026-01-15T14:30:00.000Z',
      updatedAt: '2026-01-15T14:30:00.000Z',
    };

    const formDueledAt = '2026-01-15T14:30:00.000Z';

    const result = getDueledAtForSubmit(editingDuel, formDueledAt);

    expect(result).toBe(formDueledAt);
    expect(result).not.toBe(submitTime.toISOString()); // 現在時刻ではない
  });

  it('editingDuelがundefinedの場合は新規登録として扱う', () => {
    const submitTime = new Date('2026-02-02T10:30:00.000Z');
    vi.setSystemTime(submitTime);

    const result = getDueledAtForSubmit(undefined, '2026-02-02T10:00:00.000Z');

    expect(result).toBe(submitTime.toISOString());
  });
});
