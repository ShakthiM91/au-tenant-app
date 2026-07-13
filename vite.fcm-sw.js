/**
 * Serves /firebase-messaging-sw.js by delegating to push-service (via /api proxy).
 */
export function fcmServiceWorkerPlugin(appToken = '') {
  const token = encodeURIComponent(appToken || '')
  const source = `importScripts('/api/push/firebase-messaging-sw.js?app_token=${token}');`

  return {
    name: 'revo-fcm-service-worker',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/firebase-messaging-sw.js' || req.url?.startsWith('/firebase-messaging-sw.js?')) {
          res.setHeader('Content-Type', 'application/javascript')
          res.setHeader('Cache-Control', 'no-store')
          res.end(source)
          return
        }
        next()
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'firebase-messaging-sw.js',
        source
      })
    }
  }
}
