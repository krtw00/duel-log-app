import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// トランザクションモード(6543)はpgbouncerのprepare非対応のためprepare: false必須
// 注: 環境変数のDATABASE_URLをそのまま使用（自動ポート変換は行わない）
export const sql = postgres(connectionString, {
  transform: postgres.camel,
  ssl: { rejectUnauthorized: false },
  prepare: false,
  idle_timeout: 20,
  max: 3,
});
