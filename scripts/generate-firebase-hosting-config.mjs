import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_OUTPUT = 'firebase.hosting.generated.json';
const DEFAULT_PUBLIC_DIR = 'apps/web/dist';
const DEFAULT_MODE = 'spa';

function parseArgs(argv) {
  const args = {
    output: DEFAULT_OUTPUT,
    publicDir: DEFAULT_PUBLIC_DIR,
    mode: DEFAULT_MODE,
    site: 'duel-log',
    service: 'duel-log-api',
    region: 'asia-northeast1',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--output') args.output = argv[i + 1];
    if (arg === '--public-dir') args.publicDir = argv[i + 1];
    if (arg === '--mode') args.mode = argv[i + 1];
    if (arg === '--site') args.site = argv[i + 1];
    if (arg === '--service') args.service = argv[i + 1];
    if (arg === '--region') args.region = argv[i + 1];
  }

  return args;
}

const args = parseArgs(process.argv.slice(2));
const outputPath = path.resolve(args.output);
const publicDir = path.relative(path.dirname(outputPath), path.resolve(args.publicDir)) || '.';

const rewrites =
  args.mode === 'proxy'
    ? [
        {
          source: '**',
          run: {
            serviceId: args.service,
            region: args.region,
          },
        },
      ]
    : [
        {
          source: '/api{,/**}',
          run: {
            serviceId: args.service,
            region: args.region,
          },
        },
        {
          source: '**',
          destination: '/index.html',
        },
      ];

const config = {
  hosting: {
    site: args.site,
    public: publicDir,
    ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
    rewrites,
    headers: [
      {
        source: '/service-worker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache',
          },
        ],
      },
    ],
  },
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
console.log(`[firebase-config] wrote ${path.relative(process.cwd(), outputPath)}`);
