import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/index.cjs',
  target: 'node22',
  footer: {
    js: 'module.exports = index_default;',
  },
});
