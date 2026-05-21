import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // En desarrollo, reenvía las peticiones /api/* al proxy Nginx local
    proxy: {
      '/api': {
        target: 'http://localhost:8108',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
