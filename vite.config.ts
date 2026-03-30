import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      // Disable babel plugins that inject preamble code
      babel: {
        plugins: [],
      },
    }),
  ],
  root: './', // Set root to plugin directory
  base: './', // Use relative paths for assets
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './resources/js'),
    },
  },
  build: {
    outDir: 'assets',
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
        'blocks/tour': path.resolve(__dirname, 'resources/js/blocks/tour/index.tsx'),
        'blocks/activity': path.resolve(__dirname, 'resources/js/blocks/activity/index.tsx'),
        'blocks/destination': path.resolve(__dirname, 'resources/js/blocks/destination/index.tsx'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Admin app goes to admin/dist/js/
          if (chunkInfo.name === 'app') {
            return 'admin/dist/js/[name].js';
          }
          // Blocks go to dist/blocks/
          if (chunkInfo.name.startsWith('blocks/')) {
            return 'dist/[name].js';
          }
          // Frontend account page goes to dist/js/
          return 'dist/js/[name].js';
        },
        chunkFileNames: (chunkInfo) => {
          // Admin chunks go to admin/dist/js/
          if (chunkInfo.name.includes('app') || chunkInfo.name.includes('react-vendor') || chunkInfo.name.includes('query-vendor')) {
            return 'admin/dist/js/[name]-[hash].js';
          }
          // Frontend chunks go to dist/js/
          return 'dist/js/[name]-[hash].js';
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            // Admin CSS goes to admin/dist/css/
            if (assetInfo.name?.includes('app') || assetInfo.name?.includes('react-vendor') || assetInfo.name?.includes('index')) {
              return 'admin/dist/css/[name][extname]';
            }
            // Frontend CSS goes to dist/css/
            return 'dist/css/[name][extname]';
          }
          // Other assets
          if (assetInfo.name?.includes('app') || assetInfo.name?.includes('react-vendor')) {
            return 'admin/dist/assets/[name]-[hash][extname]';
          }
          return 'dist/assets/[name]-[hash][extname]';
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
    port: 5173,
    strictPort: true,
    host: true, // Allow external connections
    hmr: {
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
    },
    // Allow WordPress admin on http://yatra.local to load assets from this dev server
    cors: true,
    // Disable module preload in dev to prevent chunk loader generation
    preTransformRequests: false,
  },
  optimizeDeps: {
    // Force include all dependencies to avoid dynamic imports
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
    // Force Vite to not generate separate chunks in dev
    force: true,
  },
});

