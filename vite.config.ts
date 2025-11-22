import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './resources/js'),
    },
  },
  build: {
    outDir: 'public',
    emptyOutDir: false,
    minify: false, // Disable minification for better debugging
    // terserOptions: {
    //   compress: {
    //     drop_console: true,
    //     drop_debugger: true,
    //   },
    // },
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, 'resources/js/main.tsx'),
        'account-page': path.resolve(__dirname, 'resources/js/account-page.tsx'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        manualChunks(id) {
          // Separate chunking for admin app vs frontend account page
          if (id.includes('account-page')) {
            // Frontend account page - minimal dependencies
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'account-react-vendor';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'account-query-vendor';
              }
            }
            return null;
          }
          // Admin app - full dependencies
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
          }
          return null;
        },
      },
    },
    manifest: true,
    sourcemap: true, // Enable source maps for better error debugging
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      host: 'localhost',
    },
  },
});

