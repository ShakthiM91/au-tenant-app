import { getRefreshToken, setToken, setRefreshToken } from './auth'
import { refreshAccessToken } from '@/api/auth'
import { useUserStore } from '@/store/user'

let refreshPromise = null

function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp || 0
  } catch {
    return 0
  }
}

export function isAccessTokenExpiringSoon(token, bufferSec = 300) {
  if (!token) return false
  const exp = getTokenExpiry(token)
  if (!exp) return false
  return Date.now() / 1000 >= exp - bufferSec
}

export async function refreshSession() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const response = await refreshAccessToken(refreshToken)
      if (!response?.accessToken || !response?.refreshToken) {
        return false
      }

      setToken(response.accessToken)
      setRefreshToken(response.refreshToken)

      const userStore = useUserStore()
      userStore.token = response.accessToken
      if (response.menus) {
        userStore.menus = response.menus
      }

      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}
