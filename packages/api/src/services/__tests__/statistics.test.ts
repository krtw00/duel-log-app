import { describe, expect, it, vi } from 'vitest';

// シンプルなモック: 各テストでモック結果を直接設定
let mockQueryResult: unknown[] = [];

vi.mock('../../db/index.js', () => ({
  sql: () => Promise.resolve(mockQueryResult),
}));

vi.mock('../../db/helpers.js', () => ({
  andWhere: () => 'mocked_where',
  sql: () => Promise.resolve(mockQueryResult),
}));

// サービスを動的にインポートしてモックが適用されるようにする
const loadStatistics = async () => {
  // キャッシュをクリアして再インポート
  vi.resetModules();
  return import('../statistics.js');
};

describe('statistics service', () => {
  describe('getStreaks', () => {
    it('returns default values when no duels exist', async () => {
      mockQueryResult = [
        {
          currentStreak: 0,
          currentStreakType: null,
          longestWinStreak: 0,
          longestLossStreak: 0,
        },
      ];
      const { getStreaks } = await loadStatistics();

      const result = await getStreaks('user-123', {});

      expect(result).toEqual({
        currentStreak: 0,
        currentStreakType: null,
        longestWinStreak: 0,
        longestLossStreak: 0,
      });
    });

    it('returns correct streak data for winning streak', async () => {
      mockQueryResult = [
        {
          currentStreak: 5,
          currentStreakType: 'win',
          longestWinStreak: 7,
          longestLossStreak: 3,
        },
      ];
      const { getStreaks } = await loadStatistics();

      const result = await getStreaks('user-123', {});

      expect(result).toEqual({
        currentStreak: 5,
        currentStreakType: 'win',
        longestWinStreak: 7,
        longestLossStreak: 3,
      });
    });

    it('returns correct streak data for losing streak', async () => {
      mockQueryResult = [
        {
          currentStreak: 2,
          currentStreakType: 'loss',
          longestWinStreak: 4,
          longestLossStreak: 5,
        },
      ];
      const { getStreaks } = await loadStatistics();

      const result = await getStreaks('user-123', {});

      expect(result).toEqual({
        currentStreak: 2,
        currentStreakType: 'loss',
        longestWinStreak: 4,
        longestLossStreak: 5,
      });
    });

    it('handles empty result from database', async () => {
      mockQueryResult = [];
      const { getStreaks } = await loadStatistics();

      const result = await getStreaks('user-123', {});

      expect(result).toEqual({
        currentStreak: 0,
        currentStreakType: null,
        longestWinStreak: 0,
        longestLossStreak: 0,
      });
    });
  });

  describe('getOverview', () => {
    it('returns correct overview statistics', async () => {
      mockQueryResult = [
        {
          totalDuels: 100,
          wins: 60,
          losses: 40,
          winRate: 0.6,
          firstRate: 0.52,
          firstWinRate: 0.65,
          secondWinRate: 0.55,
          coinTossWinRate: 0.5,
        },
      ];
      const { getOverview } = await loadStatistics();

      const result = await getOverview('user-123', {});

      expect(result).toEqual({
        totalDuels: 100,
        wins: 60,
        losses: 40,
        winRate: 0.6,
        firstRate: 0.52,
        firstWinRate: 0.65,
        secondWinRate: 0.55,
        coinTossWinRate: 0.5,
      });
    });

    it('returns default values when no duels exist', async () => {
      mockQueryResult = [undefined];
      const { getOverview } = await loadStatistics();

      const result = await getOverview('user-123', {});

      expect(result).toEqual({
        totalDuels: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        firstRate: 0,
        firstWinRate: 0,
        secondWinRate: 0,
        coinTossWinRate: 0,
        playMistakes: 0,
        playMistakeRate: 0,
        playMistakeWinRate: 0,
      });
    });
  });

  describe('getWinRates', () => {
    it('returns win rates per deck', async () => {
      mockQueryResult = [
        {
          deckId: 'deck-1',
          deckName: 'Blue-Eyes',
          totalDuels: 50,
          wins: 30,
          losses: 20,
          winRate: 0.6,
        },
        {
          deckId: 'deck-2',
          deckName: 'Dark Magician',
          totalDuels: 30,
          wins: 20,
          losses: 10,
          winRate: 0.667,
        },
      ];
      const { getWinRates } = await loadStatistics();

      const result = await getWinRates('user-123', {});

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        deckId: 'deck-1',
        deckName: 'Blue-Eyes',
        totalDuels: 50,
        wins: 30,
        losses: 20,
        winRate: 0.6,
      });
    });

    it('returns empty array when no decks have duels', async () => {
      mockQueryResult = [];
      const { getWinRates } = await loadStatistics();

      const result = await getWinRates('user-123', {});

      expect(result).toEqual([]);
    });
  });
});
