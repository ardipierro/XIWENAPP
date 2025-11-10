import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Vite Config - Mobile First Optimized
 *
 * Optimizaciones:
 * - Code splitting estratégico
 * - Performance budgets para móvil
 * - Minification agresiva
 * - PWA optimizado
 */
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: false, // Usar manifest.json estático en public/
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB (por Excalidraw y vendor)

        // Excluir archivos muy grandes del precaché (usar runtime caching)
        globIgnores: [
          '**/excalidraw*.js',  // Lazy load bajo demanda
          '**/vendor*.js'       // Cargado bajo demanda
        ],

        // Estrategia de caché optimizada para móvil
        runtimeCaching: [
          {
            // Runtime caching para chunks grandes (excalidraw, vendor)
            urlPattern: /assets\/(excalidraw|vendor)-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'large-chunks-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Firebase Storage - CacheFirst con revalidación
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Firebase APIs - NetworkFirst
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-api-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 5 // 5 minutos
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ],

  // Eliminar console.log y debugger en producción
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },

  // Optimizaciones de build - Mobile First
  build: {
    // Target móviles modernos (2020+)
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],

    // Minification agresiva para móvil
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
      },
      format: {
        comments: false
      }
    },

    // CSS Code splitting
    cssCodeSplit: true,

    // Source maps solo en dev (reduce bundle size en prod)
    sourcemap: false,

    // Rollup optimizations
    rollupOptions: {
      output: {
        // Chunking estratégico - Mobile First + Fix vendor size
        manualChunks: (id) => {
          // React core + recharts juntos (recharts necesita React en el mismo contexto)
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/@reduxjs/toolkit') ||
              id.includes('node_modules/react-redux') ||
              id.includes('node_modules/use-sync-external-store')) {
            return 'react-vendor';
          }

          // Firebase completo (evitar split que causa circular deps)
          if (id.includes('firebase') || id.includes('@firebase')) {
            return 'firebase-vendor';
          }

          // Excalidraw - NO incluir en ningún chunk manual
          // Dejar que Vite lo maneje automáticamente para evitar circular deps
          if (id.includes('@excalidraw/excalidraw')) {
            return; // undefined = dejar que Vite decida
          }

          // LiveKit - Chunk separado (también es grande)
          if (id.includes('@livekit') || id.includes('livekit-client')) {
            return 'livekit-vendor';
          }

          // UI Libraries (lazy load)
          if (id.includes('lucide-react')) {
            return 'icons';
          }

          // D3 separado si no es parte de recharts
          if (id.includes('d3-') && !id.includes('recharts')) {
            return 'charts';
          }

          // Otras librerías node_modules (EXCEPTO Excalidraw)
          if (id.includes('node_modules/') && !id.includes('@excalidraw')) {
            return 'vendor';
          }
        },

        // Naming strategy optimizado
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },

    // Performance budgets para móvil (warnings)
    chunkSizeWarningLimit: 500, // 500KB max por chunk (más estricto)

    // Reportar bundle size
    reportCompressedSize: true,
  },

  // Optimizaciones de servidor dev
  server: {
    // Preload de módulos críticos
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/main.jsx',
        './src/components/Login.jsx'
      ]
    }
  }
})