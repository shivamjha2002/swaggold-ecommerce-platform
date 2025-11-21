import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false, // Remove comments
      },
    },
    
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Generate source maps for production debugging (optional, can be disabled for smaller builds)
    sourcemap: false,
    
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    
    rollupOptions: {
      output: {
        // Optimize chunk file names for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Organize assets by type
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          if (/css/i.test(ext)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
      
      // Tree-shaking optimization
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
    },
    
    // Report compressed size
    reportCompressedSize: true,
    
    // Set target for modern browsers
    target: 'es2015',
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: true,
  },
});
