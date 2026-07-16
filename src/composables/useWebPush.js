import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, isSupported, onMessage, deleteToken } from 'firebase/messaging'
import {
  fetchWebPushConfig,
  registerPushDevice,
  unregisterPushDevice,
  getStoredFcmToken,
  setStoredFcmToken
} from '@/api/push'
import { useUserStore } from '@/store/user'
import { showToast } from '@/utils/ionicFeedback'

let initPromise = null
let messagingInstance = null
let foregroundUnsubscribe = null

function isBrowserWebContext() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function logWebPushStep(message, detail) {
  if (import.meta.env.DEV) {
    console.info('[WebPush]', message, detail ?? '')
  }
}

function logWebPushFailure(reason, detail = '') {
  console.warn('[WebPush] failed:', reason, detail)
}

function shouldClearInitPromise(result) {
  if (!result || result.ok) return false
  return true
}

export function resetWebPushInit() {
  initPromise = null
}

export function getWebPushPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export function hasRegisteredFcmToken() {
  return Boolean(getStoredFcmToken())
}

async function ensureNotificationPermission(options = {}) {
  const current = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  logWebPushStep('Notification.permission:', current)

  if (current === 'granted') return true

  if (current === 'denied') {
    if (options.requestPermission !== false) {
      showToast('Notifications blocked — click the lock icon in the address bar → Site settings → Notifications → Allow')
    }
    logWebPushFailure('permission-denied', 'Reset in Chrome: lock icon → Site settings → Notifications → Allow')
    return false
  }

  if (current === 'default' && options.requestPermission !== false) {
    const permission = await Notification.requestPermission()
    logWebPushStep('permission prompt result:', permission)
    if (permission !== 'granted') {
      logWebPushFailure('permission-denied', `User chose: ${permission}`)
      return false
    }
    return true
  }

  logWebPushFailure('permission-denied', `Current permission: ${current}`)
  return false
}

function normalizeVapidKey(key) {
  return (key || '').trim().replace(/\s+/g, '')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServiceWorkerActivation(registration, timeoutMs = 20000) {
  if (registration.active?.state === 'activated') return registration

  const worker = registration.installing || registration.waiting
  if (worker) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Service worker activation timed out')), timeoutMs)
      worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') {
          clearTimeout(timer)
          resolve()
        }
        if (worker.state === 'redundant') {
          clearTimeout(timer)
          reject(new Error('Service worker became redundant'))
        }
      })
    })
    return registration
  }

  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    await navigator.serviceWorker.ready
    if (registration.active?.state === 'activated') return registration
    await sleep(150)
  }

  throw new Error('Service worker activation timed out')
}

function isValidFcmSwScript(text) {
  if (!text?.trim()) return false
  if (text.startsWith('// Web push service worker unavailable')) return false
  if (text.includes('firebase.initializeApp')) return true
  return (
    text.includes('importScripts') &&
    (text.includes('messaging-service-worker') || text.includes('firebase-messaging-sw.js'))
  )
}

async function resolveServiceWorkerRegisterUrl() {
  const appToken = import.meta.env.VITE_APP_TOKEN

  const staticRes = await fetch('/firebase-messaging-sw.js', { cache: 'no-store' })
  const staticText = await staticRes.text()

  if (staticRes.ok && isValidFcmSwScript(staticText)) {
    return { url: '/firebase-messaging-sw.js' }
  }

  if (!appToken) {
    logWebPushFailure('invalid-service-worker', 'VITE_APP_TOKEN is missing')
    return null
  }

  const apiRes = await fetch(
    `/api/push/messaging-service-worker?app_token=${encodeURIComponent(appToken)}`,
    { cache: 'no-store' }
  )
  const apiText = await apiRes.text()

  if (apiRes.ok && isValidFcmSwScript(apiText)) {
    const blob = new Blob([apiText], { type: 'application/javascript' })
    return { url: URL.createObjectURL(blob), isBlob: true }
  }

  logWebPushFailure(
    'invalid-service-worker',
    `FCM service worker unavailable (static HTTP ${staticRes.status}, api HTTP ${apiRes.status}). Ensure /api proxies to push-service and the app is rebuilt.`
  )
  return null
}

const FCM_SW_SCOPE = '/firebase-cloud-messaging-push-scope/'

function isFcmServiceWorkerRegistration(registration) {
  const scope = registration?.scope || ''
  if (scope.includes('firebase-cloud-messaging-push-scope')) return true

  const scriptUrl =
    registration?.active?.scriptURL ||
    registration?.installing?.scriptURL ||
    registration?.waiting?.scriptURL ||
    ''
  return scriptUrl.includes('firebase-messaging-sw.js') || scriptUrl.startsWith('blob:')
}

async function unregisterLegacyFcmServiceWorkers() {
  const regs = await navigator.serviceWorker.getRegistrations()
  const origin = window.location.origin

  for (const reg of regs) {
    const isFcm = isFcmServiceWorkerRegistration(reg)
    const isRootScope = reg.scope === `${origin}/`
    if (isFcm && isRootScope) {
      await reg.unregister().catch(() => {})
    }
  }
}

async function clearStalePushSubscription(registration) {
  if (!registration?.pushManager) return
  try {
    const existing = await registration.pushManager.getSubscription()
    if (existing) await existing.unsubscribe()
  } catch (_) {
    // best-effort
  }
}

async function registerServiceWorker({ forceRefresh = false } = {}) {
  if (!('serviceWorker' in navigator)) return null

  try {
    const resolved = await resolveServiceWorkerRegisterUrl()
    if (!resolved?.url) return null

    await unregisterLegacyFcmServiceWorkers()

    const existingRegs = await navigator.serviceWorker.getRegistrations()
    let registration = existingRegs.find((reg) => {
      if (!isFcmServiceWorkerRegistration(reg)) return false
      return reg.scope.includes('firebase-cloud-messaging-push-scope')
    })

    if (!registration) {
      registration = await navigator.serviceWorker.register(resolved.url, {
        scope: FCM_SW_SCOPE,
        updateViaCache: 'none'
      })
    }

    if (forceRefresh) {
      await registration.update().catch(() => {})
    }
    await waitForServiceWorkerActivation(registration)
    await navigator.serviceWorker.ready

    if (forceRefresh) {
      await clearStalePushSubscription(registration)
    }

    logWebPushStep('service worker ready:', registration.active?.scriptURL)
    return registration
  } catch (err) {
    logWebPushFailure('service-worker-registration', err?.message || err)
    return null
  }
}

function getOrCreateMessaging(firebaseConfig) {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  if (!messagingInstance) {
    messagingInstance = getMessaging(app)
  }
  return messagingInstance
}

async function getFcmToken(messaging, { vapidKey, serviceWorkerRegistration, forceRefresh = false }) {
  if (forceRefresh) {
    try {
      await deleteToken(messaging)
    } catch (_) {
      // no existing token
    }
  }

  let lastError = null
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      await waitForServiceWorkerActivation(serviceWorkerRegistration)
      await navigator.serviceWorker.ready
      logWebPushStep(`getToken attempt ${attempt}/4`)
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration
      })
      if (token) {
        logWebPushStep('FCM token received:', `${token.slice(0, 24)}…`)
        return token
      }
    } catch (err) {
      lastError = err
      logWebPushFailure(`getToken attempt ${attempt}/4`, err?.message || err)
      if (attempt < 4) await sleep(500 * attempt)
    }
  }

  throw lastError || new Error('FCM getToken returned empty')
}

async function runInitWebPush(options = {}) {
  const appToken = import.meta.env.VITE_APP_TOKEN
  if (!appToken) {
    logWebPushFailure('missing-app-token', 'Set VITE_APP_TOKEN in apps/au-tenant-app/.env')
    return { ok: false, reason: 'missing-app-token' }
  }

  if (!(await isSupported())) {
    logWebPushFailure('unsupported', 'Use Chrome or Edge for web push')
    return { ok: false, reason: 'unsupported' }
  }

  const config = await fetchWebPushConfig()
  if (!config?.enabled) {
    logWebPushFailure(
      'disabled',
      config?.message || config?.reason || 'Enable push in primary-admin and ensure push-service is running'
    )
    return { ok: false, reason: 'disabled', detail: config?.reason || config?.message }
  }

  const permissionOk = await ensureNotificationPermission(options)
  if (!permissionOk) return { ok: false, reason: 'permission-denied' }

  const registration = await registerServiceWorker({ forceRefresh: options.forceRefresh === true })
  if (!registration) return { ok: false, reason: 'no-service-worker' }

  const vapidKey = normalizeVapidKey(config.vapid_public_key)
  if (!vapidKey) {
    logWebPushFailure('disabled', 'VAPID public key is empty')
    return { ok: false, reason: 'disabled' }
  }

  const messaging = getOrCreateMessaging(config.firebase)

  let token
  try {
    token = await getFcmToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
      forceRefresh: options.forceRefresh === true
    })
  } catch (err) {
    const msg = err?.message || String(err)
    logWebPushFailure('get-token-failed', msg)
    console.warn('[WebPush] Troubleshooting:')
    console.warn('  • DevTools → Application → Service Workers → Unregister all, then Clear site data')
    console.warn('  • Google Cloud → APIs → enable "Firebase Cloud Messaging API" for', config.firebase?.projectId)
    console.warn('  • Firebase Console → Cloud Messaging → regenerate Web Push key pair, update primary-admin')
    console.warn('  • Try Chrome incognito or Firefox')
    console.warn('[WebPush] config:', {
      projectId: config.firebase?.projectId,
      appId: config.firebase?.appId,
      messagingSenderId: config.firebase?.messagingSenderId,
      vapidLength: vapidKey.length,
      swActive: registration.active?.state,
      swScript: registration.active?.scriptURL
    })
    return { ok: false, reason: 'get-token-failed', error: err }
  }

  const previous = getStoredFcmToken()
  if (previous && previous !== token) {
    try {
      await unregisterPushDevice(previous)
    } catch (_) {
      // ignore stale token cleanup errors
    }
  }

  setStoredFcmToken(token)

  try {
    await registerPushDevice({
      app_token: appToken,
      platform: 'web',
      token,
      device_info: {
        userAgent: navigator.userAgent,
        language: navigator.language
      }
    })
  } catch (err) {
    const apiError = err?.response?.data?.error || err?.message || 'register failed'
    const userStore = useUserStore()
    logWebPushFailure(
      'register-failed',
      `${apiError} (logged-in user_id=${userStore.id ?? 'unknown'}, tenant_id=${userStore.tenantId ?? 'unknown'})`
    )
    return { ok: false, reason: 'register-failed', error: err, token }
  }

  const userStore = useUserStore()
  logWebPushStep(
    'registered device token',
    `(user_id=${userStore.id}, tenant_id=${userStore.tenantId})`
  )
  return { ok: true, token }
}

export async function initWebPush(options = {}) {
  if (!isBrowserWebContext()) return { ok: false, reason: 'not-browser' }
  if (initPromise) return initPromise

  initPromise = runInitWebPush(options)
    .catch((err) => {
      logWebPushFailure('error', err?.message || err)
      return { ok: false, reason: 'error', error: err }
    })
    .then((result) => {
      if (shouldClearInitPromise(result)) {
        initPromise = null
      }
      return result
    })

  return initPromise
}

export async function teardownWebPush() {
  initPromise = null
  messagingInstance = null
  if (typeof foregroundUnsubscribe === 'function') {
    foregroundUnsubscribe()
    foregroundUnsubscribe = null
  }
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

export async function enableWebPushNotifications() {
  resetWebPushInit()
  messagingInstance = null
  const result = await initWebPush({ requestPermission: true, forceRefresh: true })
  if (result.ok) {
    showToast('Push notifications enabled')
  } else if (result.reason === 'permission-denied') {
    showToast('Allow notifications in browser settings, then try again')
  } else if (result.reason === 'get-token-failed') {
    showToast('Could not get push token — see console for details')
  } else if (result.reason === 'register-failed') {
    showToast('Push token created but server registration failed')
  }
  return result
}

export async function ensureWebPushListener(handler) {
  const result = await initWebPush()
  if (!result?.ok || !messagingInstance) return () => {}

  if (typeof foregroundUnsubscribe === 'function') {
    foregroundUnsubscribe()
    foregroundUnsubscribe = null
  }

  foregroundUnsubscribe = onMessage(messagingInstance, handler)
  return () => {
    if (typeof foregroundUnsubscribe === 'function') {
      foregroundUnsubscribe()
      foregroundUnsubscribe = null
    }
  }
}
