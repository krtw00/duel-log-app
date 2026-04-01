import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Cloud SQL Auth Proxy: Unix ソケット接続
// DATABASE_URL=postgresql://user:pass@/dbname?host=/cloudsql/...
// postgres ドライバは new URL() で ?host= をパースできないので、オプションで渡す
const socketMatch = connectionString.match(/[?&]host=([^&]+)/);
const socketPath = socketMatch?.[1];

const isLocal = /127\.0\.0\.1|localhost/.test(connectionString);

const options: Parameters<typeof postgres>[1] = {
  transform: postgres.camel,
  ssl: isLocal || socketPath ? false : { rejectUnauthorized: false },
  prepare: false,
  idle_timeout: 20,
  max: 10,
};

let sql: ReturnType<typeof postgres>;

if (socketPath) {
  // Cloud SQL Auth Proxy: URL からクレデンシャルとDB名を抽出してオプションで渡す
  // postgresql://user:pass@/dbname → new URL() は host なしでパース不可なので dummy host を挿入
  const urlWithoutHost = connectionString.replace(/[?&]host=[^&]+/, '').replace(/\?$/, '');
  const parsed = new URL(urlWithoutHost.replace('@/', '@localhost/'));
  sql = postgres({
    ...options,
    host: socketPath,
    port: 5432,
    database: parsed.pathname.slice(1) || 'postgres',
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  });
} else {
  sql = postgres(connectionString, options);
}

let oauthStateTablePromise: Promise<void> | null = null;

export function ensureOAuthStateTable() {
  if (!oauthStateTablePromise) {
    oauthStateTablePromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS oauth_states (
          id UUID PRIMARY KEY,
          state TEXT NOT NULL UNIQUE,
          code_verifier TEXT,
          provider TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          expires_at TIMESTAMPTZ NOT NULL
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at
        ON oauth_states (expires_at)
      `;
    })().catch((error) => {
      oauthStateTablePromise = null;
      throw error;
    });
  }

  return oauthStateTablePromise;
}

export { sql };
