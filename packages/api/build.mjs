import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: resolve(__dirname, '../../api/_handler.cjs'),
  target: 'node22',
  footer: {
    js: 'module.exports = index_default;',
  },
});
