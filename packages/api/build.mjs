import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(__dirname, '../../api');

await build({
  entryPoints: ['src/vercel-handler.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: resolve(apiDir, '[[...route]].js'),
  target: 'node22',
});
