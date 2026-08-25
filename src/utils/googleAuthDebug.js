const LOG_PREFIX = '[GoogleAuth]'

function isDebugEnabled() {
  const flag = import.meta.env.VITE_GOOGLE_AUTH_DEBUG
  return flag === 'true' || flag === '1' || import.meta.env.DEV
}

/** Capacitor logcat only prints the first string arg well — always log one JSON string. */
function stringifyLog(value) {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function parseError(err) {
  if (err == null) return null
  if (typeof err === 'string') return { message: err }

  const code = err.code ?? err.errorCode ?? err.error?.code ?? null
  const message =
    err.message ??
    err.errorMessage ??
    err.error?.message ??
    (typeof err === 'object' ? null : String(err))

  const out = { message, code }
  try {
    for (const key of Object.getOwnPropertyNames(err)) {
      if (out[key] === undefined && key !== 'stack') {
        out[key] = err[key]
      }
    }
  } catch {
    /* ignore */
  }
  return out
}

function maskClientId(id) {
  const s = String(id || '').trim()
  if (!s) return '(empty)'
  if (s.length <= 16) return s
  return `${s.slice(0, 8)}…${s.slice(-20)}`
}

export function googleAuthLog(label, payload) {
  if (!isDebugEnabled()) return
  const line =
    payload !== undefined
      ? `${LOG_PREFIX} ${label} ${stringifyLog(payload)}`
      : `${LOG_PREFIX} ${label}`
  console.info(line)
}

export function googleAuthLogError(label, err, extra) {
  if (!isDebugEnabled()) return
  const body = {
    ...(extra || {}),
    error: parseError(err)
  }
  console.error(`${LOG_PREFIX} ${label} ${stringifyLog(body)}`)
}

export function googleAuthLogConfig(snapshot) {
  if (!isDebugEnabled()) return
  googleAuthLog('config snapshot', snapshot)
}

export function googleAuthMaskClientId(id) {
  return maskClientId(id)
}

export function googleAuthExplainNativeError(err) {
  const parsed = parseError(err)
  const code = String(parsed?.code ?? '').trim()
  if (code === '10') {
    return (
      'DEVELOPER_ERROR (code 10): verify Web client ID in initialize(), package com.rupeelife.app, ' +
      'and SHA-1 on the Android OAuth client in Google Cloud Console.'
    )
  }
  if (code === '12501' || code === '12500' || code === 'SIGN_IN_CANCELED') {
    return 'Sign-in cancelled or interrupted by user.'
  }
  return null
}

export function googleAuthDebugEnabled() {
  return isDebugEnabled()
}
