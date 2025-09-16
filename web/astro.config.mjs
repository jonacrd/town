import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// Conditional import for Vercel adapter (only in production)
let adapter = null;
if (process.env.NODE_ENV === 'production') {
  try {
    const vercel = await import('@astrojs/vercel/static');
    adapter = vercel.default({
      webAnalytics: {
        enabled: true,
      },
    });
  } catch (e) {
    console.warn('Vercel adapter not available, building as static');
  }
}

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  output: 'static',
  ...(adapter && { adapter }),
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
          '/api': { target: 'http://localhost:4000', changeOrigin: true }
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
