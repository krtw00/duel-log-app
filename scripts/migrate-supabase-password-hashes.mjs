import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Required environment variable: DATABASE_URL');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: candidates } = await client.query(`
      SELECT count(*)::int AS count
      FROM public.users u
      JOIN auth.users au ON au.email = u.email
      WHERE au.encrypted_password IS NOT NULL
        AND (u.password_hash IS DISTINCT FROM au.encrypted_password)
    `);

    const { rowCount } = await client.query(`
      UPDATE public.users AS u
      SET password_hash = au.encrypted_password,
          updated_at = now()
      FROM auth.users AS au
      WHERE au.email = u.email
        AND au.encrypted_password IS NOT NULL
        AND (u.password_hash IS DISTINCT FROM au.encrypted_password)
    `);

    const { rows: missing } = await client.query(`
      SELECT count(*)::int AS count
      FROM public.users u
      LEFT JOIN auth.users au ON au.email = u.email
      WHERE u.password_hash IS NULL
        AND au.id IS NULL
    `);

    await client.query('COMMIT');

    console.log(`Matched users: ${candidates[0]?.count ?? 0}`);
    console.log(`Updated password hashes: ${rowCount ?? 0}`);
    console.log(`Users without auth.users match: ${missing[0]?.count ?? 0}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Password hash migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
