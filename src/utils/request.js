import axios from 'axios'
import { showToast } from '@/utils/ionicFeedback'
import { getToken } from './auth'
import { enqueue } from '@/db/pendingWrites'
import { runSync } from '@/utils/syncWorker'
import { useSyncStore } from '@/store/sync'

let _router = null

export function setRouter(router) {
  _router = router
}

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000
})

// Request interceptor
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
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
      showToast(res.error || 'Request failed')
      return Promise.reject(new Error(res.error || 'Request failed'))
    }
    return res
  },
  (error) => {
    console.error('Response error:', error)
    const status = error.response?.status
    const message = error.response?.data?.error || error.message
    const currentPath = _router?.currentRoute?.value?.path

    if (status === 401) {
      if (currentPath !== '/login') {
        showToast('Session expired. Please login again.')
        if (_router) {
          _router.push('/login')
        } else {
          window.location.href = '/login'
        }
      }
    } else if (status === 403) {
      showToast(message || 'Access denied')
    } else if (status === 404) {
      showToast('Resource not found')
    } else if (status === 500) {
      showToast('Server error. Please try again later.')
    } else {
      showToast(message || 'Network error')
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
