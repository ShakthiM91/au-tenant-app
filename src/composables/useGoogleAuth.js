import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { showToast } from '@/utils/ionicFeedback'

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client'
let gisLoadPromise = null

function webClientId() {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
}

function nativeClientId() {
  const platform = Capacitor.getPlatform()
  if (platform === 'ios') {
    return (import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID || webClientId()).trim()
  }
  if (platform === 'android') {
    return (import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID || webClientId()).trim()
  }
  return webClientId()
}

function isConfigured() {
  if (Capacitor.isNativePlatform()) {
    return Boolean(nativeClientId())
  }
  return Boolean(webClientId())
}

function loadGisScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Not in browser'))
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }
  if (gisLoadPromise) return gisLoadPromise

  gisLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SCRIPT}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In')))
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SCRIPT
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'))
    document.head.appendChild(script)
  })

  return gisLoadPromise
}

function signInWebViaButton() {
  const clientId = webClientId()
  return new Promise((resolve, reject) => {
    loadGisScript()
      .then(() => {
        const host = document.createElement('div')
        host.style.cssText = 'position:fixed;left:-9999px;top:-9999px;'
        document.body.appendChild(host)

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            document.body.removeChild(host)
            if (response?.credential) {
              resolve(response.credential)
            } else {
              reject(new Error('Google sign-in was cancelled'))
            }
          }
        })

        window.google.accounts.id.renderButton(host, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with'
        })

        const btn = host.querySelector('div[role="button"]')
        if (btn) {
          btn.click()
        } else {
          document.body.removeChild(host)
          reject(new Error('Could not start Google sign-in'))
        }
      })
      .catch(reject)
  })
}

async function signInNative() {
  const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
  const clientId = nativeClientId()
  const serverClientId = webClientId() || clientId

  await GoogleAuth.initialize({
    clientId,
    scopes: ['profile', 'email'],
    grantOfflineAccess: false,
    ...(serverClientId ? { serverClientId } : {})
  })

  const result = await GoogleAuth.signIn()
  const idToken = result?.authentication?.idToken
  if (!idToken) {
    throw new Error('Google sign-in did not return an ID token')
  }
  return idToken
}

export function useGoogleAuth() {
  const loading = ref(false)

  async function connectWithGoogle() {
    if (!isConfigured()) {
      showToast('Google sign-in is not configured')
      return null
    }

    loading.value = true
    try {
      if (Capacitor.isNativePlatform()) {
        return await signInNative()
      }
      return await signInWebViaButton()
    } catch (e) {
      const msg = e?.message || 'Google sign-in failed'
      if (!/cancel|popup_closed|user closed/i.test(msg)) {
        showToast(msg)
      }
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, connectWithGoogle, isConfigured }
}
