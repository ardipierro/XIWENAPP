import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import viteCompression from 'vite-plugin-compression'

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
        // Solo precachear assets críticos (reducido para móviles)
        globPatterns: ['**/*.{js,css,html,ico,svg}'],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024, // 2 MB (reducido de 5 MB)

        // Offline fallback
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [
          /^\/api\//,  // No usar fallback para API calls
          /^\/login/, // No usar fallback en login
          /^\/register/ // No usar fallback en register
        ],

        // Excluir chunks grandes del precaché (usar runtime caching)
        globIgnores: [
          '**/excalidraw*.js',           // Lazy load bajo demanda
          '**/vendor*.js',               // Cargado bajo demanda
          '**/ContentManagerTabs*.js',   // 484 KB - runtime cache
          '**/ClassDailyLogManager*.js', // 407 KB - runtime cache
          '**/PieChart*.js',             // 321 KB (recharts) - runtime cache
          '**/recharts*.js',             // Recharts chunks - runtime cache
          '**/ContentReader*.js',        // 89 KB - solo cuando se usa
          '**/MessagesPanel*.js',        // 45 KB - runtime cache
          '**/HomeworkReview*.js',       // 52 KB - runtime cache
          '**/TestPage*.js',             // 80 KB - runtime cache
          '**/AnalyticsDashboard*.js'    // 26 KB - runtime cache
        ],

        // Estrategia de caché optimizada para móvil
        runtimeCaching: [
          {
            // Runtime caching para chunks grandes excluidos del precache
            urlPattern: /assets\/(excalidraw|vendor|ContentManagerTabs|ClassDailyLogManager|PieChart|recharts|ContentReader|MessagesPanel|HomeworkReview|TestPage|AnalyticsDashboard)-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'large-chunks-cache',
              expiration: {
                maxEntries: 20,
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
    }),

    // Compresión Brotli y Gzip para assets
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // Solo archivos > 10KB
      algorithm: 'gzip',
      ext: '.gz'
    }),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br'
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
        // Code splitting estratégico para optimizar bundle size
        manualChunks: (id) => {
          // Excalidraw - NO incluir en ningún chunk manual
          // Dejar que Vite lo maneje automáticamente para evitar circular deps
          if (id.includes('@excalidraw/excalidraw')) {
            return; // undefined = dejar que Vite decida
          }

          // Separar vendors pesados en chunks propios
          if (id.includes('node_modules')) {
            // Firebase - chunk separado (200 KB)
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }

            // React - chunk separado (core framework)
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }

            // Recharts - chunk separado (321 KB)
            if (id.includes('recharts')) {
              return 'vendor-recharts';
            }

            // LiveKit - chunk separado (150 KB)
            if (id.includes('livekit') || id.includes('@livekit')) {
              return 'vendor-livekit';
            }

            // Tiptap - chunk separado (100 KB)
            if (id.includes('@tiptap')) {
              return 'vendor-tiptap';
            }

            // DND Kit - chunk separado
            if (id.includes('@dnd-kit')) {
              return 'vendor-dndkit';
            }

            // Resto de vendors
            return 'vendor-other';
          }

          // Separar componentes por rol/área
          if (id.includes('/components/student/')) {
            return 'routes-student';
          }

          if (id.includes('/components/teacher/')) {
            return 'routes-teacher';
          }

          if (id.includes('/components/admin/')) {
            return 'routes-admin';
          }

          // Ejercicios en chunk separado
          if (id.includes('Exercise.jsx') || id.includes('Exercise.js')) {
            return 'exercises';
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