import type { UpdateUser } from '@duel-log/shared';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

export async function getUser(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
  });
}

export async function updateUser(userId: string, data: UpdateUser) {
  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}

export async function deleteUser(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}
