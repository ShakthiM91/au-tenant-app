import { getCached, setCached } from '@/db/readCache'

/**
 * Cache-first get: return cached data if present and trigger background refresh when online.
 * Otherwise fetch from API and cache.
 */
export async function getWithCache(cacheKey, fetchFn) {
  const cached = await getCached(cacheKey)
  if (cached?.data !== undefined && cached?.data !== null) {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      fetchFn()
        .then((fresh) => setCached(cacheKey, fresh))
        .catch(() => {})
    }
    return cached.data
  }
  const fresh = await fetchFn()
  await setCached(cacheKey, fresh)
  return fresh
}
