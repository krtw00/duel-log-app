import { randomUUID } from 'node:crypto';
import { ensureOAuthStateTable, sql } from '../db/index.js';
import type { OAuthStateRow } from '../db/types.js';

export type OAuthProvider = 'google' | 'discord' | 'github';

type CreateOAuthStateInput = {
  state: string;
  provider: OAuthProvider;
  codeVerifier?: string;
};

export async function createOAuthState({
  state,
  provider,
  codeVerifier,
}: CreateOAuthStateInput) {
  await ensureOAuthStateTable();

  const [created] = await sql<OAuthStateRow[]>`
    INSERT INTO oauth_states (id, state, code_verifier, provider, expires_at)
    VALUES (
      ${randomUUID()},
      ${state},
      ${codeVerifier ?? null},
      ${provider},
      now() + interval '10 minutes'
    )
    RETURNING *
  `;

  return created;
}

export async function cleanupExpiredOAuthStates() {
  await ensureOAuthStateTable();

  const deleted = await sql<Pick<OAuthStateRow, 'id'>[]>`
    DELETE FROM oauth_states
    WHERE expires_at <= now()
    RETURNING id
  `;

  return deleted.length;
}

export async function consumeOAuthState(state: string, provider: OAuthProvider) {
  await ensureOAuthStateTable();

  const [deleted] = await sql<OAuthStateRow[]>`
    DELETE FROM oauth_states
    WHERE state = ${state}
      AND provider = ${provider}
      AND expires_at > now()
    RETURNING *
  `;

  return deleted;
}
