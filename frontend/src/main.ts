import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import vuetify from './plugins/vuetify';
import VueApexCharts from 'vue3-apexcharts';
import App from './App.vue';
import './assets/styles/main.scss';
import './assets/styles/auth.scss';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(vuetify);
app.use(VueApexCharts);

// Setup Supabase auth listener
const authStore = useAuthStore(pinia);
authStore.setupAuthListener();

app.mount('#app');

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
