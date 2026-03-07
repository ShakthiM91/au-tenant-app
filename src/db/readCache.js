import Dexie from 'dexie'

const DB_NAME = 'RevoReadCache'
const DB_VERSION = 4

const db = new Dexie(DB_NAME)
db.version(DB_VERSION).stores({
  accounts: 'id, cache_key, updated_at',
  category_trees: 'id, cache_key, updated_at',
  currencies_tenant: 'id, cache_key, updated_at',
  default_currency: 'id, cache_key, updated_at',
  primary_account: 'id, cache_key, updated_at'
})

/** Maps logical cache key (string) to store name. */
const KEY_TO_STORE = {
  accounts: 'accounts',
  'accounts:active': 'accounts',
  categoryTree: 'category_trees',
  'categoryTree:income': 'category_trees',
  'categoryTree:expense': 'category_trees',
  'currencies:tenant': 'currencies_tenant',
  defaultCurrency: 'default_currency',
  primaryAccount: 'primary_account'
}

function resolveKey(key) {
  const store = KEY_TO_STORE[key]
  if (store) return { store }
  if (key.startsWith('categoryTree:')) return { store: 'category_trees' }
  if (key.startsWith('categories:')) return { store: 'category_trees' }
  return null
}

/** Derive IndexedDB primary key from the cached data; fallback to logical key for arrays. */
function dataId(data, fallbackKey) {
  if (data != null && typeof data === 'object' && !Array.isArray(data)) {
    if (data.id != null && data.id !== '') return String(data.id)
    if (data.code != null && data.code !== '') return String(data.code)
  }
  return fallbackKey
}

/**
 * Get cached value by key.
 * @param {string} key - Logical key (e.g. CACHE_KEYS.ACCOUNTS)
 * @returns {Promise<{ data: any, updated_at: number } | null>}
 */
export async function getCached(key) {
  const resolved = resolveKey(key)
  if (!resolved) return null
  const { store } = resolved
  const entry = await db[store].where('cache_key').equals(key).first()
  if (!entry) return null
  return { data: entry.data, updated_at: entry.updated_at }
}

/**
 * Set cached value.
 * @param {string} key - Logical key
 * @param {any} data - Will be stored as-is (object/array)
 */
export async function setCached(key, data) {
  const resolved = resolveKey(key)
  if (!resolved) return
  const { store } = resolved
  const id = dataId(data, key)
  const updated_at = Date.now()
  await db[store].put({ id, cache_key: key, data, updated_at })
}

/**
 * Remove a cache entry.
 * @param {string} key - Logical key
 */
export async function removeCached(key) {
  const resolved = resolveKey(key)
  if (!resolved) return
  const { store } = resolved
  const entry = await db[store].where('cache_key').equals(key).first()
  if (entry) await db[store].delete(entry.id)
}

/** Cache keys for bootstrap / read cache */
export const CACHE_KEYS = {
  ACCOUNTS: 'accounts',
  ACCOUNTS_ACTIVE: 'accounts:active',
  CATEGORY_TREE: (type) => (type ? `categoryTree:${type}` : 'categoryTree'),
  CATEGORIES: (type) => (type ? `categories:${type}` : 'categories'),
  CURRENCIES_TENANT: 'currencies:tenant',
  DEFAULT_CURRENCY: 'defaultCurrency',
  PRIMARY_ACCOUNT: 'primaryAccount'
}

/** Invalidate accounts and/or category caches after mutations (e.g. from sync). */
export async function invalidateAccountingCache(options = {}) {
  const { accounts = true, categories = true } = options
  if (accounts) await db.accounts.clear()
  if (categories) await db.category_trees.clear()
}

export { db }
