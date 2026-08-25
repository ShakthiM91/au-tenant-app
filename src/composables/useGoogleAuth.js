import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { showToast } from '@/utils/ionicFeedback'
import { resolveGoogleClientIds, isGoogleAuthConfigured } from '@/utils/googleAuthConfig'
import {
  googleAuthLog,
  googleAuthLogConfig,
  googleAuthLogError,
  googleAuthMaskClientId,
  googleAuthExplainNativeError,
  googleAuthDebugEnabled
} from '@/utils/googleAuthDebug'

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client'
let gisLoadPromise = null

function buildConfigSnapshot() {
  const ids = resolveGoogleClientIds()
  return {
    platform: ids.platform,
    isNative: ids.isNative,
    signInFlow: ids.signInFlow,
    debugEnabled: googleAuthDebugEnabled(),
    clientIdSources: ids.sources,
    clientIds: {
      web: googleAuthMaskClientId(ids.web),
      native: googleAuthMaskClientId(ids.native),
      serverClientId: googleAuthMaskClientId(ids.server),
      pluginRequestIdToken: googleAuthMaskClientId(ids.pluginClientId)
    },
    notes:
      ids.platform === 'android'
        ? [
            '@capawesome/capacitor-google-sign-in initialize() uses Web client ID (pluginClientId).',
            'Android OAuth client + SHA-1 are configured only in Google Cloud Console.'
          ]
        : ids.platform === 'ios'
          ? ['iOS also requires GIDClientID (iOS client) in Info.plist per capawesome docs.']
          : [],
    warnings: [
      ...(ids.platform === 'android' && !ids.pluginClientId
        ? ['VITE_GOOGLE_CLIENT_ID (Web) is required for Android native sign-in']
        : []),
      ...(!ids.web && !ids.isNative ? ['VITE_GOOGLE_CLIENT_ID is empty in this build'] : [])
    ]
  }
}

function formatSignInError(err) {
  const code = err?.code != null ? String(err.code) : ''
  const hint = googleAuthExplainNativeError(err)
  const base = err?.message || 'Google sign-in failed'
  if (code && hint) return `${base} (code ${code}). ${hint}`
  if (code) return `${base} (code ${code})`
  if (hint) return `${base}. ${hint}`
  return base
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

function signInWebViaButton(clientId) {
  googleAuthLog('auth flow: web-gis', { clientId: googleAuthMaskClientId(clientId) })

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
              googleAuthLog('web-gis sign-in success', {
                idTokenLength: response.credential.length
              })
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

async function signInNative(ids) {
  googleAuthLog('auth flow: native-capacitor-plugin (@capawesome/capacitor-google-sign-in)', {
    platform: ids.platform,
    pluginClientIdSource: ids.sources.pluginClientId,
    androidOAuthClientInConsole: googleAuthMaskClientId(ids.native)
  })
  googleAuthLogConfig(buildConfigSnapshot())

  const { GoogleSignIn } = await import('@capawesome/capacitor-google-sign-in')

  const initOptions = {
    clientId: ids.pluginClientId
  }

  googleAuthLog('native plugin initialize', {
    clientId: googleAuthMaskClientId(initOptions.clientId),
    note: 'clientId must be Web OAuth client ID on all native platforms'
  })

  try {
    await GoogleSignIn.initialize(initOptions)
    googleAuthLog('native plugin initialize complete')
  } catch (err) {
    googleAuthLogError('native plugin initialize failed', err)
    throw err
  }

  googleAuthLog('native plugin GoogleSignIn.signIn()')
  let result
  try {
    result = await GoogleSignIn.signIn()
  } catch (err) {
    googleAuthLogError('native plugin signIn failed', err, {
      hint: googleAuthExplainNativeError(err)
    })
    throw err
  }

  googleAuthLog('native plugin signIn response', {
    hasIdToken: Boolean(result?.idToken),
    hasAccessToken: Boolean(result?.accessToken),
    email: result?.email || null,
    idTokenLength: result?.idToken?.length ?? 0
  })

  const idToken = result?.idToken
  if (!idToken) {
    const err = new Error('Google sign-in did not return an ID token')
    googleAuthLogError('native plugin missing idToken', err, { resultKeys: Object.keys(result || {}) })
    throw err
  }

  return idToken
}

export function useGoogleAuth() {
  const loading = ref(false)

  async function connectWithGoogle() {
    const ids = resolveGoogleClientIds()
    googleAuthLog('connectWithGoogle start', buildConfigSnapshot())

    if (!isGoogleAuthConfigured()) {
      googleAuthLogError('not configured', new Error('Missing Google client IDs in build'), buildConfigSnapshot())
      showToast('Google sign-in is not configured')
      return null
    }

    loading.value = true
    try {
      if (Capacitor.isNativePlatform()) {
        const token = await signInNative(ids)
        googleAuthLog('connectWithGoogle success', { flow: 'native-capacitor-plugin', idTokenLength: token?.length ?? 0 })
        return token
      }
      const token = await signInWebViaButton(ids.web)
      googleAuthLog('connectWithGoogle success', { flow: 'web-gis', idTokenLength: token?.length ?? 0 })
      return token
    } catch (e) {
      googleAuthLogError('connectWithGoogle failed', e, {
        flow: ids.signInFlow,
        hint: googleAuthExplainNativeError(e),
        snapshot: buildConfigSnapshot()
      })
      const msg = formatSignInError(e)
      if (!/cancel|popup_closed|user closed|12501|12500|sign_in_canceled/i.test(msg)) {
        showToast(msg)
      }
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, connectWithGoogle, isConfigured: isGoogleAuthConfigured }
}
