import path from 'node:path';
import { createSqlClient } from './postgres-client.mjs';

const seedPath = path.resolve('db', 'seed.sql');

async function main() {
  const sql = createSqlClient();

  try {
    console.log(`Seeding ${seedPath}...`);
    await sql.file(seedPath);
    console.log('Seed completed.');
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
