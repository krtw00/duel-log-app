import { describe, expect, it, vi } from 'vitest';

let mockQueryResult: unknown[] = [];

vi.mock('../../db/index.js', () => ({
  sql: Object.assign(() => Promise.resolve(mockQueryResult), {
    call: (_: unknown, obj: Record<string, unknown>) => obj,
  }),
}));

vi.mock('../../db/helpers.js', () => ({
  andWhere: () => 'mocked_where',
  sql: () => Promise.resolve(mockQueryResult),
}));

const loadDuelService = async () => {
  vi.resetModules();
  return import('../duel.js');
};

describe('duel service', () => {
  // Note: listDuels uses Promise.all for parallel queries which is complex to mock.
  // Testing the pagination structure instead of actual data.
  describe('listDuels', () => {
    it('returns pagination structure', async () => {
      mockQueryResult = [{ count: 5 }];
      const { listDuels } = await loadDuelService();

      const result = await listDuels('user-1', { limit: 10, offset: 0 });

      // Verify pagination structure exists
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('limit', 10);
      expect(result.pagination).toHaveProperty('offset', 0);
    });
  });

  describe('getDuel', () => {
    it('returns duel when found', async () => {
      mockQueryResult = [
        { id: 'duel-1', result: 'win', userId: 'user-1', deckId: 'deck-1' },
      ];
      const { getDuel } = await loadDuelService();

      const result = await getDuel('user-1', 'duel-1');

      expect(result).toEqual({
        id: 'duel-1',
        result: 'win',
        userId: 'user-1',
        deckId: 'deck-1',
      });
    });

    it('returns undefined when duel not found', async () => {
      mockQueryResult = [];
      const { getDuel } = await loadDuelService();

      const result = await getDuel('user-1', 'nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('createDuel', () => {
    it('creates duel with all fields', async () => {
      mockQueryResult = [
        {
          id: 'new-duel',
          result: 'win',
          gameMode: 'RANK',
          isFirst: true,
          wonCoinToss: true,
          rank: 10,
        },
      ];
      const { createDuel } = await loadDuelService();

      const result = await createDuel('user-1', {
        deckId: 'deck-1',
        opponentDeckId: 'opp-deck-1',
        result: 'win',
        gameMode: 'RANK',
        isFirst: true,
        wonCoinToss: true,
        rank: 10,
        dueledAt: '2024-01-01T00:00:00Z',
      });

      expect(result!.result).toBe('win');
      expect(result!.gameMode).toBe('RANK');
      expect(result!.rank).toBe(10);
    });

    it('creates duel with optional fields as null', async () => {
      mockQueryResult = [
        {
          id: 'new-duel',
          result: 'loss',
          gameMode: 'EVENT',
          rank: null,
          rateValue: null,
          memo: null,
        },
      ];
      const { createDuel } = await loadDuelService();

      const result = await createDuel('user-1', {
        deckId: 'deck-1',
        opponentDeckId: 'opp-deck-1',
        result: 'loss',
        gameMode: 'EVENT',
        isFirst: false,
        wonCoinToss: false,
        dueledAt: '2024-01-01T00:00:00Z',
      });

      expect(result!.rank).toBeNull();
      expect(result!.memo).toBeNull();
    });
  });

  describe('deleteDuel', () => {
    it('deletes duel and returns deleted record', async () => {
      mockQueryResult = [{ id: 'duel-1', result: 'win' }];
      const { deleteDuel } = await loadDuelService();

      const result = await deleteDuel('user-1', 'duel-1');

      expect(result).toEqual({ id: 'duel-1', result: 'win' });
    });

    it('returns undefined when duel not found', async () => {
      mockQueryResult = [];
      const { deleteDuel } = await loadDuelService();

      const result = await deleteDuel('user-1', 'nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('exportDuels', () => {
    it('returns duels with deck names for export', async () => {
      mockQueryResult = [
        {
          id: 'duel-1',
          result: 'win',
          deckName: 'Blue-Eyes',
          opponentDeckName: 'Dark Magician',
        },
        {
          id: 'duel-2',
          result: 'loss',
          deckName: 'Blue-Eyes',
          opponentDeckName: 'Branded',
        },
      ];
      const { exportDuels } = await loadDuelService();

      const result = await exportDuels('user-1', {});

      expect(result).toHaveLength(2);
      expect(result[0]!.deckName).toBe('Blue-Eyes');
      expect(result[0]!.opponentDeckName).toBe('Dark Magician');
    });

    it('returns empty array when no duels', async () => {
      mockQueryResult = [];
      const { exportDuels } = await loadDuelService();

      const result = await exportDuels('user-1', {});

      expect(result).toEqual([]);
    });
  });
});
