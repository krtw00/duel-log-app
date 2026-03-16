import type { Duel } from '@duel-log/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDueledAtForSubmit, toDatetimeLocal, fromDatetimeLocal } from '../duel.js';

describe('getDueledAtForSubmit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('新規登録時（日時未変更）は送信時点の現在時刻を返す', () => {
    const submitTime = new Date('2026-02-02T10:30:00.000Z');
    vi.setSystemTime(submitTime);

    const formDueledAt = '2026-02-02T10:00:00.000Z'; // フォーム初期化時の古い時刻

    const result = getDueledAtForSubmit(null, formDueledAt, false);

    expect(result).toBe(submitTime.toISOString());
    expect(result).not.toBe(formDueledAt); // フォームの古い時刻ではない
  });

  it('新規登録時（日時変更済み）はフォームの値を返す', () => {
    const submitTime = new Date('2026-02-02T10:30:00.000Z');
    vi.setSystemTime(submitTime);

    const formDueledAt = '2026-02-01T20:00:00.000Z';

    const result = getDueledAtForSubmit(null, formDueledAt, true);

    expect(result).toBe(formDueledAt);
    expect(result).not.toBe(submitTime.toISOString());
  });

  it('新規登録時、連続送信で毎回異なる時刻が返される', () => {
    // 1回目の送信
    const submitTime1 = new Date('2026-02-02T10:30:00.000Z');
    vi.setSystemTime(submitTime1);
    const result1 = getDueledAtForSubmit(null, '2026-02-02T10:00:00.000Z', false);

    // 5分後に2回目の送信
    const submitTime2 = new Date('2026-02-02T10:35:00.000Z');
    vi.setSystemTime(submitTime2);
    const result2 = getDueledAtForSubmit(null, '2026-02-02T10:00:00.000Z', false);

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

    const result = getDueledAtForSubmit(editingDuel, formDueledAt, false);

    expect(result).toBe(formDueledAt);
    expect(result).not.toBe(submitTime.toISOString()); // 現在時刻ではない
  });

  it('editingDuelがundefinedの場合は新規登録として扱う', () => {
    const submitTime = new Date('2026-02-02T10:30:00.000Z');
    vi.setSystemTime(submitTime);

    const result = getDueledAtForSubmit(undefined, '2026-02-02T10:00:00.000Z', false);

    expect(result).toBe(submitTime.toISOString());
  });
});

describe('toDatetimeLocal', () => {
  it('ISO文字列をdatetime-local形式に変換する', () => {
    // NOTE: toDatetimeLocal はローカルタイムゾーンに依存するため、
    // Date のコンストラクタと同じ結果になることを確認
    const iso = '2026-02-15T14:30:00.000Z';
    const result = toDatetimeLocal(iso);
    const d = new Date(iso);
    expect(result).toContain(`${d.getFullYear()}-`);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

describe('fromDatetimeLocal', () => {
  it('datetime-local形式をISO文字列に変換する', () => {
    const local = '2026-02-15T23:30';
    const result = fromDatetimeLocal(local);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    const d = new Date(local);
    expect(result).toBe(d.toISOString());
  });
});
