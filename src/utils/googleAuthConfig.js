import { Capacitor } from '@capacitor/core'
import capacitorConfig from '../../capacitor.config.json'

const pluginConfig = capacitorConfig?.plugins?.GoogleAuth || {}

function trim(value) {
  return value != null ? String(value).trim() : ''
}

function fromEnv(key) {
  return trim(import.meta.env[key])
}

function fromCapacitor(key) {
  return trim(pluginConfig[key])
}

/**
 * Resolve OAuth client IDs and record where each value came from (for logcat debugging).
 */
export function resolveGoogleClientIds() {
  const platform = Capacitor.getPlatform()
  const webFromEnv = fromEnv('VITE_GOOGLE_CLIENT_ID')
  const webFromCapacitor = fromCapacitor('serverClientId') || fromCapacitor('clientId')
  const web = webFromEnv || webFromCapacitor

  let native = ''
  let nativeSource = 'none'

  if (platform === 'ios') {
    const iosEnv = fromEnv('VITE_GOOGLE_IOS_CLIENT_ID')
    const iosCap = fromCapacitor('iosClientId')
    if (iosEnv) {
      native = iosEnv
      nativeSource = 'env.VITE_GOOGLE_IOS_CLIENT_ID'
    } else if (iosCap) {
      native = iosCap
      nativeSource = 'capacitor.config.iosClientId'
    } else if (web) {
      native = web
      nativeSource = 'web-fallback'
    }
  } else if (platform === 'android') {
    const androidEnv = fromEnv('VITE_GOOGLE_ANDROID_CLIENT_ID')
    const androidCap = fromCapacitor('androidClientId')
    if (androidEnv) {
      native = androidEnv
      nativeSource = 'env.VITE_GOOGLE_ANDROID_CLIENT_ID'
    } else if (androidCap) {
      native = androidCap
      nativeSource = 'capacitor.config.androidClientId'
    } else if (web) {
      native = web
      nativeSource = 'web-fallback'
    }
  } else {
    native = web
    nativeSource = webFromEnv ? 'env.VITE_GOOGLE_CLIENT_ID' : 'capacitor.config'
  }

  const serverFromEnv = webFromEnv
  const serverFromCap = fromCapacitor('serverClientId')
  const server = serverFromEnv || serverFromCap || native
  const serverSource = serverFromEnv
    ? 'env.VITE_GOOGLE_CLIENT_ID'
    : serverFromCap
      ? 'capacitor.config.serverClientId'
      : nativeSource

  /**
   * @capawesome/capacitor-google-sign-in initialize({ clientId }) requires the Web OAuth client ID
   * on every platform (Android Credential Manager server client ID, iOS serverClientID).
   * Platform OAuth clients (Android SHA-1, iOS GIDClientID in Info.plist) are configured separately.
   */
  const pluginClientId = server || web
  const pluginClientIdSource = serverSource

  return {
    platform,
    isNative: Capacitor.isNativePlatform(),
    signInFlow: Capacitor.isNativePlatform() ? 'native-capacitor-plugin' : 'web-gis',
    web,
    native,
    server,
    pluginClientId,
    sources: {
      native: nativeSource,
      server: serverSource,
      web: webFromEnv ? 'env.VITE_GOOGLE_CLIENT_ID' : webFromCapacitor ? 'capacitor.config' : 'none',
      pluginClientId: pluginClientIdSource
    }
  }
}

export function isGoogleAuthConfigured() {
  const ids = resolveGoogleClientIds()
  if (ids.isNative) return Boolean(ids.pluginClientId)
  return Boolean(ids.web)
}
