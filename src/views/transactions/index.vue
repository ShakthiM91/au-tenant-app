<template>
  <ion-page class="transactions-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="page-container">
        <!-- Header (Accounts Ledger design style) -->
        <div class="top-header">
          <button type="button" class="back-btn" @click="$router.back()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8D28" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="header-center">
            <span class="header-title">Transactions</span>
            <span class="header-subtitle">{{ workspaceName || 'All transactions' }}</span>
          </div>
        </div>

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

        <!-- Filter row (same pattern as Flow Log) -->
        <div class="ledger-filter-row" :class="{ 'ledger-filter-row--search-open': filterMode === 'search' }">
          <div
            class="ledger-filter-search-slot"
            :class="{ 'ledger-filter-search-slot--expanded': filterMode === 'search' }"
          >
            <button
              type="button"
              class="filter-pill filter-pill-icon"
              :class="{ active: filterMode === 'search' }"
              aria-label="Search"
              @click="toggleSearchMode"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8D28" stroke-width="2" stroke-linecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <input
              v-if="filterMode === 'search'"
              ref="searchInputRef"
              v-model="searchQuery"
              type="search"
              class="ledger-inline-search-input"
              placeholder="Search transactions…"
              enterkeyhint="search"
              autocapitalize="off"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
          <div class="ledger-filter-trailing">
            <button
              type="button"
              class="filter-pill filter-pill-date"
              :class="{ active: !!(dateFrom || dateTo) }"
              @click="openDateFilter"
            >
              <svg class="filter-pill-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <svg class="filter-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div class="filter-pill-wrap">
              <button
                type="button"
                class="filter-pill filter-pill-grow"
                :class="{ active: categoryMenuOpen || categoryFilterIds.length > 0 }"
                @click.stop="openCategoryMenu"
              >
                <span class="filter-pill-label filter-pill-label-truncate">{{ categoryButtonLabel }}</span>
                <svg class="filter-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div v-if="categoryMenuOpen" class="filter-flyout filter-flyout-categories" @click.stop>
                <div v-if="categoriesLoading && !categoryMenuOptions.length" class="filter-flyout-loading">
                  Loading…
                </div>
                <template v-else>
                  <label class="filter-flyout-row">
                    <input
                      type="checkbox"
                      class="filter-flyout-cb"
                      :checked="categoryFilterIds.length === 0"
                      @change="onAllCategoriesCheckboxChange"
                    />
                    <span class="filter-flyout-row-text">All categories</span>
                  </label>
                  <label
                    v-for="opt in categoryMenuOptions"
                    :key="opt.id"
                    class="filter-flyout-row"
                  >
                    <input
                      type="checkbox"
                      class="filter-flyout-cb"
                      :checked="isCategoryFilterSelected(opt.id)"
                      @change="onCategoryCheckboxChange(opt.id, $event)"
                    />
                    <span class="filter-flyout-row-text">{{ opt.label }}</span>
                  </label>
                </template>
              </div>
            </div>
            <div class="filter-pill-wrap filter-pill-wrap-type">
              <button
                type="button"
                class="filter-pill filter-pill-grow filter-pill-type-btn"
                :class="{ active: typeMenuOpen || flowTypeFilterValues.length > 0 }"
                @click.stop="openTypeMenu"
              >
                <span class="filter-pill-label filter-pill-label-truncate">{{ flowTypeButtonLabel }}</span>
                <svg class="filter-caret-solid" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
                  <path fill="#A8A8A8" d="M0 0h10L5 6z"/>
                </svg>
              </button>
              <div v-if="typeMenuOpen" class="filter-flyout filter-flyout-type" @click.stop>
                <label class="filter-flyout-row">
                  <input
                    type="checkbox"
                    class="filter-flyout-cb"
                    :checked="flowTypeFilterValues.length === 0"
                    @change="onAllFlowTypesCheckboxChange"
                  />
                  <span class="filter-flyout-row-text">All types</span>
                </label>
                <label
                  v-for="f in filterTypeOptions"
                  :key="f.value"
                  class="filter-flyout-row"
                >
                  <input
                    type="checkbox"
                    class="filter-flyout-cb"
                    :checked="isFlowTypeFilterSelected(f.value)"
                    @change="onFlowTypeCheckboxChange(f.value, $event)"
                  />
                  <span class="filter-flyout-row-text">{{ f.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <Transition name="fade">
          <div
            v-if="categoryMenuOpen || typeMenuOpen"
            class="filter-menu-backdrop"
            @click="closeFilterMenus"
          />
        </Transition>

        <DateRangePicker
          :model-value="{ from: dateFrom, to: dateTo }"
          :visible="showDatePicker"
          @close="showDatePicker = false"
          @select="onDateRangeSelect"
        />

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
                      <button
                        v-if="rowHasOverflowActions(row)"
                        class="more-btn"
                        @click.stop="openRowOptions(row)"
                      >
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

    <FloatingAddButton v-if="transactionsFabVisible" @select="onFabSelect" />

  </ion-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IonPage, IonContent, IonSpinner, IonIcon, onIonViewDidEnter } from '@ionic/vue'
import { cloudOfflineOutline } from 'ionicons/icons'
import { showToast, showActionSheet, showConfirmDialog } from '@/utils/ionicFeedback'
import { getTransactions, deleteTransaction, getSummary, getCategoryTree } from '@/api/accounting'
import { getWorkspaces, getSharedWorkspaces } from '@/api/workspace'
import { getTenantDefaultCurrency } from '@/api/currency'
import { getPendingWrites, deleteEntry } from '@/db/pendingWrites'
import { useSyncStore } from '@/store/sync'
import { refreshBootstrapCache } from '@/utils/bootstrapCache'
import FloatingAddButton from '@/components/dashboard/FloatingAddButton.vue'

import DateRangePicker from '@/components/DateRangePicker.vue'

const router = useRouter()
const route = useRoute()
const syncStore = useSyncStore()

const workspaceId = computed(() => {
  const id = route.query.workspace_id
  return id != null && id !== '' ? id : null
})
const workspaceName = computed(() => {
  const name = route.query.workspace_name
  return name ? decodeURIComponent(name) : null
})

const resolvedWorkspaceId = computed(() => {
  const id = workspaceId.value
  if (id == null || id === '') return null
  const n = Number(id)
  return Number.isNaN(n) ? null : n
})

/** Hide FAB when viewing another tenant’s workspace with view-only merged scope. */
const transactionsFabVisible = ref(true)
/** Merged permission_scope when `workspace_id` is in the route (island transaction log). */
const listWorkspacePermissionScope = ref(null)

function listScopeAllowsTransactionEdit(scope) {
  if (!scope) return true
  return !!(scope.edit_transaction || scope.full_access || scope.implicit_full)
}

/** Delete: full_access or workspace owner/admin/creator (implicit_full), not edit-only. */
function listScopeAllowsTransactionDelete(scope) {
  if (!scope) return true
  return !!(scope.full_access || scope.implicit_full)
}

async function refreshWorkspaceListPermissions() {
  const widRaw = workspaceId.value
  listWorkspacePermissionScope.value = null
  if (widRaw == null || widRaw === '') {
    transactionsFabVisible.value = true
    return
  }
  const wid = Number(widRaw)
  if (Number.isNaN(wid)) {
    transactionsFabVisible.value = true
    return
  }
  try {
    const [ownRes, sharedRes] = await Promise.all([getWorkspaces(), getSharedWorkspaces()])
    const own = Array.isArray(ownRes?.data) ? ownRes.data : []
    const shared = Array.isArray(sharedRes?.data?.active) ? sharedRes.data.active : []
    const row = own.find((w) => Number(w.id) === wid) || shared.find((w) => Number(w.id) === wid)
    const s = row?.permission_scope ?? null
    listWorkspacePermissionScope.value = s
    if (!s) {
      transactionsFabVisible.value = true
      return
    }
    transactionsFabVisible.value = !!(s.add_transaction || s.full_access || s.implicit_full)
  } catch {
    listWorkspacePermissionScope.value = null
    transactionsFabVisible.value = true
  }
}
const list = ref([])
const listQuery = ref({ limit: 30, offset: 0 })
const summary = ref({ total_income: 0, total_expense: 0 })
const defaultCurrency = ref({ code: 'USD' })
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
const filterMode = ref('') // '' | 'search'
const searchQuery = ref('')
const searchInputRef = ref(null)
const dateFrom = ref('')
const dateTo = ref('')
const showDatePicker = ref(false)
/** Selected flow-style types; empty = all. Maps to API `types` (transfer_in/out → transfer). */
const flowTypeFilterValues = ref([])
const categoryFilterIds = ref([])
const categoryMenuOptions = ref([])
const categoriesLoading = ref(false)
const categoryMenuOpen = ref(false)
const typeMenuOpen = ref(false)

const filterTypeOptions = [
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
  { label: 'Transfer In', value: 'transfer_in' },
  { label: 'Transfer Out', value: 'transfer_out' }
]

const categoryButtonLabel = computed(() => {
  const ids = categoryFilterIds.value
  if (!ids.length) return 'Category'
  if (ids.length === 1) {
    const label = categoryMenuOptions.value.find((o) => o.id === ids[0])?.label ?? ''
    if (!label) return 'Category'
    return label.length > 16 ? `${label.slice(0, 14)}…` : label
  }
  return `${ids.length} categories`
})

const flowTypeButtonLabel = computed(() => {
  const sel = flowTypeFilterValues.value
  if (!sel.length) return 'Type'
  if (sel.length === 1) {
    const f = filterTypeOptions.find((o) => o.value === sel[0])
    const label = f?.label ?? sel[0]
    return label.length > 16 ? `${label.slice(0, 14)}…` : label
  }
  return `${sel.length} types`
})

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

const displayList = computed(() => list.value)

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

function pendingMatchesTypeFilter(rowType) {
  const sel = flowTypeFilterValues.value
  if (!sel.length) return true
  const allowed = new Set()
  for (const v of sel) {
    if (v === 'transfer_in' || v === 'transfer_out') allowed.add('transfer')
    else allowed.add(v)
  }
  return allowed.has(rowType)
}

function normalizeCategoryTreeResponse(res) {
  const data = res?.data ?? (res?.success ? res?.data : []) ?? []
  return Array.isArray(data) ? data : []
}

function filterActiveCategoriesForMenu(categories) {
  return (categories || [])
    .filter((cat) => cat.is_active !== false)
    .map((cat) => ({
      ...cat,
      children: cat.children?.length ? filterActiveCategoriesForMenu(cat.children) : []
    }))
}

function flattenCategoryLabels(arr, prefix = '') {
  const out = []
  for (const c of arr || []) {
    const label = prefix ? `${prefix} > ${c.name}` : c.name
    out.push({ id: Number(c.id), label })
    if (c.children?.length) out.push(...flattenCategoryLabels(c.children, label))
  }
  return out
}

async function loadCategoryMenu() {
  categoriesLoading.value = true
  try {
    const wsId = resolvedWorkspaceId.value
    const [incomeRes, expenseRes] = await Promise.all([
      getCategoryTree('income', wsId),
      getCategoryTree('expense', wsId)
    ])
    const incomeData = filterActiveCategoriesForMenu(normalizeCategoryTreeResponse(incomeRes))
    const expenseData = filterActiveCategoriesForMenu(normalizeCategoryTreeResponse(expenseRes))
    const flat = [...flattenCategoryLabels(incomeData), ...flattenCategoryLabels(expenseData)]
    const byId = new Map()
    for (const o of flat) {
      if (!byId.has(o.id)) byId.set(o.id, o)
    }
    categoryMenuOptions.value = [...byId.values()].sort((a, b) => a.label.localeCompare(b.label))
  } catch (_) {
    categoryMenuOptions.value = []
  } finally {
    categoriesLoading.value = false
  }
}

function closeFilterMenus() {
  categoryMenuOpen.value = false
  typeMenuOpen.value = false
}

function openCategoryMenu() {
  typeMenuOpen.value = false
  categoryMenuOpen.value = !categoryMenuOpen.value
}

function openTypeMenu() {
  categoryMenuOpen.value = false
  typeMenuOpen.value = !typeMenuOpen.value
}

function openDateFilter() {
  closeFilterMenus()
  showDatePicker.value = true
}

function isCategoryFilterSelected(id) {
  return categoryFilterIds.value.includes(Number(id))
}

function isFlowTypeFilterSelected(value) {
  return flowTypeFilterValues.value.includes(value)
}

function reloadAfterCategoryChange() {
  onFilter()
}

function reloadAfterFlowTypeChange() {
  onFilter()
}

function onAllCategoriesCheckboxChange(ev) {
  if (ev.target.checked) {
    categoryFilterIds.value = []
    reloadAfterCategoryChange()
    return
  }
  ev.target.checked = true
}

function onCategoryCheckboxChange(id, ev) {
  const n = Number(id)
  const checked = ev.target.checked
  const cur = categoryFilterIds.value
  if (checked && !cur.includes(n)) {
    categoryFilterIds.value = [...cur, n].sort((a, b) => a - b)
  } else if (!checked && cur.includes(n)) {
    categoryFilterIds.value = cur.filter((x) => x !== n)
  }
  reloadAfterCategoryChange()
}

function onAllFlowTypesCheckboxChange(ev) {
  if (ev.target.checked) {
    flowTypeFilterValues.value = []
    reloadAfterFlowTypeChange()
    return
  }
  ev.target.checked = true
}

function onFlowTypeCheckboxChange(value, ev) {
  const checked = ev.target.checked
  const cur = flowTypeFilterValues.value
  if (checked && !cur.includes(value)) {
    flowTypeFilterValues.value = [...cur, value].sort()
  } else if (!checked && cur.includes(value)) {
    flowTypeFilterValues.value = cur.filter((x) => x !== value)
  }
  reloadAfterFlowTypeChange()
}

let searchDebounceTimer = null
function clearSearchDebounce() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
}

async function toggleSearchMode() {
  closeFilterMenus()
  const opening = filterMode.value !== 'search'
  if (!opening) {
    clearSearchDebounce()
    searchQuery.value = ''
  }
  filterMode.value = opening ? 'search' : ''
  if (opening) {
    await nextTick()
    searchInputRef.value?.focus?.()
  } else {
    onFilter()
  }
}

function appendCategoryFilterParams(params) {
  const ids = categoryFilterIds.value
  if (!ids.length) return
  params.category_ids = ids.join(',')
}

function appendTransactionTypesParam(params) {
  const sel = flowTypeFilterValues.value
  if (!sel.length) return
  params.types = sel.join(',')
}

function appendSearchParam(params) {
  if (filterMode.value !== 'search') return
  const q = searchQuery.value.trim()
  if (q) params.search = q
}

async function loadPendingRows() {
  try {
    const entries = await getPendingWrites()
    let transactionEntries = entries.filter(isTransactionEntry)
    transactionEntries = transactionEntries.filter((e) =>
      pendingMatchesTypeFilter(e.payload?.type || 'expense')
    )
    if (filterMode.value === 'search') {
      const q = searchQuery.value.trim().toLowerCase()
      if (q) {
        transactionEntries = transactionEntries.filter((e) => {
          const p = e.payload || {}
          return (
            (p.title || '').toLowerCase().includes(q) ||
            (p.transaction_number || '').toLowerCase().includes(q) ||
            (p.category_name || '').toLowerCase().includes(q)
          )
        })
      }
    }
    if (categoryFilterIds.value.length) {
      const allow = new Set(categoryFilterIds.value)
      transactionEntries = transactionEntries.filter((e) => {
        const cid = e.payload?.category_id
        return cid != null && allow.has(Number(cid))
      })
    }
    return transactionEntries.map(pendingEntryToRow)
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
    const params = {
      limit: listQuery.value.limit,
      offset: append ? listQuery.value.offset : 0
    }
    if (dateFrom.value) params.start_date = dateFrom.value
    if (dateTo.value) params.end_date = dateTo.value
    if (workspaceId.value) params.workspace_id = workspaceId.value
    appendCategoryFilterParams(params)
    appendTransactionTypesParam(params)
    appendSearchParam(params)
    const res = await getTransactions(params)
    const data = res?.data || []
    if (!append) {
      const pendingRows = await loadPendingRows()
      list.value = mergeAndSort(pendingRows, data)
      listQuery.value.offset = data.length
    } else {
      list.value.push(...data)
      listQuery.value.offset += data.length
    }
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
    const params = {}
    if (workspaceId.value != null && workspaceId.value !== '') {
      params.workspace_id = workspaceId.value
    }
    if (dateFrom.value) params.start_date = dateFrom.value
    if (dateTo.value) params.end_date = dateTo.value
    appendCategoryFilterParams(params)
    appendTransactionTypesParam(params)
    appendSearchParam(params)
    const res = await getSummary(params)
    if (res?.success && res?.data) summary.value = res.data
  } catch (_) {}
}

async function onFilter() {
  listQuery.value.offset = 0
  finished.value = false
  await Promise.all([load(), fetchSummary()])
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

function transactionRowActionFlags() {
  const wid = workspaceId.value
  const scoped = wid != null && wid !== ''
  const scope = listWorkspacePermissionScope.value
  const showEdit = !scoped || listScopeAllowsTransactionEdit(scope)
  const showDelete = !scoped || listScopeAllowsTransactionDelete(scope)
  return { showEdit, showDelete }
}

/** More menu: pending rows need “Remove from queue”; otherwise need at least one of Edit/Delete. */
function rowHasOverflowActions(row) {
  if (row._pending) return true
  const { showEdit, showDelete } = transactionRowActionFlags()
  return showEdit || showDelete
}

async function openRowOptions(row) {
  const { showEdit, showDelete } = transactionRowActionFlags()

  const buttons = row._pending
    ? [{ text: 'Remove from queue', role: 'remove-queue' }, { text: 'Cancel', role: 'cancel' }]
    : (() => {
        const opts = []
        if (showEdit) opts.push({ text: 'Edit', role: 'edit' })
        if (showDelete) opts.push({ text: 'Delete', role: 'delete' })
        opts.push({ text: 'Cancel', role: 'cancel' })
        return opts
      })()
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
  const q = new URLSearchParams()
  if (type) q.set('type', type)
  if (workspaceId.value) q.set('workspace_id', workspaceId.value)
  if (workspaceName.value) q.set('workspace_name', encodeURIComponent(workspaceName.value))
  router.push(`/transactions/create?${q.toString()}`)
}


watch(workspaceId, () => {
  refreshWorkspaceListPermissions()
})

watch(
  () => resolvedWorkspaceId.value,
  async (_wid, prev) => {
    await loadCategoryMenu()
    if (prev !== undefined) {
      categoryFilterIds.value = []
      flowTypeFilterValues.value = []
      await onFilter()
    }
  },
  { immediate: true }
)

watch(categoryMenuOptions, (opts) => {
  const valid = new Set(opts.map((o) => o.id))
  const next = categoryFilterIds.value.filter((id) => valid.has(id))
  if (next.length !== categoryFilterIds.value.length) {
    categoryFilterIds.value = next
    onFilter()
  }
})

watch(searchQuery, () => {
  if (filterMode.value !== 'search') return
  clearSearchDebounce()
  searchDebounceTimer = setTimeout(() => {
    searchDebounceTimer = null
    onFilter()
  }, 320)
})

watch(
  () => syncStore.transactionListInvalidatedAt,
  (val) => {
    if (val > 0) refreshData()
  }
)

onIonViewDidEnter(() => {
  refreshWorkspaceListPermissions()
  const queued = syncStore.consumeLastQueuedTransaction()
  if (queued) {
    const row = payloadToRow(queued.id, queued.payload)
    if (pendingMatchesTypeFilter(row.type)) {
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

onUnmounted(() => {
  clearSearchDebounce()
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
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-subtitle {
  font-size: 11px;
  color: #A7A7A7;
}

.summary-grid {
  display: flex;
  justify-content: space-between;
  background: #fff;
  border-radius: 14px;
  padding: 14px 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* Ledger filter row (matches Flow Log) */
.ledger-filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  min-width: 0;
}

.ledger-filter-row--search-open {
  flex-wrap: nowrap;
  gap: 8px;
}

.ledger-filter-search-slot {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  min-width: 0;
}

.ledger-filter-search-slot--expanded {
  flex: 1 1 0;
  min-width: 0;
}

.ledger-inline-search-input {
  flex: 1 1 0;
  min-width: 64px;
  width: 0;
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid #ff8d28;
  background: #fff;
  font-size: 13px;
  color: #1a1a2e;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.ledger-inline-search-input::placeholder {
  color: #a8a8a8;
}

.ledger-inline-search-input:focus {
  border-color: #ff8d28;
  box-shadow: 0 0 0 2px rgba(255, 141, 40, 0.12);
}

.ledger-filter-trailing {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  min-width: 0;
}

.ledger-filter-row--search-open .ledger-filter-trailing {
  margin-left: auto;
}

.ledger-filter-row--search-open .ledger-filter-trailing .filter-pill-grow {
  max-width: 112px;
}

.ledger-filter-row--search-open .ledger-filter-trailing .filter-pill-type-btn {
  max-width: 96px;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 28px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid #ff8d28;
  background: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.filter-pill.active {
  background: rgba(255, 141, 40, 0.08);
}

.filter-pill-icon {
  width: 38px;
  min-width: 38px;
  padding: 0;
}

.filter-pill-date {
  padding: 0 6px 0 8px;
}

.filter-chevron {
  flex-shrink: 0;
}

.filter-pill-wrap {
  position: relative;
  z-index: 55;
}

.filter-pill-label {
  color: #a8a8a8;
  font-weight: 500;
}

.filter-pill-grow {
  min-width: 0;
  max-width: 140px;
  flex: 1 1 auto;
  justify-content: space-between;
  padding: 0 8px 0 10px;
  gap: 6px;
}

.filter-pill-label-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.filter-pill-type-btn {
  max-width: 120px;
  gap: 8px;
  padding-right: 10px;
}

.filter-caret-solid {
  flex-shrink: 0;
  display: block;
}

.filter-flyout {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 100%;
  max-width: min(280px, 90vw);
  max-height: 260px;
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  padding: 6px 0;
  z-index: 60;
}

.filter-flyout-type {
  min-width: 140px;
}

.filter-flyout-categories {
  max-height: min(320px, 55dvh);
}

.filter-flyout-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  margin: 0;
  padding: 10px 14px;
  box-sizing: border-box;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.filter-flyout-row:active {
  background: rgba(0, 0, 0, 0.04);
}

.filter-flyout-cb {
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin: 2px 0 0 0;
  flex-shrink: 0;
  accent-color: #ff8d28;
  cursor: pointer;
}

.filter-flyout-row-text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.72);
  line-height: 1.35;
}

.filter-flyout-loading {
  padding: 12px 14px;
  font-size: 13px;
  color: #a8a8a8;
}

.filter-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: transparent;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
