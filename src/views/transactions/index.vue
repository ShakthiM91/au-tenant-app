<template>
  <ion-page class="transactions-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="page-container">
        <!-- Header (Accounts Ledger design style) -->
        <div class="top-header">
          <button class="back-btn" @click="$router.back()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="header-center">
            <span class="header-title">Transactions</span>
            <span class="header-subtitle">All transactions</span>
          </div>
          <div class="header-actions">
            <button class="icon-btn" @click="filterMode = filterMode === 'search' ? '' : 'search'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <button class="icon-btn" @click="filterMode = filterMode === 'calendar' ? '' : 'calendar'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Search Bar (Accounts Ledger Page Search Active) -->
        <div v-if="filterMode === 'search'" class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search transactions..."
            class="search-input"
          />
        </div>

        <!-- Calendar / Date Range (single picker) -->
        <div v-if="filterMode === 'calendar'" class="date-range-bar">
          <button type="button" class="date-range-input" @click="showDatePicker = true">
            <svg class="calendar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {{ dateRangeLabel }}
          </button>
          <button v-if="dateFrom || dateTo" class="clear-dates-btn" @click="clearDates">Clear</button>
        </div>

        <DateRangePicker
          :model-value="{ from: dateFrom, to: dateTo }"
          :visible="showDatePicker"
          @close="showDatePicker = false"
          @select="onDateRangeSelect"
        />

        <!-- Summary Grid -->
        <div class="summary-grid">
          <div class="sum-cell">
            <span class="sum-label">Income</span>
            <span class="sum-val positive">{{ formatCurrency(summary.total_income) }}</span>
          </div>
          <div class="sum-cell">
            <span class="sum-label">Expense</span>
            <span class="sum-val negative">{{ formatCurrency(summary.total_expense) }}</span>
          </div>
          <div class="sum-cell">
            <span class="sum-label">Net</span>
            <span class="sum-val" :class="net >= 0 ? 'positive' : 'negative'">{{ formatCurrency(net) }}</span>
          </div>
        </div>

        <!-- Type Filter -->
        <div class="filter-bar">
          <button
            v-for="f in typeFilterOptions"
            :key="f.value"
            class="filter-chip"
            :class="{ active: listQuery.type === f.value }"
            @click="setTypeFilter(f.value)"
          >
            {{ f.label }}
          </button>
        </div>

        <!-- Entry count -->
        <div v-if="!loading && displayList.length" class="entry-count-wrapper">
          <span class="entry-count-line" />
          <span class="entry-count">Showing {{ displayList.length }} entries</span>
          <span class="entry-count-line" />
        </div>

        <!-- Transaction List (grouped by day) -->
        <div v-if="!loading && groupedByDate.length" class="transactions-list">
          <div
            v-for="group in groupedByDate"
            :key="group.dateKey"
            class="day-group"
          >
            <div class="day-header">{{ group.dateLabel }}</div>
            <div class="day-card">
              <div
                v-for="(row, idx) in group.items"
                :key="row.id"
                class="transaction-row"
                :class="{ 'has-separator': idx < group.items.length - 1 }"
                @click="onRowClick(row)"
              >
                <div class="tx-main">
                  <div class="tx-row-top">
                    <span class="tx-description">{{ row.title || row.transaction_number || '-' }}</span>
                    <span class="tx-top-right">
                      <ion-icon v-if="row._pending" :icon="cloudOfflineOutline" class="pending-icon" title="Not synced" />
                      <span class="tx-amount" :class="amountClass(row.type)">
                        {{ formatAmountShort(row) }}
                      </span>
                      <button class="more-btn" @click.stop="openRowOptions(row)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#6E6A7C">
                          <circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/>
                        </svg>
                      </button>
                    </span>
                  </div>
                  <div class="tx-row-bottom">
                    <span class="tx-user-line">
                      <svg class="person-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                      </svg>
                      {{ getUserLabel(row) }} <strong>at</strong> {{ formatTime(row.transaction_date) }}
                    </span>
                    <span class="tx-category-pill">{{ getCategoryLabel(row) }}</span>
                    <span v-if="formatBalance(row)" class="tx-balance">{{ formatBalance(row) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="loading && list.length === 0" class="loading-state">
          <ion-spinner name="crescent" />
        </div>

        <div v-else-if="!loading && displayList.length === 0" class="empty-state">
          <p>No transactions</p>
        </div>

        <!-- Infinite scroll -->
        <div v-if="hasMore && !loading" class="load-more">
          <ion-spinner v-if="loadingMore" name="crescent" />
          <button v-else class="load-more-btn" @click="loadMore">Load more</button>
        </div>
      </div>
      <div class="tab-spacer" />
    </ion-content>

    <FloatingAddButton @select="onFabSelect" />

  </ion-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonSpinner, IonIcon, onIonViewDidEnter } from '@ionic/vue'
import { cloudOfflineOutline } from 'ionicons/icons'
import { showToast, showActionSheet, showConfirmDialog } from '@/utils/ionicFeedback'
import { getTransactions, deleteTransaction, getSummary } from '@/api/accounting'
import { getTenantDefaultCurrency } from '@/api/currency'
import { getPendingWrites, deleteEntry } from '@/db/pendingWrites'
import { useSyncStore } from '@/store/sync'
import { refreshBootstrapCache } from '@/utils/bootstrapCache'
import FloatingAddButton from '@/components/dashboard/FloatingAddButton.vue'

import DateRangePicker from '@/components/DateRangePicker.vue'

const router = useRouter()
const syncStore = useSyncStore()
const list = ref([])
const listQuery = ref({ type: '', limit: 30, offset: 0 })
const summary = ref({ total_income: 0, total_expense: 0 })
const defaultCurrency = ref({ code: 'USD' })
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
const filterMode = ref('') // '' | 'search' | 'calendar'
const searchQuery = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const showDatePicker = ref(false)

const typeFilterOptions = [
  { label: 'All', value: '' },
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
  { label: 'Transfer', value: 'transfer' }
]

function isTransactionEntry(entry) {
  return entry.method === 'POST' && typeof entry.url === 'string' && entry.url.includes('transactions')
}

function pendingEntryToRow(entry) {
  const p = entry.payload || {}
  const dateVal = p.transaction_date || ''
  return {
    id: 'pending_' + entry.id,
    _pending: true,
    _pendingId: entry.id,
    transaction_number: p.transaction_number || '-',
    title: p.title || '',
    transaction_date: dateVal,
    type: p.type || 'expense',
    amount: p.amount ?? 0,
    currency: p.currency || defaultCurrency.value?.code || 'USD',
    category_name: p.category_name || '-',
    category: p.category_name || '-'
  }
}

function payloadToRow(id, payload) {
  const p = payload || {}
  const dateVal = p.transaction_date || ''
  return {
    id: 'pending_' + id,
    _pending: true,
    _pendingId: id,
    transaction_number: p.transaction_number || '-',
    title: p.title || '',
    transaction_date: dateVal,
    type: p.type || 'expense',
    amount: p.amount ?? 0,
    currency: p.currency || defaultCurrency.value?.code || 'USD',
    category_name: p.category_name || '-',
    category: p.category_name || '-'
  }
}

const net = computed(() => (summary.value.total_income || 0) - (summary.value.total_expense || 0))

const hasMore = computed(() => !finished.value)

const displayList = computed(() => {
  let items = list.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    items = items.filter(r =>
      (r.title || '').toLowerCase().includes(q) ||
      (r.transaction_number || '').toLowerCase().includes(q) ||
      (r.category_name || r.category || '').toLowerCase().includes(q)
    )
  }
  return items
})

/** Normalize any date string to YYYY-MM-DD for consistent grouping by calendar day */
function toDateKey(dateStr) {
  if (!dateStr) return 'unknown'
  const parsed = new Date(typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr)
  if (Number.isNaN(parsed.getTime())) return 'unknown'
  const y = parsed.getFullYear()
  const m = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Group transactions by date (newest first) */
const groupedByDate = computed(() => {
  const items = displayList.value
  const groups = new Map()
  for (const row of items) {
    const dateKey = toDateKey(row.transaction_date)
    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        dateKey,
        dateLabel: formatDateHeader(dateKey),
        items: []
      })
    }
    groups.get(dateKey).items.push(row)
  }
  return Array.from(groups.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey))
})

const dateRangeLabel = computed(() => {
  if (dateFrom.value && dateTo.value) {
    const f = new Date(dateFrom.value)
    const t = new Date(dateTo.value)
    const fmt = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    return dateFrom.value === dateTo.value ? fmt(f) : `${fmt(f)} – ${fmt(t)}`
  }
  return 'Select date range'
})

function onDateRangeSelect({ from, to }) {
  dateFrom.value = from
  dateTo.value = to || from
  onFilter()
}

function formatDateHeader(s) {
  if (!s) return '-'
  const d = new Date(s.split(' ')[0] || s.split('T')[0])
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatCurrency(v, code) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code || defaultCurrency.value?.code || 'USD',
    minimumFractionDigits: 2
  }).format(v || 0)
}

function formatDate(s) {
  if (!s) return '-'
  const d = new Date(s)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getCategoryLabel(row) {
  return row.category_name || row.category || '-'
}

function formatAmountShort(row) {
  const amt = formatCurrency(row.amount, row.currency)
  if (row.type === 'income') return amt
  if (row.type === 'transfer') return `→ ${amt}`
  return amt
}

function formatTime(s) {
  if (!s) return '-'
  const d = new Date(s.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return '-'
  const h = d.getHours()
  const m = d.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function getUserLabel(row) {
  // TODO: resolve created_by to user name when API provides it
  return row.created_by_name || row.user_name || 'Me'
}

function formatBalance(row) {
  // TODO: API does not return balance_after for transactions list; add when available
  if (row.balance_after != null) {
    return formatCurrency(row.balance_after, row.currency)
  }
  return ''
}

function amountClass(type) {
  if (type === 'income') return 'income'
  if (type === 'transfer') return 'transfer'
  return 'expense'
}

async function loadPendingRows() {
  const typeFilter = listQuery.value.type || ''
  try {
    const entries = await getPendingWrites()
    const transactionEntries = entries.filter(isTransactionEntry)
    const filtered = typeFilter
      ? transactionEntries.filter((e) => (e.payload?.type || '') === typeFilter)
      : transactionEntries
    return filtered.map(pendingEntryToRow)
  } catch (_) {
    return []
  }
}

function mergeAndSort(pendingRows, serverData) {
  const merged = [...pendingRows, ...serverData]
  const sortByDate = (a, b) => {
    const da = (a.transaction_date || '').replace(' ', 'T')
    const db = (b.transaction_date || '').replace(' ', 'T')
    return new Date(db) - new Date(da)
  }
  merged.sort(sortByDate)
  return merged
}

async function load(append = false) {
  if (append) loadingMore.value = true
  else loading.value = true
  try {
    const params = { ...listQuery.value }
    if (dateFrom.value) params.start_date = dateFrom.value
    if (dateTo.value) params.end_date = dateTo.value
    const res = await getTransactions(params)
    const data = res?.data || []
    if (!append) {
      const pendingRows = await loadPendingRows()
      list.value = mergeAndSort(pendingRows, data)
    } else {
      list.value.push(...data)
    }
    listQuery.value.offset += data.length
    finished.value = data.length < (listQuery.value.limit || 30)
  } catch (e) {
    showToast('Failed to load')
    finished.value = true
    if (!append) list.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function fetchSummary() {
  try {
    const res = await getSummary()
    if (res?.success && res?.data) summary.value = res.data
  } catch (_) {}
}

function setTypeFilter(value) {
  listQuery.value.type = value
  onFilter()
}

function clearDates() {
  dateFrom.value = ''
  dateTo.value = ''
  onFilter()
}

async function onFilter() {
  listQuery.value.offset = 0
  finished.value = false
  await load()
}

async function loadMore() {
  await load(true)
}

async function refreshData() {
  listQuery.value.offset = 0
  finished.value = false
  await Promise.all([load(), fetchSummary()])
}

function onRowClick(row) {
  if (row._pending) {
    showToast('Syncing when online')
    return
  }
  router.push(`/transactions/${row.id}`)
}

async function openRowOptions(row) {
  const buttons = row._pending
    ? [{ text: 'Remove from queue', role: 'remove-queue' }, { text: 'Cancel', role: 'cancel' }]
    : [
        { text: 'Edit', role: 'edit' },
        { text: 'Delete', role: 'delete' },
        { text: 'Cancel', role: 'cancel' }
      ]
  const role = await showActionSheet({ header: 'Transaction', buttons })
  if (role === 'remove-queue' && row._pendingId) {
    try {
      await deleteEntry(row._pendingId)
      showToast('Removed from queue')
      await refreshData()
    } catch (e) {
      showToast(e?.message || 'Failed')
    }
  } else if (role === 'edit' && !row._pending) {
    router.push(`/transactions/${row.id}`)
  } else if (role === 'delete' && !row._pending) {
    try {
      await showConfirmDialog({ title: 'Delete', message: `Delete "${row.transaction_number || row.title}"?` })
      await deleteTransaction(row.id)
      showToast('Deleted')
      await refreshData()
    } catch (e) {
      if (e !== 'cancel') showToast(e?.message || 'Delete failed')
    }
  }
}

async function onFabSelect(type) {
  router.push(`/transactions/create?type=${type}`)
}


watch([dateFrom, dateTo], () => {
  if (filterMode.value === 'calendar' && (dateFrom.value || dateTo.value)) {
    onFilter()
  }
})

watch(
  () => syncStore.transactionListInvalidatedAt,
  (val) => {
    if (val > 0) refreshData()
  }
)

onIonViewDidEnter(() => {
  const queued = syncStore.consumeLastQueuedTransaction()
  if (queued) {
    const row = payloadToRow(queued.id, queued.payload)
    const typeFilter = listQuery.value.type || ''
    if (!typeFilter || row.type === typeFilter) {
      list.value = mergeAndSort([row], list.value)
    }
  } else {
    refreshData()
  }
  refreshBootstrapCache().catch(() => {})
})

onMounted(async () => {
  try {
    const r = await getTenantDefaultCurrency()
    const c = r?.data?.data ?? r?.data
    if (c?.code) defaultCurrency.value = c
  } catch (_) {}
})
</script>

<style scoped>
.transactions-page {
  --background: #F5F5F7;
}

.transactions-page ion-content {
  --background: #F5F5F7;
}

.page-container {
  padding: 0 16px;
  padding-top: env(safe-area-inset-top, 20px);
}

.top-header {
  display: flex;
  align-items: center;
  padding: 10px 0;
  gap: 8px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  -webkit-tap-highlight-color: transparent;
}

.header-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header-title {
  font-size: 16px;
  font-weight: 700;
  color: #1A1A2E;
}

.header-subtitle {
  font-size: 11px;
  color: #A7A7A7;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  -webkit-tap-highlight-color: transparent;
}

.search-bar {
  margin-bottom: 10px;
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #E8E8E8;
  background: #fff;
  font-size: 14px;
  color: #1A1A2E;
  outline: none;
  box-sizing: border-box;
  max-width: 100%;
  min-width: 0;
}

.date-range-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.date-range-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #E8E8E8;
  background: #fff;
  font-size: 14px;
  color: #1A1A2E;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.date-range-input:focus {
  outline: none;
  border-color: #FF8D28;
}

.date-range-input .calendar-icon {
  color: #FF8D28;
  flex-shrink: 0;
}

.clear-dates-btn {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #E8E8E8;
  background: #fff;
  font-size: 13px;
  color: #6E6A7C;
  cursor: pointer;
}

.summary-grid {
  display: flex;
  justify-content: space-between;
  background: #fff;
  border-radius: 14px;
  padding: 14px 12px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.sum-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.sum-label {
  font-size: 10px;
  color: #A7A7A7;
  text-transform: uppercase;
}

.sum-val {
  font-size: 13px;
  font-weight: 700;
  color: #1A1A2E;
}

.sum-val.positive {
  color: #52BF90;
}

.sum-val.negative {
  color: rgba(195, 0, 16, 0.74);
}

.filter-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.filter-bar::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #E8E8E8;
  background: #fff;
  font-size: 12px;
  font-weight: 500;
  color: #6E6A7C;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}

.filter-chip.active {
  background: #FF8D28;
  color: #fff;
  border-color: #FF8D28;
}

.entry-count-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.entry-count-line {
  flex: 1;
  height: 1px;
  background: #E0E0E0;
}

.entry-count {
  font-size: 12px;
  color: #A7A7A7;
  white-space: nowrap;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.day-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.day-header {
  font-size: 13px;
  font-weight: 500;
  color: #6E6A7C;
  padding-left: 4px;
}

.day-card {
  background: #fff;
  border-radius: 16px;
  padding: 0 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.transaction-row {
  position: relative;
  padding: 12px 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.transaction-row:active {
  background: #FAFAFA;
  margin: 0 -14px;
  padding: 12px 14px;
}

.tx-main {
  flex: 1;
  min-width: 0;
}

.tx-row-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 6px;
}

.tx-description {
  font-size: 15px;
  font-weight: 700;
  color: #1A1A2E;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-top-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.tx-amount {
  font-size: 15px;
  font-weight: 700;
}

.tx-amount.income {
  color: #52BF90;
}

.tx-amount.expense {
  color: rgba(195, 0, 16, 0.74);
}

.tx-amount.transfer {
  color: #1989fa;
}

.tx-row-bottom {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.tx-user-line {
  font-size: 12px;
  color: #6E6A7C;
}

.tx-user-line .person-icon {
  vertical-align: middle;
  margin-right: 4px;
  color: #FF8D28;
}

.tx-user-line strong {
  color: #1A1A2E;
  font-weight: 600;
}

.tx-category-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  background: #F0F0F0;
  font-size: 11px;
  font-weight: 500;
  color: #6E6A7C;
}

.tx-balance {
  margin-left: auto;
  font-size: 11px;
  color: #A7A7A7;
}

.pending-icon {
  font-size: 18px;
  color: #A7A7A7;
}

.more-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  -webkit-tap-highlight-color: transparent;
}

.transaction-row.has-separator {
  border-bottom: 1px solid #F0F0F0;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.empty-state {
  text-align: center;
  padding: 48px 0;
}

.empty-state p {
  font-size: 14px;
  color: #A7A7A7;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.load-more-btn {
  background: #fff;
  border: 1px solid #E8E8E8;
  border-radius: 10px;
  padding: 8px 24px;
  font-size: 13px;
  color: #6E6A7C;
  cursor: pointer;
}

.tab-spacer {
  height: 80px;
}
</style>
