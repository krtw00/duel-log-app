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

const customLightTheme = {
  dark: false,
  colors: {
    background: '#f5f5f5',
    surface: '#ffffff',
    'surface-variant': '#e3f2fd',
    primary: '#0288d1',
    secondary: '#7b1fa2',
    accent: '#d81b60',
    error: '#f44336',
    info: '#2196f3',
    success: '#4caf50',
    warning: '#ff9800',
    'on-background': '#1a1a1a',
    'on-surface': '#1a1a1a',
  },
};

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'customDarkTheme',
    themes: {
      customDarkTheme,
      customLightTheme,
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

export default vuetify;
