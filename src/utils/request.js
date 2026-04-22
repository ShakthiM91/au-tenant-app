import axios from 'axios'
import { showToast } from '@/utils/ionicFeedback'
import { getToken } from './auth'
import { enqueue } from '@/db/pendingWrites'
import { runSync } from '@/utils/syncWorker'
import { useSyncStore } from '@/store/sync'
import { useUserStore } from '@/store/user'

let _router = null

export function setRouter(router) {
  _router = router
}

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000
})

const APP_TOKEN = import.meta.env.VITE_APP_TOKEN

// Request interceptor
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    } else if (APP_TOKEN) {
      config.headers['X-App-Token'] = APP_TOKEN
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.success === false) {
      showToast({
        variant: 'error',
        message: res.error || 'Request failed'
      })
      return Promise.reject(new Error(res.error || 'Request failed'))
    }
    return res
  },
  (error) => {
    console.error('Response error:', error)
    const status = error.response?.status
    const message = error.response?.data?.error || error.message
    const currentPath = _router?.currentRoute?.value?.path
    const isInvalidOrExpiredToken403 =
      status === 403 && /invalid or expired token/i.test(message || '')

    function redirectToLogin() {
      if (_router) {
        _router.push('/login')
      } else {
        window.location.href = '/login'
      }
    }

    if (status === 401) {
      if (currentPath !== '/login') {
        useUserStore().resetState()
        showToast({
          variant: 'error',
          title: 'Session expired',
          message: 'Please log in again.'
        })
        redirectToLogin()
      }
    } else if (isInvalidOrExpiredToken403) {
      if (currentPath !== '/login') {
        useUserStore().resetState()
        redirectToLogin()
      }
    } else if (status === 403) {
      showToast({
        variant: 'error',
        title: 'Access denied',
        message: message || 'You do not have permission for this action.'
      })
    } else if (status === 404) {
      showToast({
        variant: 'error',
        title: 'Not found',
        message: 'That resource could not be found.'
      })
    } else if (status === 500) {
      showToast({
        variant: 'error',
        title: 'Server error',
        message: 'Please try again later.'
      })
    } else {
      showToast({
        variant: 'error',
        message: message || 'Network error'
      })
    }
    return Promise.reject(error)
  }
)

function shouldEnqueue(err) {
  if (!err.response) return true
  return err.response.status >= 500
}

async function enqueueAndReturnQueued(config) {
  const method = (config.method || 'get').toUpperCase()
  const { id } = await enqueue(method, config.url, config.data ?? null)
  runSync().then(() => useSyncStore().refreshPendingCount())
  return { queued: true, id }
}

/**
 * Request with optional queue: when offline or 5xx/network error, enqueue and return { queued: true, id }.
 * Use config.skipQueue: true to never queue (e.g. auth).
 */
function request(config) {
  if (config.skipQueue || (config.method && String(config.method).toLowerCase() === 'get')) {
    return service(config)
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return enqueueAndReturnQueued(config)
  }
  return service(config).catch((err) => {
    if (shouldEnqueue(err)) return enqueueAndReturnQueued(config)
    return Promise.reject(err)
  })
}

export default request
