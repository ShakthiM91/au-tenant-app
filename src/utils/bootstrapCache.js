import request from '@/utils/request'
import { setCached, CACHE_KEYS } from '@/db/readCache'

/**
 * Fetch all bootstrap resources and store in IndexedDB.
 * Used on app start (warm) and on resume / when entering transactions or accounts page (refresh).
 */
async function fetchAndCacheAll() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  const fetches = [
    request({ url: '/api/accounting/accounts', method: 'get' }).then((r) =>
      setCached(CACHE_KEYS.ACCOUNTS, r)
    ),
    request({
      url: '/api/accounting/accounts',
      method: 'get',
      params: { is_active: true }
    }).then((r) => setCached(CACHE_KEYS.ACCOUNTS_ACTIVE, r)),
    request({
      url: '/api/accounting/categories/tree',
      method: 'get',
      params: { type: 'income' }
    }).then((r) => setCached(CACHE_KEYS.CATEGORY_TREE('income'), r)),
    request({
      url: '/api/accounting/categories/tree',
      method: 'get',
      params: { type: 'expense' }
    }).then((r) => setCached(CACHE_KEYS.CATEGORY_TREE('expense'), r)),
    request({ url: '/api/currencies/tenant', method: 'get' }).then((r) =>
      setCached(CACHE_KEYS.CURRENCIES_TENANT, r)
    ),
    request({ url: '/api/currencies/tenant/default', method: 'get' }).then((r) =>
      setCached(CACHE_KEYS.DEFAULT_CURRENCY, r)
    ),
    request({ url: '/api/accounting/primary-account', method: 'get' }).then((r) =>
      setCached(CACHE_KEYS.PRIMARY_ACCOUNT, r)
    )
  ]
  await Promise.allSettled(fetches)
}

/**
 * Warm bootstrap cache on app start (when user is authenticated).
 * Run once after mount; does not block.
 */
export function warmBootstrapCache() {
  return fetchAndCacheAll()
}

/**
 * Refresh bootstrap cache in background (e.g. on app resume or when entering transactions/accounts page).
 */
export function refreshBootstrapCache() {
  return fetchAndCacheAll()
}
