import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // En desarrollo, reenvía las peticiones /api/* al proxy Nginx local
    proxy: {
      '/api': {
        target: 'http://localhost:8108',
        changeOrigin: true,
        // Nginx acepta rutas con y sin trailing slash (rewrite interno en nginx.conf).
        // No se necesita rewrite aquí desde que se corrigió el proxy en PR #48.
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
