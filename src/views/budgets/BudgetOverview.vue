<template>
  <ion-page class="budget-overview-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="page-container">
        <div class="page-header">
          <button type="button" class="back-btn" aria-label="Back" @click="$router.back()">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span class="page-title">Budget</span>
          <button type="button" class="more-btn" aria-label="More" @click.stop="openMore($event)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FF8D28">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>

        <div class="tabs">
          <button type="button" class="tab" :class="{ active: activeTab === 'overview' }" @click="setTab('overview')">
            Overview
          </button>
          <button type="button" class="tab" :class="{ active: activeTab === 'detailed' }" @click="setTab('detailed')">
            Detailed View
          </button>
        </div>

        <div v-if="planMeta?.status === 'draft'" class="draft-banner">
          <p class="draft-banner__text">This budget is a draft. Activate it to start tracking expenses.</p>
          <button type="button" class="activate-btn" :disabled="activating" @click="onActivate">
            {{ activating ? 'Activating…' : 'Activate budget' }}
          </button>
        </div>

        <div v-if="!loading && showBudgetPicker" class="budget-picker-row">
          <button type="button" class="budget-picker" @click="openBudgetPicker">
            <div class="budget-picker__main">
              <span class="budget-picker__name">{{ planMeta?.name || 'Select budget' }}</span>
              <span
                v-if="planMeta?.status"
                class="status-pill"
                :class="statusPillClass(planMeta.status)"
              >
                {{ formatBudgetStatusLabel(planMeta.status) }}
              </span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" stroke-width="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <p v-if="selectedBudgetDates" class="budget-picker__dates">{{ selectedBudgetDates }}</p>
        </div>

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent" />
        </div>

        <template v-else-if="planMeta">
          <section v-if="activeTab === 'overview' && dashboardData" class="overall-block">
            <div class="overall-head">
              <span class="overall-label">Overall Progress</span>
              <div class="overall-metrics">
                <span class="overall-values">
                  {{ formatAmountPair(dashboardData.totalActual, dashboardData.totalBudget) }}
                </span>
                <span class="overall-pct" :class="barToneClass(overallPct)">{{ overallPct.toFixed(0) }}%</span>
              </div>
            </div>
            <div class="progress-track progress-track--main">
              <div
                class="progress-fill"
                :class="barToneClass(overallPct)"
                :style="{ width: `${Math.min(overallPct, 100)}%` }"
              />
            </div>
          </section>

          <p v-else-if="activeTab === 'overview'" class="muted-banner">{{ dashboardMessage }}</p>

          <template v-if="activeTab === 'overview' && displayItems.length">
            <section v-for="row in displayItems" :key="row.category_id" class="budget-card">
              <div class="card-head">
                <span class="card-title">{{ row.category_name }}</span>
                <div v-if="hasRowBudget(row)" class="card-head-metrics">
                  <span class="card-ratio">{{ formatAmountPair(row.actual, row.budget) }}</span>
                  <span class="card-pct" :class="barToneClass(rowPct(row))">{{ rowPct(row).toFixed(0) }}%</span>
                </div>
              </div>
              <div v-if="hasRowBudget(row)" class="progress-track progress-track--main">
                <div
                  class="progress-fill"
                  :class="barToneClass(rowPct(row))"
                  :style="{ width: `${Math.min(rowPct(row), 100)}%` }"
                />
              </div>
              <div v-if="row.sub_items?.length" class="sub-list">
                <div v-for="s in row.sub_items" :key="s.category_id" class="sub-row">
                  <span class="grip" aria-hidden="true">
                    <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
                      <rect x="0" y="0" width="12" height="2.5" rx="1" fill="#A8A8A8" />
                      <rect x="0" y="4.5" width="12" height="4" rx="1" fill="#A8A8A8" />
                      <rect x="0" y="10.5" width="12" height="2.5" rx="1" fill="#A8A8A8" />
                    </svg>
                  </span>
                  <span class="sub-name">{{ s.category_name }}</span>
                  <div v-if="hasRowBudget(s)" class="sub-metrics">
                    <span class="sub-stats">{{ formatAmountPair(s.actual, s.budget) }}</span>
                    <div class="progress-track progress-track--sub">
                      <div
                        class="progress-fill"
                        :class="barToneClass(rowPct(s))"
                        :style="{ width: `${Math.min(rowPct(s), 100)}%` }"
                      />
                    </div>
                  </div>
                  <span v-else class="sub-stats sub-stats--solo">{{ formatAmount(s.actual) }}</span>
                </div>
              </div>
            </section>
          </template>

          <template v-else-if="activeTab === 'detailed'">
            <p v-if="detailedLoading" class="loading-inline">Loading…</p>
            <template v-else-if="detailedDisplayItems.length">
              <BudgetDetailCategoryCard
                v-for="item in detailedDisplayItems"
                :key="'d-' + item.category_id"
                :item="item"
                :period-report="periodReport"
                :full-report="fullReport"
                :period-type="planMeta?.period_type"
                :entry-count="categoryEntryCount(item)"
                :expanded="!!expandedCategories[String(item.category_id)]"
                :sub-entry-count="subCategoryEntryCount"
                @toggle-expand="toggleCategoryExpand(item.category_id)"
              />
            </template>
            <p v-else class="muted-banner">No detailed data for this period.</p>
          </template>
        </template>

        <div v-else class="empty-state">
          <p>Budget not found</p>
        </div>
      </div>

      <ion-popover
        :is-open="moreOpen"
        :event="moreEvent"
        :dismiss-on-select="true"
        :arrow="false"
        alignment="end"
        @didDismiss="moreOpen = false"
      >
        <ion-content class="more-pop-content" :scroll-y="false">
          <ion-list lines="none">
            <ion-item v-if="planMeta?.status === 'draft'" button lines="none" :detail="false" @click="onMore('activate')">
              <ion-label>Activate budget</ion-label>
            </ion-item>
            <ion-item v-if="canEditPlan" button lines="none" :detail="false" @click="onMore('edit')">
              <ion-label>Edit budget</ion-label>
            </ion-item>
            <ion-item v-if="canEditPlan" button lines="none" :detail="false" @click="onMore('edit-planned')">
              <ion-label>Edit Planned Amount</ion-label>
            </ion-item>
            <ion-item v-if="planMeta?.status === 'active'" button lines="none" :detail="false" @click="onMore('abandon')">
              <ion-label>Abandon</ion-label>
            </ion-item>
            <ion-item button lines="none" :detail="false" class="destructive-item" @click="onMore('delete')">
              <ion-label color="danger">Delete</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-popover>

      <BudgetSetupSheet
        mode="edit"
        :is-open="editSheetOpen"
        :plan-id="planId"
        :workspace-name="workspaceNameDisplay"
        @close="editSheetOpen = false"
        @updated="onEdited"
      />

      <ion-action-sheet
        :is-open="budgetPickerOpen"
        header="Select budget"
        :buttons="budgetPickerButtons"
        @didDismiss="budgetPickerOpen = false"
      />

      <div class="tab-spacer" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
  IonActionSheet,
  onIonViewDidEnter
} from '@ionic/vue'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getApiErrorMessage } from '@/utils/apiError'
import {
  getBudgets,
  getBudgetById,
  getBudgetDashboardSummary,
  getBudgetPeriods,
  getBudgetPeriodReport,
  getBudgetFullReport,
  getTransactions,
  activateBudget,
  abandonBudget,
  deleteBudget
} from '@/api/accounting'
import {
  formatBudgetStatusLabel,
  formatBudgetDateRange,
  workspaceBudgetParams
} from '@/utils/budgetManagement'
import BudgetSetupSheet from '@/views/budgets/components/BudgetSetupSheet.vue'
import BudgetDetailCategoryCard from '@/views/budgets/components/BudgetDetailCategoryCard.vue'

const route = useRoute()
const router = useRouter()

const planId = computed(() => route.params.id)

const loading = ref(true)
const detailedLoading = ref(false)
const activeTab = ref('overview')
const planMeta = ref(null)
const dashboardRaw = ref(null)
const periodReport = ref(null)
const fullReport = ref(null)
const periodTransactions = ref([])
const expandedCategories = ref({})

const moreOpen = ref(false)
const moreEvent = ref(undefined)
const editSheetOpen = ref(false)
const activating = ref(false)
const budgetPickerOpen = ref(false)
const pickerBudgetsRaw = ref([])

const workspaceId = computed(() => {
  const q = route.query.workspace_id
  if (q != null && q !== '') return Number(q)
  const ws = planMeta.value?.workspace_id
  return ws != null ? Number(ws) : null
})

const pickerBudgets = computed(() => {
  const rows = [...pickerBudgetsRaw.value]
  const current = planMeta.value
  if (current && !rows.some((r) => Number(r.id) === Number(current.id))) {
    rows.unshift(current)
  }
  return rows
})

const showBudgetPicker = computed(() => pickerBudgets.value.length > 0)

const selectedBudgetDates = computed(() => {
  if (!planMeta.value) return ''
  return formatBudgetDateRange(planMeta.value.start_date, planMeta.value.end_date)
})

const budgetPickerButtons = computed(() => {
  const buttons = pickerBudgets.value.map((row) => ({
    text: budgetPickerLabel(row),
    cssClass: Number(row.id) === Number(planId.value) ? 'budget-picker-selected' : '',
    handler: () => selectBudget(row)
  }))
  buttons.push({ text: 'Cancel', role: 'cancel' })
  return buttons
})

const workspaceNameDisplay = computed(() => {
  const q = route.query.workspace_name
  if (q == null || q === '') return ''
  return typeof q === 'string' ? decodeURIComponent(q) : String(q)
})

const dashboardData = computed(() => {
  const d = dashboardRaw.value
  if (!d || d.has_current_period === false) return null
  return d
})

const dashboardMessage = computed(() => {
  const d = dashboardRaw.value
  if (!d) return 'No summary available.'
  return d.message || 'No current budget period.'
})

const displayItems = computed(() =>
  enrichBudgetRows(dashboardData.value?.items || [], planMeta.value?.items || [])
)

const detailedDisplayItems = computed(() =>
  enrichBudgetRows(periodReport.value?.items || [], planMeta.value?.items || [])
)

const overallPct = computed(() => {
  const d = dashboardData.value
  if (!d?.totalBudget || d.totalBudget <= 0) return 0
  return (d.totalActual / d.totalBudget) * 100
})

const canEditPlan = computed(() => {
  const s = planMeta.value?.status
  return s === 'active' || s === 'draft'
})

function rowPct(row) {
  const b = parseFloat(row.budget) || 0
  if (b <= 0) return 0
  return ((parseFloat(row.actual) || 0) / b) * 100
}

function hasRowBudget(row) {
  return (parseFloat(row?.budget) || 0) > 0
}

function enrichBudgetRows(reportItems, planItems) {
  if (!reportItems.length) return []

  const actualLookup = new Map()
  for (const row of reportItems) {
    actualLookup.set(Number(row.category_id), row)
    for (const sub of row.sub_items || []) {
      actualLookup.set(Number(sub.category_id), sub)
    }
  }

  return reportItems.map((row) => {
    const subMap = new Map()
    for (const sub of row.sub_items || []) {
      subMap.set(Number(sub.category_id), { ...sub })
    }

    for (const planItem of planItems) {
      if (planItem.parent_id == null) continue
      if (Number(planItem.parent_id) !== Number(row.category_id)) continue

      const cid = Number(planItem.category_id)
      const fromReport = subMap.get(cid) || actualLookup.get(cid)
      const budget = parseFloat(planItem.amount) || parseFloat(fromReport?.budget) || 0
      const actual = parseFloat(fromReport?.actual) || 0

      subMap.set(cid, {
        category_id: cid,
        category_name: planItem.category_name || fromReport?.category_name || 'Uncategorized',
        budget,
        actual
      })
    }

    return {
      ...row,
      sub_items: Array.from(subMap.values())
    }
  })
}

function barToneClass(pct) {
  const p = Number(pct) || 0
  if (p >= 90) return 'tone-danger'
  if (p > 60) return 'tone-warn'
  return 'tone-ok'
}

function formatAmount(val) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(val) || 0)
}

function formatAmountPair(actual, budget) {
  return `${formatAmount(actual)} / ${formatAmount(budget)}`
}

function statusPillClass(status) {
  if (status === 'active') return 'status-pill--active'
  if (status === 'draft') return 'status-pill--draft'
  if (status === 'completed') return 'status-pill--completed'
  if (status === 'abandoned') return 'status-pill--abandoned'
  return ''
}

function budgetPickerLabel(row) {
  const status = formatBudgetStatusLabel(row.status)
  const dates = formatBudgetDateRange(row.start_date, row.end_date)
  if (dates) return `${row.name} (${status}) — ${dates}`
  return `${row.name} (${status})`
}

function openBudgetPicker() {
  if (pickerBudgets.value.length <= 1) return
  budgetPickerOpen.value = true
}

function selectBudget(row) {
  if (!row?.id || Number(row.id) === Number(planId.value)) return
  const query = { ...route.query }
  if (row.workspace_id != null) {
    query.workspace_id = String(row.workspace_id)
  }
  router.replace({
    name: 'BudgetOverview',
    params: { id: String(row.id) },
    query
  })
}

async function loadPickerBudgets() {
  const wsId = workspaceId.value ?? planMeta.value?.workspace_id
  if (wsId == null && planMeta.value?.workspace_id == null) {
    pickerBudgetsRaw.value = planMeta.value ? [planMeta.value] : []
    return
  }
  try {
    const res = await getBudgets(workspaceBudgetParams(wsId))
    const rows = (Array.isArray(res?.data) ? res.data : []).filter((r) =>
      ['active', 'completed', 'abandoned'].includes(r.status)
    )
    const statusOrder = { active: 0, completed: 1, abandoned: 2 }
    rows.sort((a, b) => {
      const orderA = statusOrder[a.status] ?? 9
      const orderB = statusOrder[b.status] ?? 9
      if (orderA !== orderB) return orderA - orderB
      return (b.end_date || '').localeCompare(a.end_date || '')
    })
    pickerBudgetsRaw.value = rows
  } catch {
    pickerBudgetsRaw.value = planMeta.value ? [planMeta.value] : []
  }
}

async function loadCore() {
  if (!planId.value) return
  loading.value = true
  try {
    const [planRes, dashRes] = await Promise.all([
      getBudgetById(planId.value),
      getBudgetDashboardSummary(planId.value)
    ])
    planMeta.value = planRes?.data ?? null
    dashboardRaw.value = dashRes?.data ?? null
    await loadPickerBudgets()
  } catch {
    planMeta.value = null
    dashboardRaw.value = null
    pickerBudgetsRaw.value = []
  } finally {
    loading.value = false
  }
}

function pickPeriodIndex(periods) {
  if (!periods?.length) return 0
  const today = new Date().toISOString().slice(0, 10)
  const idx = periods.findIndex((p) => today >= p.periodStart && today <= p.periodEnd)
  if (idx >= 0) return idx
  return periods.length - 1
}

async function loadDetailed() {
  if (!planId.value) return
  detailedLoading.value = true
  expandedCategories.value = {}
  periodTransactions.value = []
  fullReport.value = null
  try {
    const perRes = await getBudgetPeriods(planId.value)
    const periods = perRes?.data || []
    const idx = pickPeriodIndex(periods)
    const [repRes, fullRes] = await Promise.all([
      getBudgetPeriodReport(planId.value, idx),
      getBudgetFullReport(planId.value)
    ])
    periodReport.value = repRes?.data ?? null
    fullReport.value = fullRes?.data ?? null

    const wsId = planMeta.value?.workspace_id
    if (periodReport.value?.period_start && periodReport.value?.period_end && wsId != null) {
      try {
        const txRes = await getTransactions({
          workspace_id: wsId,
          start_date: periodReport.value.period_start,
          end_date: periodReport.value.period_end,
          type: 'expense',
          limit: 500
        })
        periodTransactions.value = extractTransactions(txRes)
      } catch {
        periodTransactions.value = []
      }
    }
  } catch {
    periodReport.value = null
    fullReport.value = null
    periodTransactions.value = []
  } finally {
    detailedLoading.value = false
  }
}

function extractTransactions(res) {
  const d = res?.data
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.data)) return d.data
  return []
}

function categoryEntryCount(item) {
  if (!periodTransactions.value.length) return null
  const ids = new Set([Number(item.category_id)])
  for (const s of item.sub_items || []) ids.add(Number(s.category_id))
  return periodTransactions.value.filter((t) => ids.has(Number(t.category_id))).length
}

function subCategoryEntryCount(categoryId) {
  if (!periodTransactions.value.length) return null
  return periodTransactions.value.filter((t) => Number(t.category_id) === Number(categoryId)).length
}

function toggleCategoryExpand(categoryId) {
  const key = String(categoryId)
  expandedCategories.value = {
    ...expandedCategories.value,
    [key]: !expandedCategories.value[key]
  }
}

function setTab(tab) {
  activeTab.value = tab
  if (tab === 'detailed' && !periodReport.value) loadDetailed()
}

watch(
  () => planId.value,
  async () => {
    periodReport.value = null
    fullReport.value = null
    periodTransactions.value = []
    expandedCategories.value = {}
    await loadCore()
    if (activeTab.value === 'detailed') await loadDetailed()
  },
  { immediate: true }
)

let skipNextViewEnterRefresh = true
onIonViewDidEnter(async () => {
  if (skipNextViewEnterRefresh) {
    skipNextViewEnterRefresh = false
    return
  }
  periodReport.value = null
  fullReport.value = null
  periodTransactions.value = []
  expandedCategories.value = {}
  await loadCore()
  if (activeTab.value === 'detailed') await loadDetailed()
})

function openMore(ev) {
  moreEvent.value = ev
  moreOpen.value = true
}

async function onActivate() {
  if (!planMeta.value || planMeta.value.status !== 'draft' || activating.value) return
  try {
    await showConfirmDialog({
      title: 'Activate budget',
      message: `Activate "${planMeta.value.name}"? This will make it the active budget and start tracking expenses.`,
      confirmText: 'Activate',
      cancelText: 'Cancel'
    })
  } catch {
    return
  }
  activating.value = true
  try {
    await activateBudget(planId.value)
    showToast({ variant: 'success', message: 'Budget activated' })
    await loadCore()
    periodReport.value = null
    if (activeTab.value === 'detailed') await loadDetailed()
  } catch (e) {
    showToast({
      variant: 'error',
      title: 'Cannot activate',
      message: getApiErrorMessage(e, 'Could not activate budget'),
      duration: 5000
    })
  } finally {
    activating.value = false
  }
}

async function onMore(action) {
  moreOpen.value = false
  if (!planMeta.value) return
  if (action === 'activate') {
    await onActivate()
    return
  }
  if (action === 'edit') {
    editSheetOpen.value = true
    return
  }
  if (action === 'edit-planned') {
    const query = { budget_id: String(planId.value) }
    if (workspaceId.value != null) query.workspace_id = String(workspaceId.value)
    if (route.query.workspace_name) query.workspace_name = route.query.workspace_name
    router.push({ name: 'BudgetPlan', query })
    return
  }
  if (action === 'abandon') {
    try {
      await showConfirmDialog({
        title: 'Abandon budget',
        message: 'Stop tracking with this active budget?',
        confirmText: 'Abandon',
        cancelText: 'Cancel'
      })
      await abandonBudget(planId.value)
      showToast('Budget abandoned')
      router.back()
    } catch (e) {
      if (e !== 'cancel') showToast(getApiErrorMessage(e, 'Failed'))
    }
    return
  }
  if (action === 'delete') {
    try {
      await showConfirmDialog({
        title: 'Delete budget',
        message: 'Delete this budget plan? This cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      })
      await deleteBudget(planId.value)
      showToast('Budget deleted')
      router.back()
    } catch (e) {
      if (e !== 'cancel') showToast(getApiErrorMessage(e, 'Failed'))
    }
  }
}

async function onEdited() {
  await loadCore()
  periodReport.value = null
  fullReport.value = null
  periodTransactions.value = []
  expandedCategories.value = {}
  if (activeTab.value === 'detailed') await loadDetailed()
}
</script>

<style scoped>
.budget-overview-page {
  --background: #f5f5f7;
}

.budget-overview-page ion-content {
  --background: #f5f5f7;
}

.page-container {
  padding: 0 16px;
  padding-top: env(safe-area-inset-top, 20px);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0 10px;
}

.back-btn {
  background: none;
  border: none;
  padding: 4px;
  color: #ff8d28;
  cursor: pointer;
}

.more-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
}

.page-title {
  flex: 1;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: #000;
}

.tabs {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-bottom: 16px;
}

.tab {
  background: none;
  border: none;
  font-size: 15px;
  font-weight: 600;
  color: #a7a7a7;
  padding: 8px 4px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab.active {
  color: #ff8d28;
  border-bottom-color: #ff8d28;
}

.draft-banner {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px 16px;
  background: #f5f8ff;
  border: 1px solid #d6e4ff;
  border-radius: 12px;
}

.draft-banner__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  color: #3d4a66;
}

.activate-btn {
  align-self: flex-start;
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: #2d9d62;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.activate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.budget-picker-row {
  margin-bottom: 16px;
}

.budget-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(168, 168, 168, 0.35);
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  text-align: left;
}

.budget-picker__main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.budget-picker__name {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 141, 40, 0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.budget-picker__dates {
  margin: 6px 0 0;
  padding-left: 2px;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 5px;
  height: 16px;
  border: 1px solid rgba(168, 168, 168, 0.35);
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
}

.status-pill--active {
  color: #52bf90;
  border-color: rgba(82, 191, 144, 0.35);
}

.status-pill--draft {
  color: #a8a8a8;
}

.status-pill--completed {
  color: rgba(255, 141, 40, 0.85);
  border-color: rgba(255, 141, 40, 0.35);
}

.status-pill--abandoned {
  color: #c30010;
  border-color: rgba(195, 0, 16, 0.25);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.loading-inline {
  text-align: center;
  color: #a7a7a7;
  padding: 16px;
}

.muted-banner {
  font-size: 14px;
  color: #a7a7a7;
  text-align: center;
  padding: 12px;
}

.overall-block {
  background: #fff;
  border-radius: 8px;
  padding: 13px;
  margin-bottom: 14px;
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.16);
}

.overall-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.overall-label {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.overall-metrics {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.overall-pct {
  font-size: 14px;
  font-weight: 600;
}

.overall-pct.tone-ok {
  color: #2d9d62;
}

.overall-pct.tone-warn {
  color: #c9a600;
}

.overall-pct.tone-danger {
  color: #d32f2f;
}

.overall-values {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
}

.progress-track {
  position: relative;
  height: 10px;
  border-radius: 40px;
  background: rgba(168, 168, 168, 0.2);
  overflow: hidden;
}

.progress-track--main {
  height: 12px;
}

.progress-track--sub {
  height: 8px;
  width: 100%;
}

.progress-fill {
  height: 100%;
  border-radius: 40px;
  transition: width 0.2s ease;
}

.progress-fill.tone-ok {
  background: #2d9d62;
}

.progress-fill.tone-warn {
  background: #e6c200;
}

.progress-fill.tone-danger {
  background: #d32f2f;
}

.card-pct.tone-ok {
  color: #2d9d62;
}

.card-pct.tone-warn {
  color: #c9a600;
}

.card-pct.tone-danger {
  color: #d32f2f;
}

.budget-card {
  background: #fff;
  border-radius: 8px;
  padding: 13px;
  margin-bottom: 14px;
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.16);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 141, 40, 0.95);
  min-width: 0;
}

.card-head-metrics {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.card-ratio {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
}

.card-pct {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.sub-list {
  margin-top: 4px;
}

.sub-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
}

.sub-row + .sub-row {
  border-top: 1px solid rgba(240, 240, 240, 0.9);
}

.grip {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding-top: 1px;
}

.sub-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 400;
  color: #1a1a2e;
  line-height: 1.3;
}

.sub-metrics {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 132px;
  gap: 6px;
}

.sub-stats {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
  text-align: center;
  width: 100%;
}

.sub-stats--solo {
  flex-shrink: 0;
  text-align: right;
}

.period-label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1a1a2e;
}

.empty-state {
  text-align: center;
  padding: 48px 0;
  color: #a7a7a7;
}

.tab-spacer {
  height: 80px;
}
</style>

<style>
.more-pop-content {
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 8px;
  --padding-bottom: 8px;
}

.more-pop-content ion-item {
  --min-height: 44px;
}
</style>
