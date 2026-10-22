import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

const MAX_PRECACHE_BYTES = 5 * 1024 * 1024
const IMAGE_CACHE_ENTRIES = 200
const IMAGE_CACHE_SECONDS = 30 * 24 * 60 * 60
const FONT_CACHE_SECONDS = 365 * 24 * 60 * 60

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        id: './',
        name: 'levelxup · جمّع جهازك',
        short_name: 'levelxup',
        description: 'جمّع جهازك صح وبأرخص سعر في مصر: التوافق، الباور، الـ Bottleneck وأسعار المحلات بالجنيه.',
        lang: 'ar',
        dir: 'rtl',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#e8590c',
        background_color: '#f4f5f7',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        globIgnores: ['og-image.png'],
        maximumFileSizeToCacheInBytes: MAX_PRECACHE_BYTES,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxAgeSeconds: FONT_CACHE_SECONDS }, cacheableResponse: { statuses: [0, 200] } }
          },
          {
            urlPattern: ({ request, sameOrigin }) => !sameOrigin && request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'part-images',
              expiration: { maxEntries: IMAGE_CACHE_ENTRIES, maxAgeSeconds: IMAGE_CACHE_SECONDS, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  base: './',
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.spec.ts'],
    coverage: { provider: 'v8', include: ['src/**/*.{ts,vue}'] }
  }
})
