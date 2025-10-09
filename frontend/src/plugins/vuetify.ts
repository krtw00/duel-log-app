import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

const customDarkTheme = {
  dark: true,
  colors: {
    background: '#0a0e27',
    surface: '#12162e',
    'surface-variant': '#1a1f3a',
    primary: '#00d9ff',
    secondary: '#b536ff',
    accent: '#ff2d95',
    error: '#ff3d71',
    info: '#0095ff',
    success: '#00e676',
    warning: '#ffaa00',
    'on-background': '#e4e7ec',
    'on-surface': '#e4e7ec',
  },
};

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'customDarkTheme',
    themes: {
      customDarkTheme,
    },
  },
  defaults: {
    VBtn: {
      style: 'text-transform: none;',
      elevation: 0,
    },
    VCard: {
      elevation: 0,
    },
  },
});
