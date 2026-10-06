process.env.NODE_ENV = 'production';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  process.env.NODE_ENV = 'production';
  return {
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      open: false,
    }),
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('node_modules')) {
            if (normalized.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (
              normalized.includes('/react/') ||
              normalized.includes('/react-dom/') ||
              normalized.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }
            return 'vendor-other';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: ['**/staging_deploy/**', '**/data/**', '**/*.zip', '**/dist/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
};
});
