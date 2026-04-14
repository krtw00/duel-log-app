import path from 'node:path';
import { createSqlClient } from './postgres-client.mjs';
import { applyPendingMigrations } from './db-migrations.mjs';

async function main() {
  const sql = createSqlClient();

  try {
    console.log('Resetting public schema...');
    await sql`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
    `.simple();

    await applyPendingMigrations(sql);

    console.log('Seeding local data...');
    await sql.file(path.resolve('db', 'seed.sql'));

    console.log('Database reset completed.');
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
