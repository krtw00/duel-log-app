import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_INPUT = '.vercel/.env.production.local';
const DEFAULT_OUTPUT = '.firebase/hosting.production.env';

const REQUIRED_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const OPTIONAL_KEYS = [
  'VITE_MAINTENANCE_MODE',
  'VITE_ADMIN_EMAILS',
  'VITE_MAINTENANCE_BYPASS_KEY',
  'VITE_PRIMARY_WEB_URL',
  'VITE_LEGACY_WEB_HOSTS',
  'VITE_ENABLE_LEGACY_DOMAIN_REDIRECT',
  'VITE_LEGACY_DOMAIN_REDIRECT_DELAY_SECONDS',
  'VITE_LEGACY_DOMAIN_REDIRECT_UNTIL',
];

const DEFAULTS = {
  VITE_API_BASE_URL: '/api',
  VITE_PRIMARY_WEB_URL: 'https://duel-log.codenica.dev',
  VITE_LEGACY_WEB_HOSTS: 'duel-log-app.vercel.app',
};

function parseArgs(argv) {
  const args = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    stdout: false,
    apiBaseUrl: DEFAULTS.VITE_API_BASE_URL,
    primaryWebUrl: DEFAULTS.VITE_PRIMARY_WEB_URL,
    legacyWebHosts: DEFAULTS.VITE_LEGACY_WEB_HOSTS,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input') args.input = argv[i + 1];
    if (arg === '--output') args.output = argv[i + 1];
    if (arg === '--stdout') args.stdout = true;
    if (arg === '--api-base-url') args.apiBaseUrl = argv[i + 1];
    if (arg === '--primary-web-url') args.primaryWebUrl = argv[i + 1];
    if (arg === '--legacy-web-hosts') args.legacyWebHosts = argv[i + 1];
  }

  return args;
}

function parseEnvFile(contents) {
  const env = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator <= 0) continue;

    const key = line.slice(0, separator);
    let value = line.slice(separator + 1);

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value.replace(/\\n/g, '\n');
  }

  return env;
}

function assertRequired(env) {
  const missing = REQUIRED_KEYS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function formatEnv(env) {
  const orderedKeys = [
    ...REQUIRED_KEYS,
    'VITE_API_BASE_URL',
    'VITE_PRIMARY_WEB_URL',
    'VITE_LEGACY_WEB_HOSTS',
    ...OPTIONAL_KEYS.filter(
      (key) => !['VITE_PRIMARY_WEB_URL', 'VITE_LEGACY_WEB_HOSTS'].includes(key),
    ),
  ];

  const lines = [];
  for (const key of orderedKeys) {
    const value = env[key];
    if (value === undefined || value === '') continue;
    lines.push(`${key}=${JSON.stringify(value)}`);
  }

  return `${lines.join('\n')}\n`;
}

const args = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(args.input);
const outputPath = path.resolve(args.output);

const source = await readFile(inputPath, 'utf8');
const env = parseEnvFile(source);

env.VITE_API_BASE_URL = args.apiBaseUrl || env.VITE_API_BASE_URL || DEFAULTS.VITE_API_BASE_URL;
env.VITE_PRIMARY_WEB_URL =
  args.primaryWebUrl || env.VITE_PRIMARY_WEB_URL || DEFAULTS.VITE_PRIMARY_WEB_URL;
env.VITE_LEGACY_WEB_HOSTS =
  args.legacyWebHosts ?? env.VITE_LEGACY_WEB_HOSTS ?? DEFAULTS.VITE_LEGACY_WEB_HOSTS;

assertRequired(env);

const output = formatEnv(env);

if (args.stdout) {
  process.stdout.write(output);
} else {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, 'utf8');
  console.log(`[firebase-env] wrote ${path.relative(process.cwd(), outputPath)}`);
}
