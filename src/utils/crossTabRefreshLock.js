const LOCK_TTL_MS = 30_000
const WAIT_TIMEOUT_MS = 25_000
const POLL_MS = 100

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Coordinate token refresh across browser tabs that share localStorage.
 * Only one tab should call /api/auth/refresh at a time; others wait for updated tokens.
 */
export function createCrossTabRefreshLock({ lockKey, getRefreshToken }) {
  const tabId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`

  function readLock() {
    try {
      const raw = localStorage.getItem(lockKey)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed?.at || Date.now() - parsed.at >= LOCK_TTL_MS) return null
      return parsed
    } catch {
      return null
    }
  }

  function writeLock() {
    localStorage.setItem(lockKey, JSON.stringify({ tabId, at: Date.now() }))
  }

  function clearLock() {
    localStorage.removeItem(lockKey)
  }

  function tryAcquire() {
    if (readLock()) return false
    writeLock()
    return readLock()?.tabId === tabId
  }

  function waitForTokenChange(initialRefreshToken) {
    if (typeof window === 'undefined') {
      return Promise.resolve(false)
    }

    return new Promise((resolve) => {
      let settled = false
      const finish = (value) => {
        if (settled) return
        settled = true
        cleanup()
        resolve(value)
      }

      const timeout = setTimeout(() => finish(false), WAIT_TIMEOUT_MS)
      const poll = setInterval(() => {
        const current = getRefreshToken()
        if (current && current !== initialRefreshToken) {
          finish(true)
          return
        }
        if (!readLock()) {
          finish(false)
        }
      }, POLL_MS)

      function onStorage(event) {
        if (event.storageArea !== localStorage) return
        const current = getRefreshToken()
        if (current && current !== initialRefreshToken) {
          finish(true)
        }
      }

      function cleanup() {
        clearTimeout(timeout)
        clearInterval(poll)
        window.removeEventListener('storage', onStorage)
      }

      window.addEventListener('storage', onStorage)
    })
  }

  /**
   * @returns {Promise<'leader' | 'follower-success' | 'follower-failed'>}
   */
  async function coordinate() {
    const initialRefreshToken = getRefreshToken()
    if (!initialRefreshToken) return 'follower-failed'

    if (tryAcquire()) {
      return 'leader'
    }

    const peerUpdated = await waitForTokenChange(initialRefreshToken)
    if (peerUpdated) return 'follower-success'

    const held = readLock()
    if (held && Date.now() - held.at >= LOCK_TTL_MS) {
      clearLock()
    }
    await sleep(20)
    if (tryAcquire()) {
      return 'leader'
    }

    return 'follower-failed'
  }

  function release() {
    const held = readLock()
    if (held?.tabId === tabId) {
      clearLock()
    }
  }

  return { coordinate, release }
}
