import { sql } from '../db/index.js';

export async function hashPassword(password: string): Promise<string> {
  const [row] = await sql<{ passwordHash: string }[]>`
    SELECT crypt(${password}, gen_salt('bf', 10)) AS password_hash
  `;

  if (!row?.passwordHash) {
    throw new Error('Failed to hash password');
  }

  return row.passwordHash;
}

export async function passwordMatches(password: string, passwordHash: string): Promise<boolean> {
  const [row] = await sql<{ matches: boolean }[]>`
    SELECT crypt(${password}, ${passwordHash}) = ${passwordHash} AS matches
  `;
  return row?.matches ?? false;
}
