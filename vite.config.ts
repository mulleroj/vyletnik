import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Base './' umožní nasazení na GitHub Pages i Netlify bez úprav cest k assetům.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'trips/*.json', 'fonts/Roboto-Regular.ttf'],
      manifest: {
        name: 'Výletník – školní výlety',
        short_name: 'Výletník',
        description: 'Interaktivní úkoly pro terénní výuku a výlety',
        theme_color: '#0a0a0a',
        background_color: '#e8e0c4',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: './index.html',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2,ttf}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
