import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// Vercel adapter for production
import vercel from '@astrojs/vercel/static';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  output: 'static',
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
  build: {
    assets: 'assets',
  },
  server: {
    port: 4321,
    host: true,
    vite: {
      server: {
        proxy: {
          // En dev, cualquier llamada que empiece con /api va al backend
          '/api': { target: 'http://localhost:4000', changeOrigin: true },
          // También proxy para rutas de auth, ai, coins, etc.
          '/auth': { target: 'http://localhost:4000', changeOrigin: true },
          '/ai': { target: 'http://localhost:4000', changeOrigin: true },
          '/coins': { target: 'http://localhost:4000', changeOrigin: true }
        }
      }
    }
  },
  vite: {
    define: {
      __DATE__: `'${new Date().toISOString()}'`,
    },
  },
  base: '/',
});
