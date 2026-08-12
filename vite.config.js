import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached long-term, rarely changes
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Animation library — sizeable, used on many pages
          'vendor-motion': ['framer-motion'],
          // Icons — tree-shaken per-page but shared chunk avoids duplication
          'vendor-icons': ['lucide-react'],
          // Local database + sync engine. Split out so it caches independently of
          // app code, which changes far more often.
          'vendor-db': ['dexie', 'dexie-react-hooks'],
        },
      },
    },
  },
});
