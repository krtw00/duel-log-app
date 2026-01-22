import type { CreateDeck, UpdateDeck } from '@duel-log/shared';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { decks } from '../db/schema.js';

export async function listDecks(userId: string) {
  return db.query.decks.findMany({
    where: eq(decks.userId, userId),
    orderBy: (decks, { desc }) => [desc(decks.createdAt)],
  });
}

export async function getDeck(userId: string, deckId: string) {
  return db.query.decks.findFirst({
    where: and(eq(decks.id, deckId), eq(decks.userId, userId)),
  });
}

export async function createDeck(userId: string, data: CreateDeck) {
  const [created] = await db
    .insert(decks)
    .values({ ...data, userId })
    .returning();
  return created;
}

export async function updateDeck(userId: string, deckId: string, data: UpdateDeck) {
  const [updated] = await db
    .update(decks)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .returning();
  return updated;
}

export async function deleteDeck(userId: string, deckId: string) {
  const [deleted] = await db
    .delete(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .returning();
  return deleted;
}

export async function archiveDeck(userId: string, deckId: string) {
  const [updated] = await db
    .update(decks)
    .set({ active: false, updatedAt: new Date() })
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .returning();
  return updated;
}

export async function unarchiveDeck(userId: string, deckId: string) {
  const [updated] = await db
    .update(decks)
    .set({ active: true, updatedAt: new Date() })
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .returning();
  return updated;
}
