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
        // Nginx redirige /api/<servicio> → /api/<servicio>/ (301).
        // Añadimos el trailing slash antes de reenviar para evitar
        // que el navegador siga la redirección cross-origin (CORS error).
        rewrite: (path) => path.replace(/^(\/api\/[a-z]+)$/, '$1/'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
