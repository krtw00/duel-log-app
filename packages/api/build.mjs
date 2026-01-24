import { build } from 'esbuild';
import { writeFileSync } from 'fs';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  target: 'node22',
});

// Generate type declaration for the Vercel function entry point
writeFileSync('dist/index.d.ts', `
declare const app: { fetch: (req: Request) => Response | Promise<Response> };
export default app;
export declare function handle(app: any): (req: Request) => Response | Promise<Response>;
`.trim() + '\n');
