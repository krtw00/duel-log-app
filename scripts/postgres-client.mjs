import { existsSync, readFileSync } from 'node:fs';
import postgres from 'postgres';

function loadEnvFile(envPath = '.env') {
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (process.env[key]) {
      continue;
    }

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile();

function createConnectionOptions(connectionString) {
  const socketMatch = connectionString.match(/[?&]host=([^&]+)/);
  const socketPath = socketMatch?.[1];
  const isLocal = /127\.0\.0\.1|localhost/.test(connectionString);

  const options = {
    transform: postgres.camel,
    ssl: isLocal || socketPath ? false : { rejectUnauthorized: false },
    prepare: false,
    idle_timeout: 20,
    max: 1,
  };

  if (!socketPath) {
    return { connectionString, options };
  }

  const urlWithoutHost = connectionString.replace(/[?&]host=[^&]+/, '').replace(/\?$/, '');
  const parsed = new URL(urlWithoutHost.replace('@/', '@localhost/'));

  return {
    connectionString: null,
    options: {
      ...options,
      host: socketPath,
      port: 5432,
      database: parsed.pathname.slice(1) || 'postgres',
      username: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
    },
  };
}

export function createSqlClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const config = createConnectionOptions(connectionString);
  return config.connectionString
    ? postgres(config.connectionString, config.options)
    : postgres(config.options);
}
