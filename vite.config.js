import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main:              resolve(__dirname, 'index.html'),
        en:                resolve(__dirname, 'en/index.html'),
        mentionsLegales:   resolve(__dirname, 'mentions-legales.html'),
        politiqueConf:     resolve(__dirname, 'politique-confidentialite.html'),
        abonnements:       resolve(__dirname, 'abonnements.html'),
        notFound:          resolve(__dirname, '404.html'),
        enLegal:           resolve(__dirname, 'en/legal-notices.html'),
        enPrivacy:         resolve(__dirname, 'en/privacy-policy.html'),
        enSubscriptions:   resolve(__dirname, 'en/subscriptions.html'),
        enNotFound:        resolve(__dirname, 'en/404.html'),
      },
    },
  },
});
