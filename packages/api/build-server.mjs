import { build } from 'esbuild';
import { resolve } from 'path';

await build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve('dist/server.js'),
  target: 'node22',
});
