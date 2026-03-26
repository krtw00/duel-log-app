import { sql } from '../db/index.js';
import type { UserHandtrapCardRow } from '../db/types.js';

function normalizeHandtrapName(name: string) {
  return name.trim();
}

export function normalizeHandtrapCardId(cardId: string) {
  return cardId.startsWith('custom-') ? cardId.slice('custom-'.length) : cardId;
}

export async function listUserHandtrapCards(userId: string) {
  return sql<UserHandtrapCardRow[]>`
    SELECT * FROM user_handtrap_cards
    WHERE user_id = ${userId}
    ORDER BY created_at DESC, name ASC
  `;
}

export async function createUserHandtrapCard(userId: string, name: string) {
  const normalizedName = normalizeHandtrapName(name);

  const [created] = await sql<UserHandtrapCardRow[]>`
    INSERT INTO user_handtrap_cards (user_id, name)
    VALUES (${userId}, ${normalizedName})
    ON CONFLICT (user_id, name)
    DO UPDATE SET name = EXCLUDED.name
    RETURNING *
  `;

  return created;
}

export async function deleteUserHandtrapCard(userId: string, cardId: string) {
  const normalizedCardId = normalizeHandtrapCardId(cardId);

  const [deleted] = await sql<UserHandtrapCardRow[]>`
    DELETE FROM user_handtrap_cards
    WHERE id = ${normalizedCardId} AND user_id = ${userId}
    RETURNING *
  `;

  return deleted;
}
