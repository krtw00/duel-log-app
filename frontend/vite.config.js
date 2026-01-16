import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vue関連
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // UIフレームワーク
          vuetify: ['vuetify'],
          // チャートライブラリ
          charts: ['chart.js', 'apexcharts', 'vue3-apexcharts'],
          // i18n
          i18n: ['typesafe-i18n'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
    // Docker環境では、ブラウザ→backend(ホスト側:8000) が到達できないケースがある。
    // その場合でも、ブラウザはfrontend(5173)へ接続し、Viteのプロキシ経由でbackendへ中継する。
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  optimizeDeps: {
    include: ['vue3-apexcharts', 'apexcharts'],
  },
});
