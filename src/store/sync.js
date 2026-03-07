import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getPendingWrites } from '@/db/pendingWrites'
import { runSync } from '@/utils/syncWorker'

export const useSyncStore = defineStore('sync', () => {
  const pendingCount = ref(0)
  /** @type {import('vue').Ref<Set<number|string>>} */
  const invalidatedAccountIds = ref(new Set())
  /** Timestamp when a pending transaction completed; transaction list should refetch. */
  const transactionListInvalidatedAt = ref(0)
  /** When create transaction is queued (network error), pass to list to add one row. */
  const lastQueuedTransaction = ref(null)

  async function refreshPendingCount() {
    const entries = await getPendingWrites()
    pendingCount.value = entries.length
  }

  function addInvalidatedAccountIds(ids) {
    const set = invalidatedAccountIds.value
    for (const id of ids) {
      if (id != null) set.add(Number(id))
    }
    invalidatedAccountIds.value = new Set(set)
  }

  function clearInvalidatedAccountId(id) {
    const set = new Set(invalidatedAccountIds.value)
    set.delete(Number(id))
    invalidatedAccountIds.value = set
  }

  function clearAllInvalidated() {
    invalidatedAccountIds.value = new Set()
  }

  function setTransactionListInvalidated() {
    transactionListInvalidatedAt.value = Date.now()
  }

  function setLastQueuedTransaction(entry) {
    lastQueuedTransaction.value = entry
  }

  function consumeLastQueuedTransaction() {
    const entry = lastQueuedTransaction.value
    lastQueuedTransaction.value = null
    return entry
  }

  const hasPendingSync = computed(() => pendingCount.value > 0)

  async function syncNow() {
    await runSync()
    await refreshPendingCount()
  }

  return {
    pendingCount,
    invalidatedAccountIds: computed(() => invalidatedAccountIds.value),
    transactionListInvalidatedAt,
    hasPendingSync,
    refreshPendingCount,
    addInvalidatedAccountIds,
    clearInvalidatedAccountId,
    clearAllInvalidated,
    setTransactionListInvalidated,
    setLastQueuedTransaction,
    consumeLastQueuedTransaction,
    syncNow
  }
})
