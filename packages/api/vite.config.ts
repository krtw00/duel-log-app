import devServer from '@hono/vite-dev-server';
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
  server: {
    port: 3000,
    allowedHosts: true,
  },
});
