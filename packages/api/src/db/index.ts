import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Supabase pooler: session mode (5432) → transaction mode (6543) for serverless
const fixedConnectionString = connectionString.includes('pooler.supabase.com:5432')
  ? connectionString.replace(':5432/', ':6543/')
  : connectionString;

export const sql = postgres(fixedConnectionString, {
  transform: postgres.camel,
  ssl: { rejectUnauthorized: false },
  prepare: false,
  idle_timeout: 20,
  max: 3,
});
