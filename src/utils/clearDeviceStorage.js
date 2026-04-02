import { db as pendingWritesDb } from '@/db/pendingWrites'
import { db as readCacheDb } from '@/db/readCache'

/**
 * Remove app data persisted on the device (not server).
 * Call after auth token is cleared / logout API, so the request can still use the token if needed first.
 */
export async function clearAllClientStorage() {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.clear()
  } catch (e) {
    console.warn('sessionStorage.clear failed', e)
  }

  try {
    localStorage.clear()
  } catch (e) {
    console.warn('localStorage.clear failed', e)
  }

  try {
    await pendingWritesDb.delete()
  } catch (e) {
    console.warn('RevoPendingWrites DB delete failed', e)
  }
  // delete() closes the Dexie instance; reopen so the same module singleton works after login without a full reload
  try {
    await pendingWritesDb.open()
  } catch (e) {
    console.warn('RevoPendingWrites DB reopen failed', e)
  }

  try {
    await readCacheDb.delete()
  } catch (e) {
    console.warn('RevoReadCache DB delete failed', e)
  }
  try {
    await readCacheDb.open()
  } catch (e) {
    console.warn('RevoReadCache DB reopen failed', e)
  }
}
