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
      manifest: {
        name: 'XIWEN - Plataforma Educativa',
        short_name: 'XIWEN',
        description: 'Plataforma educativa con juegos, ejercicios y cursos interactivos',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#09090b',
        theme_color: '#09090b',
        icons: [
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      injectRegister: 'auto',
      devOptions: {
        enabled: false // Disable in dev to avoid conflicts
      },
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
        // ✅ SIN manualChunks - Dejar que Vite maneje COMPLETAMENTE el code splitting
        // Esto evita TODOS los problemas de:
        // - Circular dependencies
        // - "Cannot access before initialization"
        // - "Cannot read properties of undefined"
        // - Orden de carga de módulos
        // Vite es inteligente y hará el mejor trabajo automáticamente

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
    // Permitir acceso desde la red local (para testing con múltiples dispositivos)
    host: true, // Escucha en todas las interfaces de red (0.0.0.0)
    strictPort: false, // Si el puerto está ocupado, usa el siguiente disponible

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