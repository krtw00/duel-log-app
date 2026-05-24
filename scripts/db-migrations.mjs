import { readdir } from 'node:fs/promises';
import path from 'node:path';

const migrationsDir = path.resolve('db', 'migrations');

export async function ensureMigrationTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

export async function getPendingMigrations(sql) {
  const filenames = (await readdir(migrationsDir))
    .filter((filename) => filename.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

  await ensureMigrationTable(sql);

  const appliedRows = await sql`
    SELECT filename FROM schema_migrations
  `;
  const applied = new Set(appliedRows.map((row) => row.filename));

  return filenames.filter((filename) => !applied.has(filename));
}

export async function applyPendingMigrations(sql) {
  const pending = await getPendingMigrations(sql);

  for (const filename of pending) {
    console.log(`Applying ${filename}...`);
    await sql.file(path.join(migrationsDir, filename));
    await sql`
      INSERT INTO schema_migrations (filename)
      VALUES (${filename})
    `;
  }

  return pending;
}
