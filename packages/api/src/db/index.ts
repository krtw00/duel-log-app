import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Parse URL to check host properly (avoid CodeQL js/incomplete-url-substring-sanitization)
const parseDbUrl = (
  url: string,
): { hostname: string; port: string; isLocal: boolean; isSupabasePooler: boolean } => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const port = parsed.port || (parsed.protocol === 'postgres:' ? '5432' : '');

    // Supabase pooler hosts follow pattern: aws-0-{region}.pooler.supabase.com
    // Use strict regex to match only valid Supabase regions
    const supabasePoolerRegex = /^aws-0-[a-z]+-[a-z]+-\d+\.pooler\.supabase\.com$/;
    const isSupabasePooler = supabasePoolerRegex.test(hostname) && port === '5432';

    return {
      hostname,
      port,
      isLocal:
        hostname === '127.0.0.1' || hostname === 'localhost' || hostname.startsWith('supabase_db_'),
      isSupabasePooler,
    };
  } catch {
    return { hostname: '', port: '', isLocal: false, isSupabasePooler: false };
  }
};

const { isLocal, isSupabasePooler } = parseDbUrl(connectionString);

// Supabase pooler: session mode (5432) → transaction mode (6543) for serverless
const fixedConnectionString = isSupabasePooler
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
