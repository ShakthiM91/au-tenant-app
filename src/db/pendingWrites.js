import Dexie from 'dexie'

const DB_NAME = 'RevoPendingWrites'
const DB_VERSION = 1

const db = new Dexie(DB_NAME)
db.version(DB_VERSION).stores({
  pending_writes: 'id, status, created_at'
})

/**
 * Enqueue a write for later sync.
 * @param {string} method - HTTP method: POST, PUT, PATCH, DELETE
 * @param {string} url - Path e.g. /api/accounting/transactions
 * @param {object|null} payload - Request body (null for DELETE)
 * @param {{ client_id?: string }} [options]
 * @returns {Promise<{ id: string, client_id?: string, created_at: number, status: string }>}
 */
export async function enqueue(method, url, payload, options = {}) {
  const id = crypto.randomUUID?.() ?? `q_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const created_at = Date.now()
  const entry = {
    id,
    client_id: options.client_id ?? null,
    method: method.toUpperCase(),
    url,
    payload: payload ?? null,
    created_at,
    retry_count: 0,
    last_error: null,
    status: 'pending',
    server_response: null
  }
  await db.pending_writes.add(entry)
  return { id, client_id: entry.client_id, created_at, status: entry.status }
}

/**
 * Get all entries that are pending or failed (for sync).
 * @returns {Promise<Array>}
 */
export async function getPendingWrites() {
  const entries = await db.pending_writes
    .where('status')
    .anyOf(['pending', 'failed'])
    .sortBy('created_at')
  return entries
}

/**
 * Update a queue entry (e.g. after sync attempt).
 * @param {string} id
 * @param {object} updates - Fields to update (status, server_response, last_error, retry_count, etc.)
 */
export async function updateEntry(id, updates) {
  await db.pending_writes.update(id, updates)
}

/**
 * Delete a single queue entry.
 * @param {string} id
 */
export async function deleteEntry(id) {
  await db.pending_writes.delete(id)
}

/**
 * Delete completed entries older than the given age.
 * @param {number} olderThanMs - e.g. 24 * 60 * 60 * 1000 for 24 hours
 * @returns {Promise<number>} - Number of deleted entries
 */
export async function deleteCompletedOlderThan(olderThanMs) {
  const cutoff = Date.now() - olderThanMs
  const completed = await db.pending_writes
    .where('status')
    .equals('completed')
    .filter(e => e.created_at < cutoff)
    .toArray()
  await db.pending_writes.bulkDelete(completed.map(e => e.id))
  return completed.length
}

export { db }
