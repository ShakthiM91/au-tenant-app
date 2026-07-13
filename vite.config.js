import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { fcmServiceWorkerPlugin } from './vite.fcm-sw.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      fcmServiceWorkerPlugin(env.VITE_APP_TOKEN),
      VitePWA({
        registerType: 'prompt',
        injectRegister: 'auto',
        dev: false,
        manifest: {
          name: 'Rupee Life',
          short_name: 'Rupee Life',
          description: 'Rupee Life mobile app for Revo ERP',
          theme_color: '#ff8d28',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          globIgnores: ['**/splash-artwork.png', '**/onboarding-*.png', '**/welcome-journey.png', '**/home-banner-1.png', '**/firebase-messaging-sw.js'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//]
        }
      })
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 8083,
      open: false,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    }
  }
})
