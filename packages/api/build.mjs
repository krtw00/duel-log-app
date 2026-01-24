import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  target: 'node22',
  external: ['postgres', '@supabase/supabase-js'],
});
