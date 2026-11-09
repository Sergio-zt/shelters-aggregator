import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import uk from './src/i18n/uk.json';
const escapeHtml = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'localized-default-document',
      transformIndexHtml: (html) =>
        html
          .replace('__APP_TITLE__', escapeHtml(uk['app.pageTitle']))
          .replace('__APP_DESCRIPTION__', escapeHtml(uk['app.description'])),
    },
  ],
});
