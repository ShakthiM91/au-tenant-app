import axios from 'axios'
import { getToken } from './auth'
import { getPendingWrites, updateEntry } from '@/db/pendingWrites'
import { invalidateAccountingCache } from '@/db/readCache'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/** Called when a transaction sync succeeds; receives account IDs to invalidate (balance/flow log). */
let transactionInvalidationHandler = null
/** Called when a transaction sync succeeds; signals transaction list to refetch. */
let transactionListInvalidationHandler = null

export function setTransactionInvalidationHandler(fn) {
  transactionInvalidationHandler = fn
}

export function setTransactionListInvalidationHandler(fn) {
  transactionListInvalidationHandler = fn
}

const syncClient = axios.create({
  baseURL,
  timeout: 15000
})

syncClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

/** Extract account IDs from a transaction payload or response for invalidation. */
function getTransactionAccountIds(payload, responseData) {
  const ids = new Set()
  const fromPayload = (p) => {
    if (p?.account_id != null) ids.add(Number(p.account_id))
    if (p?.to_account_id != null) ids.add(Number(p.to_account_id))
  }
  fromPayload(payload)
  const data = responseData?.data ?? responseData
  if (data && typeof data === 'object') {
    fromPayload(data)
  }
  return Array.from(ids)
}

function isTransactionUrl(url) {
  return typeof url === 'string' && (
    url.includes('/api/accounting/transactions') ||
    url.includes('/accounting/transactions')
  )
}

let syncLock = false

/**
 * Process all pending writes: send to backend, update entry on success/failure.
 * Server wins: store server_response; for transactions, call invalidation handler.
 */
export async function runSync() {
  if (syncLock) return
  syncLock = true
  try {
    const entries = await getPendingWrites()
    for (const entry of entries) {
      await updateEntry(entry.id, { status: 'syncing' })
      const headers = {}
      if (entry.method === 'POST') {
        headers['X-Idempotency-Key'] = entry.id
      }
      try {
        const res = await syncClient.request({
          method: entry.method,
          url: entry.url,
          data: entry.payload,
          headers
        })
        const serverResponse = res?.data ?? res
        await updateEntry(entry.id, {
          status: 'completed',
          server_response: serverResponse,
          last_error: null
        })
        if (isTransactionUrl(entry.url)) {
          if (transactionInvalidationHandler) {
            const accountIds = getTransactionAccountIds(entry.payload, serverResponse)
            if (accountIds.length) transactionInvalidationHandler(accountIds)
          }
          if (transactionListInvalidationHandler) transactionListInvalidationHandler()
          invalidateAccountingCache({ accounts: true }).catch(() => {})
        }
      } catch (err) {
        const status = err.response?.status
        const message = err.response?.data?.error || err.message || 'Network error'
        const is4xx = status >= 400 && status < 500
        await updateEntry(entry.id, {
          status: 'failed',
          last_error: message,
          retry_count: (entry.retry_count || 0) + 1
        })
        if (is4xx) {
          // Permanent failure; could optionally remove from queue
        }
      }
    }
  } finally {
    syncLock = false
  }
}
