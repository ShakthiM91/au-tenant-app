/**
 * Serves /firebase-messaging-sw.js for FCM web push.
 *
 * - Dev: full script from push-service (avoids nested importScripts quirks in Vite)
 * - Production build: bootstrap that loads config from /api at runtime (no build-time API needed)
 */
export function fcmServiceWorkerPlugin(appToken = '', apiOrigin = 'http://localhost:3000') {
  const token = encodeURIComponent(appToken || '')
  const pushServiceWorkerUrl = `${apiOrigin}/api/push/messaging-service-worker?app_token=${token}`

  function buildBootstrapSource() {
    const safeToken = (appToken || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    return [
      '/* FCM bootstrap — loads messaging worker from push-service at runtime */',
      `importScripts(self.location.origin + '/api/push/messaging-service-worker?app_token=' + encodeURIComponent('${safeToken}'));`
    ].join('\n')
  }

  async function fetchFullServiceWorkerSource() {
    const res = await fetch(pushServiceWorkerUrl)
    const body = await res.text()
    if (!res.ok || body.startsWith('// Web push not configured') || !body.includes('firebase.initializeApp')) {
      throw new Error(body.trim() || `HTTP ${res.status}`)
    }
    return body
  }

  return {
    name: 'revo-fcm-service-worker',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== '/firebase-messaging-sw.js' && !req.url?.startsWith('/firebase-messaging-sw.js?')) {
          return next()
        }

        fetchFullServiceWorkerSource()
          .then((source) => {
            res.setHeader('Content-Type', 'application/javascript')
            res.setHeader('Cache-Control', 'no-store')
            res.end(source)
          })
          .catch((err) => {
            console.warn('[fcm-sw] Dev: full SW fetch failed, using bootstrap:', err.message)
            res.setHeader('Content-Type', 'application/javascript')
            res.setHeader('Cache-Control', 'no-store')
            res.end(buildBootstrapSource())
          })
      })
    },
    async generateBundle() {
      let source = buildBootstrapSource()
      try {
        source = await fetchFullServiceWorkerSource()
      } catch (err) {
        console.warn(
          '[fcm-sw] Build: push-service not reachable — emitting bootstrap SW (loads /api at runtime):',
          err.message
        )
      }
      this.emitFile({
        type: 'asset',
        fileName: 'firebase-messaging-sw.js',
        source
      })
    }
  }
}
