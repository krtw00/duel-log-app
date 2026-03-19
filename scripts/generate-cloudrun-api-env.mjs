import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_INPUT = '.vercel/.env.production.local';
const DEFAULT_OUTPUT = '.cloudrun/api.env.yaml';

const REQUIRED_KEYS = ['DATABASE_URL', 'SUPABASE_URL'];
const OPTIONAL_KEYS = [
  'OBS_TOKEN_SECRET',
  'SUPABASE_JWT_SECRET',
  'MAINTENANCE_MODE',
  'MAINTENANCE_BYPASS_KEY',
  'GITHUB_TOKEN',
  'GITHUB_FEEDBACK_REPO',
];

function parseArgs(argv) {
  const args = { input: DEFAULT_INPUT, output: DEFAULT_OUTPUT, stdout: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input') args.input = argv[i + 1];
    if (arg === '--output') args.output = argv[i + 1];
    if (arg === '--stdout') args.stdout = true;
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

function formatYaml(env) {
  const lines = ['NODE_ENV: "production"'];

  for (const key of [...REQUIRED_KEYS, ...OPTIONAL_KEYS]) {
    const value = env[key];
    if (value === undefined || value === '') continue;
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }

  return `${lines.join('\n')}\n`;
}

function assertRequired(env) {
  const missing = REQUIRED_KEYS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const args = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(args.input);
const outputPath = path.resolve(args.output);

const source = await readFile(inputPath, 'utf8');
const env = parseEnvFile(source);
assertRequired(env);

const yaml = formatYaml(env);

if (args.stdout) {
  process.stdout.write(yaml);
} else {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, yaml, 'utf8');
  console.log(`[cloudrun-env] wrote ${path.relative(process.cwd(), outputPath)}`);
}
