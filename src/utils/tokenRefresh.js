import { getRefreshToken, getToken, setToken, setRefreshToken } from './auth'
import { refreshAccessToken } from '@/api/auth'
import { useUserStore } from '@/store/user'
import { createCrossTabRefreshLock } from './crossTabRefreshLock'

let refreshPromise = null

const refreshLock = createCrossTabRefreshLock({
  lockKey: 'revo_tenant_refresh_lock',
  getRefreshToken
})

function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp || 0
  } catch {
    return 0
  }
}

export function isAccessTokenExpired(token) {
  if (!token) return true
  const exp = getTokenExpiry(token)
  if (!exp) return false
  return Date.now() / 1000 >= exp
}

export function isAccessTokenExpiringSoon(token, bufferSec = 300) {
  if (!token) return false
  const exp = getTokenExpiry(token)
  if (!exp) return false
  return Date.now() / 1000 >= exp - bufferSec
}

function applyRefreshResponse(response) {
  setToken(response.accessToken)
  setRefreshToken(response.refreshToken)

  const userStore = useUserStore()
  userStore.token = response.accessToken
  if (response.menus) {
    userStore.menus = response.menus
  }
}

export async function refreshSession() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    let isLeader = false
    const initialRefreshToken = refreshToken

    try {
      const role = await refreshLock.coordinate()
      if (role === 'follower-success') {
        return Boolean(getRefreshToken() && getToken())
      }

      isLeader = role === 'leader'
      const tokenToUse = getRefreshToken()
      if (!tokenToUse) return false

      try {
        const response = await refreshAccessToken(tokenToUse)
        if (!response?.accessToken || !response?.refreshToken) {
          return false
        }

        applyRefreshResponse(response)
        return true
      } catch {
        if (getRefreshToken() && getRefreshToken() !== initialRefreshToken) {
          return Boolean(getToken())
        }
        return false
      }
    } finally {
      if (isLeader) {
        refreshLock.release()
      }
      refreshPromise = null
    }
  })()

  return refreshPromise
}
