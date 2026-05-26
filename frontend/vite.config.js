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
        autoRewrite: true, // Reescribe Location en 301/302 para evitar CORS cross-origin
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
