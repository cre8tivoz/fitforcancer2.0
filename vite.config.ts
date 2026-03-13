import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        devOptions: {
          enabled: false,
        },
        includeAssets: ['logo.png', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'Fit For Cancer',
          short_name: 'FitForCancer',
          description: 'Evidence-based exercise and nutrition support for cancer recovery.',
          theme_color: '#00D1FF',
          icons: [
            {
              src: 'logo.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'logo.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/picsum\.photos\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                networkTimeoutSeconds: 3,
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('react-markdown') || id.includes('remark-gfm') || id.includes('mdast-util') || id.includes('micromark')) {
              return 'markdown';
            }

            if (id.includes('motion') || id.includes('framer-motion')) {
              return 'motion';
            }

            if (id.includes('lucide-react')) {
              return 'icons';
            }
          },
        },
      },
    },
  };
});
