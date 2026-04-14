import { createSqlClient } from './postgres-client.mjs';
import { applyPendingMigrations } from './db-migrations.mjs';

async function main() {
  const sql = createSqlClient();

  try {
    const filenames = await applyPendingMigrations(sql);
    if (filenames.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    console.log(`Applied ${filenames.length} migration(s).`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
