import type { CreateDeck, UpdateDeck } from '@duel-log/shared';
import { sql } from '../db/index.js';
import type { DeckRow } from '../db/types.js';

export async function listDecks(userId: string) {
  return sql<DeckRow[]>`
    SELECT * FROM decks WHERE user_id = ${userId} ORDER BY created_at DESC
  `;
}

export async function getDeck(userId: string, deckId: string) {
  const [deck] = await sql<DeckRow[]>`
    SELECT * FROM decks WHERE id = ${deckId} AND user_id = ${userId}
  `;
  return deck;
}

/** Generic deck name patterns (case-insensitive substring match) */
const GENERIC_DECK_PATTERNS = [
  '不明',
  'その他',
  'わからない',
  '未確認',
  'unknown',
  'other',
  '汎用',
  'generic',
] as const;

function matchesGenericPattern(name: string): boolean {
  const lower = name.toLowerCase();
  return GENERIC_DECK_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

export async function createDeck(userId: string, data: CreateDeck) {
  const isGeneric = matchesGenericPattern(data.name);
  const [created] = await sql<DeckRow[]>`
    INSERT INTO decks (user_id, name, is_opponent_deck, is_generic)
    VALUES (${userId}, ${data.name}, ${data.isOpponentDeck ?? false}, ${isGeneric})
    RETURNING *
  `;
  return created;
}

export async function updateDeck(userId: string, deckId: string, data: UpdateDeck) {
  const values: Record<string, unknown> = {};
  if (data.name !== undefined) {
    values.name = data.name;
    // Auto-detect generic pattern on name change (unless explicitly overridden)
    if (data.isGeneric === undefined) {
      values.is_generic = matchesGenericPattern(data.name);
    }
  }
  if (data.isGeneric !== undefined) {
    values.is_generic = data.isGeneric;
  }

  if (Object.keys(values).length === 0) return null;

  const [updated] = await sql<DeckRow[]>`
    UPDATE decks
    SET ${sql(values)}, updated_at = now()
    WHERE id = ${deckId} AND user_id = ${userId}
    RETURNING *
  `;
  return updated;
}

export async function deleteDeck(userId: string, deckId: string) {
  const [deleted] = await sql<DeckRow[]>`
    DELETE FROM decks WHERE id = ${deckId} AND user_id = ${userId} RETURNING *
  `;
  return deleted;
}

export async function archiveDeck(userId: string, deckId: string) {
  const [updated] = await sql<DeckRow[]>`
    UPDATE decks SET active = false, updated_at = now()
    WHERE id = ${deckId} AND user_id = ${userId}
    RETURNING *
  `;
  return updated;
}

export async function unarchiveDeck(userId: string, deckId: string) {
  const [updated] = await sql<DeckRow[]>`
    UPDATE decks SET active = true, updated_at = now()
    WHERE id = ${deckId} AND user_id = ${userId}
    RETURNING *
  `;
  return updated;
}

export async function archiveAllDecks(userId: string) {
  const result = await sql<DeckRow[]>`
    UPDATE decks SET active = false, updated_at = now()
    WHERE user_id = ${userId} AND active = true
    RETURNING *
  `;
  return result.length;
}

export async function getAvailableDecks(userId: string) {
  return sql<{ id: string; name: string }[]>`
    SELECT id, name FROM decks
    WHERE user_id = ${userId} AND is_opponent_deck = false
  `;
}
