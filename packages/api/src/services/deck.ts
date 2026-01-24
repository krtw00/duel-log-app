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

export async function createDeck(userId: string, data: CreateDeck) {
  const [created] = await sql<DeckRow[]>`
    INSERT INTO decks (user_id, name, is_opponent_deck)
    VALUES (${userId}, ${data.name}, ${data.isOpponentDeck ?? false})
    RETURNING *
  `;
  return created;
}

export async function updateDeck(userId: string, deckId: string, data: UpdateDeck) {
  const values: Record<string, unknown> = {};
  if (data.name !== undefined) values.name = data.name;

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
