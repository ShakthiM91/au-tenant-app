<template>
  <ion-page class="flow-log-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="page-container">
        <!-- Header -->
        <div class="top-header">
          <button type="button" class="back-btn" @click="$router.back()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8D28" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="header-center">
            <span class="header-title">{{ accountName }}</span>
            <span class="header-subtitle">Flow Log</span>
          </div>
          <div class="header-actions">
            <button type="button" class="icon-btn" @click="showAccountOptions = true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8D28" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Stats Dashboard -->
        <div v-if="summary" class="stats-dashboard">
          <div class="stat-item">
            <span class="stat-label">Entries</span>
            <span class="stat-value">{{ summary.total_entries ?? 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Income</span>
            <span class="stat-value positive">{{ formatCurrency(summary.total_income, currency) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Expense</span>
            <span class="stat-value negative">{{ formatCurrency(summary.total_expense, currency) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Net</span>
            <span class="stat-value" :class="(summary.net_flow || 0) >= 0 ? 'positive' : 'negative'">
              {{ formatCurrency(summary.net_flow, currency) }}
            </span>
          </div>
        </div>

        <!-- Unified filter row (under dashboard) -->
        <div class="ledger-filter-row">
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
          <button
            type="button"
            class="filter-pill filter-pill-date"
            :class="{ active: filterMode === 'calendar' || !!(dateFrom || dateTo) }"
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
              :class="{ active: typeMenuOpen || !!flowTypeFilter }"
              @click.stop="openTypeMenu"
            >
              <span class="filter-pill-label filter-pill-label-truncate">{{ flowTypeButtonLabel }}</span>
              <svg class="filter-caret-solid" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
                <path fill="#A8A8A8" d="M0 0h10L5 6z"/>
              </svg>
            </button>
            <div v-if="typeMenuOpen" class="filter-flyout filter-flyout-type" @click.stop>
              <button
                v-for="f in filterOptions"
                :key="`${f.label}-${String(f.value)}`"
                type="button"
                class="filter-flyout-item"
                :class="{ selected: flowTypeFilter === f.value }"
                @click="selectFlowType(f.value)"
              >
                {{ f.label }}
              </button>
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

        <div v-if="filterMode === 'search'" class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search transactions..."
            class="search-input"
          />
        </div>

        <div v-if="filterMode === 'calendar'" class="date-range-bar">
          <button type="button" class="date-range-input" @click="showDatePicker = true">
            <svg class="calendar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {{ dateRangeLabel }}
          </button>
          <button v-if="dateFrom || dateTo" type="button" class="clear-dates-btn" @click="clearDates">Clear</button>
        </div>

        <DateRangePicker
          :model-value="{ from: dateFrom, to: dateTo }"
          :visible="showDatePicker"
          @close="showDatePicker = false"
          @select="onDateRangeSelect"
        />

        <!-- Entry count (total from server when paginated) -->
        <div v-if="!loading" class="entry-count">
          Showing {{ flowLogEntriesDisplay }}
        </div>

        <!-- Transactions -->
        <div class="transactions-island" v-if="!loading && displayFlowLog.length">
          <div
            v-for="row in displayFlowLog"
            :key="row.id"
            class="transaction-row"
            @click="openTransactionDetail(row)"
          >
            <div class="tx-icon" :class="flowTypeClass(row.flow_type)">
              <svg v-if="row.flow_type === 'income' || row.flow_type === 'transfer_in'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="7 11 12 6 17 11"/><line x1="12" y1="6" x2="12" y2="18"/>
              </svg>
              <svg v-else-if="row.flow_type === 'expense' || row.flow_type === 'transfer_out'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="7 13 12 18 17 13"/><line x1="12" y1="18" x2="12" y2="6"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/>
              </svg>
            </div>
            <div class="tx-info">
              <span class="tx-description">{{ row.description || formatFlowType(row.flow_type) }}</span>
              <span class="tx-meta">
                {{ formatFlowType(row.flow_type) }} · {{ formatDate(row.transaction_date) }}
                <template v-if="flowCategoryLabel(row)"> · {{ flowCategoryLabel(row) }}</template>
              </span>
            </div>
            <div class="tx-amounts">
              <span class="tx-amount" :class="amountClass(row.flow_type)">
                {{ (row.flow_type === 'income' || row.flow_type === 'transfer_in') ? '+' : '-' }}{{ formatCurrency(row.amount, row.currency) }}
              </span>
              <span class="tx-balance" :class="(row.balance_after || 0) >= 0 ? 'positive' : 'negative'">
                Bal: {{ formatCurrency(row.balance_after, row.currency) }}
              </span>
            </div>
          </div>
        </div>

        <div v-else-if="loading" class="loading-state">
          <ion-spinner name="crescent" />
        </div>

        <div v-else class="empty-state">
          <p>No flow log entries</p>
        </div>

        <!-- Infinite scroll trigger -->
        <div v-if="hasMore && !loading" class="load-more">
          <ion-spinner v-if="loadingMore" name="crescent" />
          <button v-else class="load-more-btn" @click="loadMore">Load more</button>
        </div>
      </div>
      <div class="tab-spacer" />
    </ion-content>

    <!-- Transaction Detail Popup -->
    <ion-modal :is-open="detailVisible" @didDismiss="detailVisible = false" :initial-breakpoint="0.55" :breakpoints="[0, 0.55, 0.85]">
      <ion-content class="detail-modal-content" v-if="selectedTransaction">
        <div class="detail-sheet">
          <div class="detail-handle" />
          <h2 class="detail-title">Transaction Details</h2>

          <div class="detail-grid">
            <div class="detail-cell">
              <div class="detail-cell-label">
                <span class="detail-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></span>
                <span>Transaction ID</span>
              </div>
              <span class="detail-cell-value">{{ selectedTransaction.transaction_number || selectedTransaction.transaction_id || '—' }}</span>
            </div>
            <div class="detail-cell">
              <div class="detail-cell-label">
                <span class="detail-item-icon type-icon" :class="amountClass(selectedTransaction.flow_type)"><svg v-if="isIncomeType(selectedTransaction.flow_type)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 11 12 6 17 11"/><line x1="12" y1="6" x2="12" y2="18"/></svg><svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 13 12 18 17 13"/><line x1="12" y1="18" x2="12" y2="6"/></svg></span>
                <span>Type</span>
              </div>
              <span class="detail-cell-value" :class="amountClass(selectedTransaction.flow_type)">{{ formatFlowType(selectedTransaction.flow_type) }}</span>
            </div>
            <div class="detail-cell">
              <div class="detail-cell-label">
                <span class="detail-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
                <span>Date & time</span>
              </div>
              <span class="detail-cell-value">{{ formatDateAtTime(selectedTransaction.transaction_date) }}</span>
            </div>
            <div class="detail-cell">
              <div class="detail-cell-label">
                <span class="detail-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg></span>
                <span>Status</span>
              </div>
              <span class="detail-cell-value">{{ paymentStatusLabel(selectedTransaction) }}</span>
            </div>
            <div class="detail-cell">
              <div class="detail-cell-label">
                <span class="detail-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg></span>
                <span>Category</span>
              </div>
              <span class="detail-cell-value"><span class="detail-pill">{{ flowCategoryLabel(selectedTransaction) || '—' }}</span></span>
            </div>
            <div class="detail-cell" v-if="detailReferenceLabel(selectedTransaction)">
              <div class="detail-cell-label">
                <span class="detail-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
                <span>Reference</span>
              </div>
              <span class="detail-cell-value">{{ detailReferenceLabel(selectedTransaction) }}</span>
            </div>
          </div>

          <div class="detail-amount-block">
            <span class="detail-amount-full" :class="amountClass(selectedTransaction.flow_type)">{{ formatCurrencyFull(selectedTransaction) }}</span>
          </div>

          <div class="detail-audit" v-if="hasAuditInfo(selectedTransaction)">
            <div class="detail-audit-row" v-if="selectedTransaction.created_by_name">
              <span class="detail-audit-label">Created by</span>
              <div class="detail-audit-right">
                <span class="detail-audit-who">{{ selectedTransaction.created_by_name }}</span>
                <span class="detail-audit-when" v-if="selectedTransaction.created_at">On {{ formatDateAtTime(selectedTransaction.created_at) }}</span>
              </div>
            </div>
            <div class="detail-audit-row" v-if="selectedTransaction.updated_by_name || selectedTransaction.updated_at">
              <span class="detail-audit-label">Last edited by</span>
              <div class="detail-audit-right">
                <span class="detail-audit-who">{{ selectedTransaction.updated_by_name || '—' }}</span>
                <span class="detail-audit-when" v-if="selectedTransaction.updated_at">On {{ formatDateAtTime(selectedTransaction.updated_at) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-actions">
            <button v-if="selectedTransaction.transaction_id" type="button" class="detail-btn detail-btn-edit" @click="goEditTransaction(selectedTransaction)">Edit</button>
            <button type="button" class="detail-btn detail-btn-close" @click="detailVisible = false">Close</button>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Account options -->
    <ion-action-sheet
      :is-open="showAccountOptions"
      :buttons="accountOptionsButtons"
      @didDismiss="onAccountOptionsDismiss"
    />

    <ReconcileModal
      :visible="reconcileVisible"
      :account="reconcileAccount"
      @close="reconcileVisible = false"
      @success="onReconcileSuccess"
    />

    <FloatingAddButton @select="onFabSelect" />

  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonSpinner, IonModal, IonActionSheet } from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getAccountFlowLog, getAccountFlowSummary, getAccountById, getCategoryTree } from '@/api/accounting'
import { useSyncStore } from '@/store/sync'
import ReconcileModal from './components/ReconcileModal.vue'
import FloatingAddButton from '@/components/dashboard/FloatingAddButton.vue'

import DateRangePicker from '@/components/DateRangePicker.vue'

const route = useRoute()
const router = useRouter()
const syncStore = useSyncStore()
const accountId = computed(() => route.params.id)

const accountName = ref('')
const currency = ref('USD')
const loading = ref(false)
const loadingMore = ref(false)
const flowLog = ref([])
const summary = ref(null)
const flowTypeFilter = ref('')
const searchQuery = ref('')
const filterMode = ref('') // '' | 'search' | 'calendar'
const dateFrom = ref('')
const dateTo = ref('')
const showDatePicker = ref(false)
const currentPage = ref(1)
const pageSize = 20
const pagination = ref(null)
const detailVisible = ref(false)
const selectedTransaction = ref(null)
const showAccountOptions = ref(false)
const reconcileVisible = ref(false)
const reconcileAccount = ref(null)
/** Selected category ids (empty = no filter, show all). */
const categoryFilterIds = ref([])
const categoryMenuOptions = ref([])
const categoriesLoading = ref(false)
const accountWorkspaceId = ref(null)
const categoryMenuOpen = ref(false)
const typeMenuOpen = ref(false)

const workspaceIdFromQuery = computed(() => {
  const id = route.query.workspace_id
  return id != null && id !== '' ? Number(id) : null
})

const resolvedWorkspaceId = computed(() => workspaceIdFromQuery.value ?? accountWorkspaceId.value)

const filterOptions = [
  { label: 'All', value: '' },
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
  { label: 'Transfer In', value: 'transfer_in' },
  { label: 'Transfer Out', value: 'transfer_out' },
  { label: 'Initial', value: 'initial_balance' }
]

const categoryButtonLabel = computed(() => {
  const ids = categoryFilterIds.value
  if (!ids.length) return 'Category'
  if (ids.length === 1) {
    const label = categoryMenuOptions.value.find(o => o.id === ids[0])?.label ?? ''
    if (!label) return 'Category'
    return label.length > 16 ? `${label.slice(0, 14)}…` : label
  }
  return `${ids.length} categories`
})

const flowTypeButtonLabel = computed(() => {
  const f = filterOptions.find(o => o.value === flowTypeFilter.value)
  return f?.label ?? 'All'
})

const accountOptionsButtons = [
  { text: 'Reconcile Balance', role: 'reconcile' },
  { text: 'Add Transaction', role: 'add-transaction' },
  { text: 'All Transactions', role: 'all-transactions' },
  { text: 'Edit Account', role: 'edit' },
  { text: 'Cancel', role: 'cancel' }
]

const hasMore = computed(() => {
  if (!pagination.value) return false
  return flowLog.value.length < (pagination.value.total || 0)
})

/** Flow log `category` is resolved on the server from `category_id` when the text column is empty. */
function flowCategoryLabel(row) {
  if (!row) return ''
  const c = row.category
  return c != null && String(c).trim() !== '' ? String(c).trim() : ''
}

const filteredFlowLog = computed(() => {
  if (!searchQuery.value) return flowLog.value
  const q = searchQuery.value.toLowerCase()
  return flowLog.value.filter(r =>
    (r.description || '').toLowerCase().includes(q) ||
    flowCategoryLabel(r).toLowerCase().includes(q)
  )
})

/** Client-side search only; category filter is applied on the server (pagination). */
const displayFlowLog = computed(() => filteredFlowLog.value)

const flowLogEntriesDisplay = computed(() => {
  const t = pagination.value?.total
  const n = t != null ? Number(t) : flowLog.value.length
  return `${n} ${n === 1 ? 'entry' : 'entries'}`
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
  load()
}

function formatCurrency(amount, cur) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: cur || currency.value || 'USD',
    minimumFractionDigits: 2
  }).format(amount ?? 0)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateAtTime(dateString) {
  if (!dateString) return '—'
  const d = new Date(dateString.replace(' ', 'T'))
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${date} at ${time}`
}

function isIncomeType(flowType) {
  return flowType === 'income' || flowType === 'transfer_in'
}

function paymentStatusLabel(row) {
  return row.status === 'pending' ? 'Pending' : row.status === 'cancelled' ? 'Cancelled' : 'Paid'
}

function formatCurrencyDetail(row) {
  const cur = row.currency || currency.value || 'USD'
  const sym = cur === 'LKR' ? 'Rs. ' : cur === 'USD' ? '$' : cur + ' '
  const n = Number(row.amount)
  const int = Math.abs(Math.floor(n)).toLocaleString('en-US')
  return (n < 0 ? '-' : '') + sym + int
}

function formatCurrencyDecimals(row) {
  const n = Number(row.amount)
  const dec = (Math.abs(n) % 1).toFixed(2).slice(1)
  return dec
}

function formatCurrencyFull(row) {
  const cur = row.currency || currency.value || 'USD'
  const n = Number(row.amount)
  const sign = isIncomeType(row.flow_type) ? '+' : '-'
  return sign + new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: 2 }).format(Math.abs(n))
}

/** Show Reference only when we have description or a title that isn’t the same as transaction number */
function detailReferenceLabel(row) {
  const desc = (row.description || '').trim()
  const txnNum = row.transaction_number || ''
  if (desc && desc !== txnNum) return desc
  return ''
}

function hasAuditInfo(row) {
  return !!(row.created_by_name || row.updated_by_name || row.updated_at)
}

function formatFlowType(type) {
  const map = {
    income: 'Income', expense: 'Expense',
    transfer_in: 'Transfer In', transfer_out: 'Transfer Out',
    adjustment: 'Adjustment', initial_balance: 'Initial'
  }
  return map[type] || type || '-'
}

function amountClass(type) {
  if (type === 'income' || type === 'transfer_in') return 'positive'
  if (type === 'expense' || type === 'transfer_out') return 'negative'
  return ''
}

function flowTypeClass(type) {
  if (type === 'income' || type === 'transfer_in') return 'income'
  if (type === 'expense' || type === 'transfer_out') return 'expense'
  return 'neutral'
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

function selectFlowType(value) {
  flowTypeFilter.value = value
  typeMenuOpen.value = false
  currentPage.value = 1
  fetchFlowLog(1)
}

function toggleSearchMode() {
  closeFilterMenus()
  filterMode.value = filterMode.value === 'search' ? '' : 'search'
}

function openDateFilter() {
  closeFilterMenus()
  filterMode.value = 'calendar'
  showDatePicker.value = true
}

function normalizeCategoryTreeResponse(res) {
  const data = res?.data ?? (res?.success ? res?.data : []) ?? []
  return Array.isArray(data) ? data : []
}

function filterActiveCategoriesForMenu(categories) {
  return (categories || [])
    .filter(cat => cat.is_active !== false)
    .map(cat => ({
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

function isCategoryFilterSelected(id) {
  return categoryFilterIds.value.includes(Number(id))
}

function reloadFlowLogAfterCategoryChange() {
  if (!accountId.value) return
  currentPage.value = 1
  load()
}

function onAllCategoriesCheckboxChange(ev) {
  if (ev.target.checked) {
    categoryFilterIds.value = []
    reloadFlowLogAfterCategoryChange()
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
    categoryFilterIds.value = cur.filter(x => x !== n)
  }
  reloadFlowLogAfterCategoryChange()
}

async function fetchAccountWorkspace() {
  if (!accountId.value) return
  try {
    const res = await getAccountById(accountId.value)
    const acc = res?.data ?? res
    if (acc?.workspace_id != null && acc.workspace_id !== '') {
      accountWorkspaceId.value = Number(acc.workspace_id)
    }
  } catch (_) {
    /* keep query-only workspace if any */
  }
}

function clearDates() {
  dateFrom.value = ''
  dateTo.value = ''
  currentPage.value = 1
  load()
}

function openTransactionDetail(row) {
  selectedTransaction.value = { ...row }
  detailVisible.value = true
}

function goEditTransaction(row) {
  const txnId = row.transaction_id ?? row.id
  if (txnId) {
    detailVisible.value = false
    router.push(`/transactions/${txnId}`)
  }
}

function onAccountOptionsDismiss(ev) {
  const role = ev.detail?.role
  showAccountOptions.value = false
  if (role === 'all-transactions') {
    router.push('/transactions')
  } else if (role === 'reconcile') {
    reconcileAccount.value = { id: accountId.value, name: accountName.value, currency: currency.value }
    loadAccountForReconcile()
  } else if (role === 'add-transaction') {
    router.push(`/transactions/create?account_id=${accountId.value}`)
  } else if (role === 'edit') {
    // TODO: Navigate to edit account when standalone edit route is available
    showToast('Edit from Accounts page')
  }
}

async function loadAccountForReconcile() {
  try {
    const res = await getAccountById(accountId.value)
    const acc = res?.data ?? res
    reconcileAccount.value = acc || { id: accountId.value, name: accountName.value, currency: currency.value }
    reconcileVisible.value = true
  } catch (_) {
    reconcileAccount.value = { id: accountId.value, name: accountName.value, currency: currency.value }
    reconcileVisible.value = true
  }
}

function onReconcileSuccess() {
  reconcileVisible.value = false
  load()
}

function onFabSelect(type) {
  router.push(`/transactions/create?type=${type}&account_id=${accountId.value}`)
}


function appendCategoryFilterParams(params) {
  const ids = categoryFilterIds.value
  if (!ids.length) return
  params.category_ids = ids.join(',')
  const labels = ids
    .map(id => categoryMenuOptions.value.find(o => o.id === id)?.label)
    .filter(x => x != null && String(x).length > 0)
  if (labels.length) {
    params.category_labels = JSON.stringify(labels)
  }
}

async function fetchFlowLog(page = 1, append = false) {
  if (!accountId.value) return
  if (page === 1) loading.value = true
  else loadingMore.value = true
  try {
    const params = { page, limit: pageSize }
    if (flowTypeFilter.value) params.flow_type = flowTypeFilter.value
    if (dateFrom.value) params.from_date = dateFrom.value
    if (dateTo.value) params.to_date = dateTo.value
    appendCategoryFilterParams(params)
    const res = await getAccountFlowLog(accountId.value, params)
    const data = res?.data ?? []
    pagination.value = res?.pagination ?? null
    if (append) flowLog.value = [...flowLog.value, ...data]
    else flowLog.value = data
  } catch (e) {
    showToast('Failed to load flow log')
    if (!append) flowLog.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function fetchSummary() {
  if (!accountId.value) return
  try {
    const params = {}
    if (dateFrom.value) params.from_date = dateFrom.value
    if (dateTo.value) params.to_date = dateTo.value
    appendCategoryFilterParams(params)
    const res = await getAccountFlowSummary(accountId.value, params)
    summary.value = res?.data ?? null
  } catch (_) {
    summary.value = null
  }
}

async function load() {
  currentPage.value = 1
  await Promise.all([fetchFlowLog(1), fetchSummary()])
}

async function loadMore() {
  const next = currentPage.value + 1
  await fetchFlowLog(next, true)
  currentPage.value = next
}

async function refetchIfInvalidated() {
  const id = Number(accountId.value)
  if (id && syncStore.invalidatedAccountIds?.has(id)) {
    await load()
    syncStore.clearInvalidatedAccountId(id)
  }
}

onMounted(async () => {
  accountName.value = route.query.name || 'Account'
  currency.value = route.query.currency || 'USD'
  await fetchAccountWorkspace()
  await load()
  await refetchIfInvalidated()
})

watch(accountId, async () => {
  accountWorkspaceId.value = null
  categoryFilterIds.value = []
  await fetchAccountWorkspace()
  await load()
  await refetchIfInvalidated()
})

watch(
  () => resolvedWorkspaceId.value,
  async (_newVal, oldVal) => {
    categoryFilterIds.value = []
    await loadCategoryMenu()
    if (oldVal !== undefined && accountId.value) {
      currentPage.value = 1
      await load()
    }
  },
  { immediate: true }
)

watch(categoryMenuOptions, opts => {
  const valid = new Set(opts.map(o => o.id))
  const next = categoryFilterIds.value.filter(id => valid.has(id))
  if (next.length !== categoryFilterIds.value.length) {
    categoryFilterIds.value = next
    if (accountId.value) {
      currentPage.value = 1
      load()
    }
  }
})

watch([dateFrom, dateTo], () => {
  if (filterMode.value === 'calendar' && (dateFrom.value || dateTo.value)) {
    load()
  }
})
</script>

<style scoped>
.flow-log-page {
  --background: #F5F5F7;
}

.flow-log-page ion-content {
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
}

.search-input:focus {
  border-color: #FF8D28;
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

.stats-dashboard {
  display: flex;
  justify-content: space-between;
  background: #fff;
  border-radius: 14px;
  padding: 14px 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* Unified filters under dashboard (Figma pill row) */
.ledger-filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
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

.filter-flyout-item {
  display: block;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.72);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.filter-flyout-item:active {
  background: rgba(0, 0, 0, 0.05);
}

.filter-flyout-item.selected {
  color: #ff8d28;
  font-weight: 600;
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

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-label {
  font-size: 10px;
  color: #A7A7A7;
  text-transform: uppercase;
}

.stat-value {
  font-size: 13px;
  font-weight: 700;
  color: #1A1A2E;
}

.stat-value.positive {
  color: #52BF90;
}

.stat-value.negative {
  color: rgba(195, 0, 16, 0.74);
}

.entry-count {
  font-size: 11px;
  color: #A7A7A7;
  margin-bottom: 8px;
  padding-left: 4px;
}

.transactions-island {
  background: #fff;
  border-radius: 16px;
  padding: 8px 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.transaction-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #F5F5F7;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.transaction-row:last-child {
  border-bottom: none;
}

.transaction-row:active {
  background: #FAFAFA;
  border-radius: 8px;
  margin: 0 -4px;
  padding: 10px 4px;
}

.tx-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tx-icon.income {
  background: rgba(82, 191, 144, 0.12);
  color: #52BF90;
}

.tx-icon.expense {
  background: rgba(195, 0, 16, 0.08);
  color: rgba(195, 0, 16, 0.74);
}

.tx-icon.neutral {
  background: rgba(255, 141, 40, 0.1);
  color: #FF8D28;
}

.tx-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tx-description {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-meta {
  font-size: 10px;
  color: #A7A7A7;
}

.tx-amounts {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.tx-amount {
  font-size: 13px;
  font-weight: 700;
}

.tx-balance {
  font-size: 10px;
}

.positive {
  color: #52BF90;
}

.negative {
  color: rgba(195, 0, 16, 0.74);
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

/* Transaction detail modal */
.detail-modal-content {
  --background: #F8F8FA;
  --padding-top: 0;
  --padding-bottom: 0;
}

.detail-sheet {
  min-height: 100%;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 12px 20px 28px;
  padding-bottom: calc(28px + env(safe-area-inset-bottom, 0));
}

.detail-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  margin: 0 auto 16px;
}

.detail-title {
  font-size: 22px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0 0 20px;
  letter-spacing: -0.02em;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin-bottom: 20px;
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0;
  border-bottom: 1px solid #F0F0F0;
  min-width: 0;
}

.detail-cell:nth-child(odd) {
  padding-right: 12px;
}

.detail-cell:nth-child(odd):not(:last-child) {
  border-right: 1px solid #F0F0F0;
}

.detail-cell:nth-child(even) {
  padding-left: 12px;
}

.detail-cell:nth-child(1),
.detail-cell:nth-child(2) {
  padding-top: 0;
}

.detail-cell-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #A7A7A7;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.detail-item-icon {
  flex-shrink: 0;
  color: #6E6A7C;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-item-icon.type-icon.positive {
  color: #52BF90;
}

.detail-item-icon.type-icon.negative {
  color: rgba(195, 0, 16, 0.74);
}

.detail-cell-value {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-cell-value.positive {
  color: #52BF90;
  font-weight: 600;
}

.detail-cell-value.negative {
  color: rgba(195, 0, 16, 0.74);
  font-weight: 600;
}

.detail-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 10px;
  background: #F0F0F0;
  font-size: 12px;
  font-weight: 500;
  color: #6E6A7C;
}

.detail-amount-block {
  text-align: center;
  margin-bottom: 24px;
  padding: 20px 16px;
  background: #F8F8FA;
  border-radius: 14px;
}

.detail-amount-full {
  font-size: 26px;
  font-weight: 700;
  color: #1A1A2E;
  letter-spacing: -0.02em;
}

.detail-amount-full.positive {
  color: #52BF90;
}

.detail-amount-full.negative {
  color: rgba(195, 0, 16, 0.74);
}

.detail-audit {
  margin-bottom: 24px;
  padding-top: 16px;
  border-top: 1px solid #F0F0F0;
}

.detail-audit-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.detail-audit-row:last-child {
  margin-bottom: 0;
}

.detail-audit-label {
  font-size: 13px;
  color: #A7A7A7;
  flex-shrink: 0;
}

.detail-audit-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.detail-audit-who {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
}

.detail-audit-when {
  font-size: 12px;
  color: #A7A7A7;
  margin-top: 2px;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.detail-btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.2s;
}

.detail-btn-edit {
  background: #FF8D28;
  color: #fff;
  border: none;
}

.detail-btn-edit:hover,
.detail-btn-edit:active {
  opacity: 0.92;
}

.detail-btn-close {
  background: transparent;
  color: #6E6A7C;
  border: 1px solid #E8E8E8;
}

.detail-btn-close:hover,
.detail-btn-close:active {
  background: #F5F5F5;
}
</style>
