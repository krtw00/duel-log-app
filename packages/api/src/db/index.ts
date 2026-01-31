import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Parse URL to check host properly (avoid CodeQL js/incomplete-url-substring-sanitization)
const parseDbUrl = (url: string): { host: string; isLocal: boolean } => {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.host,
      isLocal:
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname === 'localhost' ||
        parsed.hostname.includes('supabase_db_'),
    };
  } catch {
    return { host: '', isLocal: false };
  }
};

const { host, isLocal } = parseDbUrl(connectionString);

// Supabase pooler: session mode (5432) → transaction mode (6543) for serverless
const fixedConnectionString =
  host === 'aws-0-ap-northeast-1.pooler.supabase.com:5432' ||
  host.endsWith('.pooler.supabase.com:5432')
    ? connectionString.replace(':5432/', ':6543/')
    : connectionString;

// Local Supabase doesn't use SSL
const isLocalDb = isLocal;

export const sql = postgres(fixedConnectionString, {
  transform: postgres.camel,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
  prepare: false,
  idle_timeout: 20,
  max: 3,
});
