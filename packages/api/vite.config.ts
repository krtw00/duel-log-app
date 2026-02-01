import devServer from '@hono/vite-dev-server';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'vite';

// ルートの.envを読み込んでprocess.envに設定
config({ path: '../../.env' });

export default defineConfig({
  plugins: [
    devServer({
      entry: './src/index.ts',
    }),
  ],
  resolve: {
    alias: {
      '@duel-log/shared': resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 3000,
    allowedHosts: true,
  },
});
