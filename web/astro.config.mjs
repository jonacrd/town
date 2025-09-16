import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
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
    inlineStylesheets: 'auto',
  },
  vite: {
    define: {
      __DATE__: `'${new Date().toISOString()}'`,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Separar React en su propio chunk
            'react-vendor': ['react', 'react-dom'],
            // Separar utils y componentes grandes
            'utils': ['./src/utils/fetcher.ts', './src/utils/performance.ts'],
          },
        },
      },
    },
  },
  // Configuración para mejor performance
  compressHTML: true,
  experimental: {
    assets: true,
    optimizeHoistedScript: true,
  },
  // Base path para assets (Vercel maneja esto automáticamente)
  base: '/',
  trailingSlash: 'ignore',
});
