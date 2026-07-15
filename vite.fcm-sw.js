/**
 * Serves /firebase-messaging-sw.js for FCM web push.
 * Bootstrap loads the full script from push-service at runtime (no build-time API needed).
 */
export function fcmServiceWorkerPlugin(appToken = '') {
  const safeToken = (appToken || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const source = [
    '/* FCM bootstrap — loads messaging worker from push-service at runtime */',
    `importScripts(self.location.origin + '/api/push/messaging-service-worker?app_token=' + encodeURIComponent('${safeToken}'));`
  ].join('\n')

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
