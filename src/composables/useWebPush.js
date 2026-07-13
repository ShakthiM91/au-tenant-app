import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import {
  fetchWebPushConfig,
  registerPushDevice,
  unregisterPushDevice,
  getStoredFcmToken,
  setStoredFcmToken
} from '@/api/push'

let initPromise = null
let messagingInstance = null

function isBrowserWebContext() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    await navigator.serviceWorker.ready
    return registration
  } catch (err) {
    console.warn('[WebPush] Service worker registration failed', err)
    return null
  }
}

export async function initWebPush(options = {}) {
  if (!isBrowserWebContext()) return { ok: false, reason: 'not-browser' }
  if (initPromise) return initPromise

  initPromise = (async () => {
    const appToken = import.meta.env.VITE_APP_TOKEN
    if (!appToken) return { ok: false, reason: 'missing-app-token' }

    if (!(await isSupported())) return { ok: false, reason: 'unsupported' }

    const config = await fetchWebPushConfig()
    if (!config?.enabled) return { ok: false, reason: 'disabled' }

    const registration = await registerServiceWorker()
    if (!registration) return { ok: false, reason: 'no-service-worker' }

    const firebaseApp = getApps().length
      ? getApps()[0]
      : initializeApp(config.firebase)

    messagingInstance = getMessaging(firebaseApp)

    if (Notification.permission === 'default' && options.requestPermission !== false) {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        return { ok: false, reason: 'permission-denied' }
      }
    }

    if (Notification.permission !== 'granted') {
      return { ok: false, reason: 'permission-denied' }
    }

    const token = await getToken(messagingInstance, {
      vapidKey: config.vapid_public_key,
      serviceWorkerRegistration: registration
    })

    if (!token) return { ok: false, reason: 'no-token' }

    const previous = getStoredFcmToken()
    if (previous && previous !== token) {
      try {
        await unregisterPushDevice(previous)
      } catch (_) {
        // ignore stale token cleanup errors
      }
    }

    await registerPushDevice({
      app_token: appToken,
      platform: 'web',
      token,
      device_info: {
        userAgent: navigator.userAgent,
        language: navigator.language
      }
    })

    setStoredFcmToken(token)
    return { ok: true, token }
  })().catch((err) => {
    console.warn('[WebPush] init failed', err)
    initPromise = null
    return { ok: false, reason: 'error', error: err }
  })

  return initPromise
}

export async function teardownWebPush() {
  initPromise = null
  messagingInstance = null
  const token = getStoredFcmToken()
  if (!token) return
  try {
    await unregisterPushDevice(token)
  } catch (err) {
    console.warn('[WebPush] unregister failed', err)
  } finally {
    setStoredFcmToken(null)
  }
}

export async function ensureWebPushListener(handler) {
  await initWebPush()
  if (!messagingInstance) return () => {}
  const { onMessage } = await import('firebase/messaging')
  return onMessage(messagingInstance, handler)
}
