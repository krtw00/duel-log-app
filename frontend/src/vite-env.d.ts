/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // 他の環境変数をここに追加できます
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// vue3-apexcharts のモジュール宣言
declare module 'vue3-apexcharts' {
  import { Plugin } from 'vue';
  const VueApexCharts: Plugin;
  export default VueApexCharts;
}
