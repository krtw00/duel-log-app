import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDeckResolution } from '../useDeckResolution';
import { api } from '@/services/api';
import type { Deck } from '@/types';

vi.mock('@/services/api');

describe('useDeckResolution', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('createDeckIfNeeded', () => {
    it('既存のデッキが存在する場合はデッキを返す', async () => {
      const { createDeckIfNeeded } = useDeckResolution();
      const existingDecks: Deck[] = [
        { id: 1, name: 'テストデッキ', is_opponent: false, active: true },
        { id: 2, name: '相手デッキ', is_opponent: true, active: true },
      ];

      const result = await createDeckIfNeeded('テストデッキ', false, existingDecks);

      expect(result).toEqual(existingDecks[0]);
      expect(api.post).not.toHaveBeenCalled();
    });

    it('新しいデッキを作成する', async () => {
      const { createDeckIfNeeded } = useDeckResolution();
      const existingDecks: Deck[] = [];
      const newDeck = { id: 3, name: '新デッキ', is_opponent: false };

      vi.mocked(api.post).mockResolvedValue({ data: newDeck });

      const result = await createDeckIfNeeded('新デッキ', false, existingDecks);

      expect(result).toEqual(newDeck);
      expect(api.post).toHaveBeenCalledWith('/decks/', {
        name: '新デッキ',
        is_opponent: false,
      });
    });

    it('空文字列の場合はnullを返す', async () => {
      const { createDeckIfNeeded } = useDeckResolution();
      const existingDecks: Deck[] = [];

      const result = await createDeckIfNeeded('', false, existingDecks);

      expect(result).toBeNull();
      expect(api.post).not.toHaveBeenCalled();
    });

    it('重複エラーの場合は既存デッキIDを返す', async () => {
      const { createDeckIfNeeded } = useDeckResolution();
      const existingDecks: Deck[] = [
        { id: 1, name: '既存デッキ', is_opponent: false, active: true },
      ];

      vi.mocked(api.post).mockRejectedValue({ response: { status: 400 } });

      const result = await createDeckIfNeeded('既存デッキ', false, existingDecks);

      expect(result).toEqual(existingDecks[0]);
    });

    it('重複エラー時に取得したデッキからIDを解決する', async () => {
      const { createDeckIfNeeded } = useDeckResolution();
      const existingDecks: Deck[] = [];
      const decksResponse: Deck[] = [
        { id: 5, name: 'イベントデッキ', is_opponent: false, active: true },
      ];

      vi.mocked(api.post).mockRejectedValue({ response: { status: 400 } });
      vi.mocked(api.get).mockResolvedValue({ data: decksResponse });

      const result = await createDeckIfNeeded('イベントデッキ', false, existingDecks);

      expect(result).toEqual(decksResponse[0]);
      expect(api.get).toHaveBeenCalledWith('/decks/', {
        params: { is_opponent: false, active_only: false },
      });
    });
  });

  describe('resolveDeckId', () => {
    it('Deckオブジェクトの場合はそのまま返す', async () => {
      const { resolveDeckId } = useDeckResolution();
      const deck: Deck = { id: 5, name: 'デッキ', is_opponent: false, active: true };
      const existingDecks: Deck[] = [];

      const result = await resolveDeckId(deck, false, existingDecks);

      expect(result).toEqual(deck);
    });

    it('文字列の場合は新しいデッキを作成', async () => {
      const { resolveDeckId } = useDeckResolution();
      const existingDecks: Deck[] = [];
      const newDeck = { id: 10, name: '新規', is_opponent: true };

      vi.mocked(api.post).mockResolvedValue({ data: newDeck });

      const result = await resolveDeckId('新規', true, existingDecks);

      expect(result).toEqual(newDeck);
      expect(api.post).toHaveBeenCalledWith('/decks/', {
        name: '新規',
        is_opponent: true,
      });
    });

    it('nullの場合はnullを返す', async () => {
      const { resolveDeckId } = useDeckResolution();
      const existingDecks: Deck[] = [];

      const result = await resolveDeckId(null, false, existingDecks);

      expect(result).toBeNull();
    });

    it('空文字列の場合はnullを返す', async () => {
      const { resolveDeckId } = useDeckResolution();
      const existingDecks: Deck[] = [];

      const result = await resolveDeckId('', false, existingDecks);

      expect(result).toBeNull();
    });
  });
});
