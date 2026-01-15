import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import vuetify from './plugins/vuetify';
import VueApexCharts from 'vue3-apexcharts';
import App from './App.vue';
import './assets/styles/main.scss';
import './assets/styles/auth.scss';
import { useAuthStore } from './stores/auth';
import { initI18n } from './i18n';

// Supabase URLへのプリコネクトを早期に追加（DNS解決・TCP/TLS接続を事前に確立）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
if (supabaseUrl) {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = supabaseUrl;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);

  // DNS-prefetchも追加（フォールバック）
  const dnsPrefetch = document.createElement('link');
  dnsPrefetch.rel = 'dns-prefetch';
  dnsPrefetch.href = supabaseUrl;
  document.head.appendChild(dnsPrefetch);
}

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(vuetify);
app.use(VueApexCharts);

// Setup Supabase auth listener
const authStore = useAuthStore(pinia);
authStore.setupAuthListener();

// Initialize i18n before mounting
initI18n().then(() => {
  app.mount('#app');
});

// Register service worker
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}
*/
