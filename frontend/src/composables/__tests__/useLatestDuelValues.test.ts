import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLatestDuelValues } from '../useLatestDuelValues';
import { api } from '@/services/api';
import type { Deck } from '@/types';

vi.mock('@/services/api');

describe('useLatestDuelValues', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('fetchLatestValues', () => {
    it('最新値をAPIから取得する', async () => {
      const { fetchLatestValues, latestValues } = useLatestDuelValues();
      const mockData = {
        RANK: { value: 20, deck_id: 1, opponent_deck_id: 2 },
        RATE: { value: 1600, deck_id: 3, opponent_deck_id: 4 },
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockData });

      await fetchLatestValues();

      expect(api.get).toHaveBeenCalledWith('/duels/latest-values/');
      expect(latestValues.value).toEqual(mockData);
    });

    it('エラー時は空オブジェクトをセット', async () => {
      const { fetchLatestValues, latestValues } = useLatestDuelValues();

      vi.mocked(api.get).mockRejectedValue(new Error('API Error'));

      await fetchLatestValues();

      expect(latestValues.value).toEqual({});
    });
  });

  describe('applyLatestValuesToGameMode', () => {
    it('RANKモードで最新値を適用', () => {
      const { latestValues, applyLatestValuesToGameMode } = useLatestDuelValues();
      latestValues.value = {
        RANK: { value: 15, deck_id: 1, opponent_deck_id: 2 },
      };
      const myDecks: Deck[] = [
        { id: 1, name: 'デッキA', is_opponent: false, active: true },
        { id: 3, name: 'デッキB', is_opponent: false, active: true },
      ];
      const opponentDecks: Deck[] = [
        { id: 2, name: '相手デッキA', is_opponent: true, active: true },
      ];

      const result = applyLatestValuesToGameMode('RANK', myDecks, opponentDecks);

      expect(result.rank).toBe(15);
      expect(result.selectedMyDeck).toMatchObject({ id: 1, name: 'デッキA', is_opponent: false });
      expect(result.selectedOpponentDeck).toMatchObject({
        id: 2,
        name: '相手デッキA',
        is_opponent: true,
      });
      expect(result.rate_value).toBeUndefined();
      expect(result.dc_value).toBeUndefined();
    });

    it('RATEモードで最新値を適用', () => {
      const { latestValues, applyLatestValuesToGameMode } = useLatestDuelValues();
      latestValues.value = {
        RATE: { value: 1700, deck_id: 2, opponent_deck_id: 3 },
      };
      const myDecks: Deck[] = [{ id: 2, name: 'デッキC', is_opponent: false, active: true }];
      const opponentDecks: Deck[] = [
        { id: 3, name: '相手デッキB', is_opponent: true, active: true },
      ];

      const result = applyLatestValuesToGameMode('RATE', myDecks, opponentDecks);

      expect(result.rate_value).toBe(1700);
      expect(result.selectedMyDeck).toMatchObject({ id: 2, name: 'デッキC', is_opponent: false });
      expect(result.selectedOpponentDeck).toMatchObject({
        id: 3,
        name: '相手デッキB',
        is_opponent: true,
      });
      expect(result.rank).toBeUndefined();
    });

    it('DCモードで最新値を適用', () => {
      const { latestValues, applyLatestValuesToGameMode } = useLatestDuelValues();
      latestValues.value = {
        DC: { value: 5, deck_id: 4, opponent_deck_id: 5 },
      };
      const myDecks: Deck[] = [{ id: 4, name: 'デッキD', is_opponent: false, active: true }];
      const opponentDecks: Deck[] = [
        { id: 5, name: '相手デッキC', is_opponent: true, active: true },
      ];

      const result = applyLatestValuesToGameMode('DC', myDecks, opponentDecks);

      expect(result.dc_value).toBe(5);
      expect(result.selectedMyDeck).toMatchObject({ id: 4, name: 'デッキD', is_opponent: false });
      expect(result.selectedOpponentDeck).toMatchObject({
        id: 5,
        name: '相手デッキC',
        is_opponent: true,
      });
    });

    it('最新値がない場合はデフォルト値を使用（RANK）', () => {
      const { latestValues, applyLatestValuesToGameMode, DEFAULT_RANK } = useLatestDuelValues();
      latestValues.value = {};
      const myDecks: Deck[] = [];
      const opponentDecks: Deck[] = [];

      const result = applyLatestValuesToGameMode('RANK', myDecks, opponentDecks);

      expect(result.rank).toBe(DEFAULT_RANK);
      expect(result.selectedMyDeck).toBeNull();
      expect(result.selectedOpponentDeck).toBeNull();
    });

    it('最新値がない場合はデフォルト値を使用（RATE）', () => {
      const { latestValues, applyLatestValuesToGameMode, DEFAULT_RATE } = useLatestDuelValues();
      latestValues.value = {};
      const myDecks: Deck[] = [];
      const opponentDecks: Deck[] = [];

      const result = applyLatestValuesToGameMode('RATE', myDecks, opponentDecks);

      expect(result.rate_value).toBe(DEFAULT_RATE);
      expect(result.selectedMyDeck).toBeNull();
      expect(result.selectedOpponentDeck).toBeNull();
    });

    it('最新値がない場合はデフォルト値を使用（DC）', () => {
      const { latestValues, applyLatestValuesToGameMode, DEFAULT_DC } = useLatestDuelValues();
      latestValues.value = {};
      const myDecks: Deck[] = [];
      const opponentDecks: Deck[] = [];

      const result = applyLatestValuesToGameMode('DC', myDecks, opponentDecks);

      expect(result.dc_value).toBe(DEFAULT_DC);
      expect(result.selectedMyDeck).toBeNull();
      expect(result.selectedOpponentDeck).toBeNull();
    });

    it('デッキが見つからない場合はnull', () => {
      const { latestValues, applyLatestValuesToGameMode } = useLatestDuelValues();
      latestValues.value = {
        RANK: { value: 15, deck_id: 999, opponent_deck_id: 888 },
      };
      const myDecks: Deck[] = [{ id: 1, name: 'デッキA', is_opponent: false, active: true }];
      const opponentDecks: Deck[] = [
        { id: 2, name: '相手デッキA', is_opponent: true, active: true },
      ];

      const result = applyLatestValuesToGameMode('RANK', myDecks, opponentDecks);

      expect(result.selectedMyDeck).toBeNull();
      expect(result.selectedOpponentDeck).toBeNull();
    });
  });
});
