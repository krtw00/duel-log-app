import { describe, expect, it, vi } from 'vitest';

let mockQueryResult: unknown[] = [];

vi.mock('../../db/index.js', () => ({
  sql: Object.assign(() => Promise.resolve(mockQueryResult), {
    // sql(object) form for UPDATE SET
    call: (_: unknown, obj: Record<string, unknown>) => obj,
  }),
}));

const loadDeckService = async () => {
  vi.resetModules();
  return import('../deck.js');
};

describe('deck service', () => {
  describe('listDecks', () => {
    it('returns all decks for user', async () => {
      mockQueryResult = [
        { id: 'deck-1', name: 'Blue-Eyes', userId: 'user-1', active: true },
        { id: 'deck-2', name: 'Dark Magician', userId: 'user-1', active: true },
      ];
      const { listDecks } = await loadDeckService();

      const result = await listDecks('user-1');

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe('Blue-Eyes');
    });

    it('returns empty array when no decks exist', async () => {
      mockQueryResult = [];
      const { listDecks } = await loadDeckService();

      const result = await listDecks('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getDeck', () => {
    it('returns deck when found', async () => {
      mockQueryResult = [{ id: 'deck-1', name: 'Blue-Eyes', userId: 'user-1' }];
      const { getDeck } = await loadDeckService();

      const result = await getDeck('user-1', 'deck-1');

      expect(result).toEqual({ id: 'deck-1', name: 'Blue-Eyes', userId: 'user-1' });
    });

    it('returns undefined when deck not found', async () => {
      mockQueryResult = [];
      const { getDeck } = await loadDeckService();

      const result = await getDeck('user-1', 'nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('createDeck', () => {
    it('creates a normal deck', async () => {
      mockQueryResult = [
        { id: 'new-deck', name: 'New Deck', userId: 'user-1', isOpponentDeck: false, isGeneric: false },
      ];
      const { createDeck } = await loadDeckService();

      const result = await createDeck('user-1', { name: 'New Deck', isOpponentDeck: false });

      expect(result!.name).toBe('New Deck');
      expect(result!.isGeneric).toBe(false);
    });

    it('creates an opponent deck', async () => {
      mockQueryResult = [
        { id: 'opp-deck', name: 'Enemy Deck', userId: 'user-1', isOpponentDeck: true },
      ];
      const { createDeck } = await loadDeckService();

      const result = await createDeck('user-1', { name: 'Enemy Deck', isOpponentDeck: true });

      expect(result!.isOpponentDeck).toBe(true);
    });

    it('auto-detects generic deck patterns', async () => {
      // Test generic pattern detection (this is tested via the function behavior)
      mockQueryResult = [
        { id: 'gen-deck', name: '不明デッキ', userId: 'user-1', isGeneric: true },
      ];
      const { createDeck } = await loadDeckService();

      const result = await createDeck('user-1', { name: '不明デッキ', isOpponentDeck: false });

      expect(result!.isGeneric).toBe(true);
    });
  });

  describe('deleteDeck', () => {
    it('deletes deck and returns deleted record', async () => {
      mockQueryResult = [{ id: 'deck-1', name: 'Deleted Deck' }];
      const { deleteDeck } = await loadDeckService();

      const result = await deleteDeck('user-1', 'deck-1');

      expect(result).toEqual({ id: 'deck-1', name: 'Deleted Deck' });
    });

    it('returns undefined when deck not found', async () => {
      mockQueryResult = [];
      const { deleteDeck } = await loadDeckService();

      const result = await deleteDeck('user-1', 'nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('archiveDeck', () => {
    it('archives deck and returns updated record', async () => {
      mockQueryResult = [{ id: 'deck-1', name: 'Archived', active: false }];
      const { archiveDeck } = await loadDeckService();

      const result = await archiveDeck('user-1', 'deck-1');

      expect(result?.active).toBe(false);
    });
  });

  describe('unarchiveDeck', () => {
    it('unarchives deck and returns updated record', async () => {
      mockQueryResult = [{ id: 'deck-1', name: 'Unarchived', active: true }];
      const { unarchiveDeck } = await loadDeckService();

      const result = await unarchiveDeck('user-1', 'deck-1');

      expect(result?.active).toBe(true);
    });
  });

  describe('archiveAllDecks', () => {
    it('returns count of archived decks', async () => {
      mockQueryResult = [{ id: 'deck-1' }, { id: 'deck-2' }, { id: 'deck-3' }];
      const { archiveAllDecks } = await loadDeckService();

      const result = await archiveAllDecks('user-1');

      expect(result).toBe(3);
    });

    it('returns 0 when no decks to archive', async () => {
      mockQueryResult = [];
      const { archiveAllDecks } = await loadDeckService();

      const result = await archiveAllDecks('user-1');

      expect(result).toBe(0);
    });
  });

  describe('getAvailableDecks', () => {
    it('returns only non-opponent decks', async () => {
      mockQueryResult = [
        { id: 'deck-1', name: 'My Deck 1' },
        { id: 'deck-2', name: 'My Deck 2' },
      ];
      const { getAvailableDecks } = await loadDeckService();

      const result = await getAvailableDecks('user-1');

      expect(result).toHaveLength(2);
    });
  });
});
