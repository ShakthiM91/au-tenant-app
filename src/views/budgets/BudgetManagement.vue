<template>
  <ion-page class="budget-mgmt-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="page-container">
        <div class="page-header">
          <button type="button" class="back-btn" aria-label="Back" @click="$router.back()">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span class="page-title">Budget Management</span>
          <button type="button" class="add-btn" aria-label="Create budget" @click="openCreateBudget">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        <div class="workspace-row">
          <button type="button" class="workspace-picker" @click="openWorkspacePicker">
            <span class="workspace-picker__label">{{ workspaceLabel }}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" stroke-width="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <span v-if="workspaceBalance != null" class="workspace-balance">
            Bal: {{ formatBudgetMoney(workspaceBalance, balanceCurrency) }}
          </span>
        </div>

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent" />
        </div>

        <template v-else>
          <section
            v-if="showOngoingHero"
            class="ongoing-card"
            @click="openBudget(ongoingPlan)"
          >
            <div class="ongoing-card__head">
              <div class="ongoing-card__title-block">
                <div class="ongoing-card__title-row">
                  <span class="ongoing-card__name">{{ ongoingPlan.name }}</span>
                  <span class="status-pill status-pill--active">Ongoing</span>
                </div>
                <span class="ongoing-card__dates">
                  {{ formatBudgetDateRange(ongoingSummary?.period_start, ongoingSummary?.period_end) }}
                </span>
              </div>
              <div class="ongoing-card__avp">
                <span class="avp-label">Actual vs Planned</span>
                <span class="avp-values">
                  <span class="amount-good">{{ formatBudgetAmount(ongoingSummary?.totalActual) }}</span>
                  <span class="amount-muted"> / {{ formatBudgetAmount(ongoingSummary?.totalBudget) }}</span>
                </span>
              </div>
            </div>

            <div class="progress-track progress-track--lg">
              <div
                class="progress-fill"
                :class="barToneClass(ongoingPct)"
                :style="{ width: `${ongoingPct}%` }"
              />
              <span class="progress-pct">{{ ongoingPct }}%</span>
            </div>

            <div class="ongoing-stats">
              <div class="stat-col">
                <div class="stat-block">
                  <span class="stat-label">Overspent</span>
                  <span class="stat-value">{{ overspentCategoryCount }} Categories</span>
                </div>
                <div class="stat-block">
                  <span class="stat-label">Overspent Amount</span>
                  <span class="stat-value stat-value--danger">{{ formatBudgetAmount(overspentAmount) }}</span>
                </div>
              </div>
              <div class="stat-col">
                <div class="stat-block">
                  <span class="stat-label">Remaining</span>
                  <span class="stat-value stat-value--good">{{ formatBudgetAmount(remainingAmount) }}</span>
                </div>
                <div class="stat-block">
                  <span class="stat-label">Remaining %</span>
                  <span class="stat-value stat-value--good">{{ remainingPct.toFixed(1) }}%</span>
                </div>
              </div>
              <div class="stat-col">
                <div class="stat-block">
                  <span class="stat-label">Monthly Projection</span>
                  <span class="stat-value stat-value--good">{{ formatBudgetAmount(projection.projected) }}</span>
                </div>
                <div class="stat-block">
                  <span class="stat-label">MP Change %</span>
                  <span class="stat-value" :class="projection.changePct <= 0 ? 'stat-value--good' : 'stat-value--danger'">
                    {{ projection.changePct > 0 ? '+' : '' }}{{ projection.changePct.toFixed(1) }}%
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section class="directory">
            <h2 class="directory-title">Budget Directory</h2>
            <div class="filter-row">
              <button
                v-for="f in BUDGET_STATUS_FILTERS"
                :key="f.label"
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill--active': statusFilter === f.value }"
                @click="setStatusFilter(f.value)"
              >
                {{ f.label }}
              </button>
            </div>

            <div v-if="listLoading" class="list-loading">
              <ion-spinner name="crescent" />
            </div>

            <div v-else-if="list.length" class="directory-list">
              <article
                v-for="row in list"
                :key="row.id"
                class="directory-card"
                @click="openBudget(row)"
              >
                <div class="directory-card__head">
                  <div class="directory-card__left">
                    <span class="directory-card__name">{{ row.name }}</span>
                    <span class="status-pill" :class="`status-pill--${row.status}`">
                      {{ formatBudgetStatusLabel(row.status) }}
                    </span>
                  </div>
                  <div class="directory-card__avp">
                    <span class="avp-label">Actual vs Planned</span>
                    <span class="avp-values">
                      <span :class="actualAmountClass(row.status, rowProgress(row).actual, rowProgress(row).planned)">
                        {{ formatBudgetAmount(rowProgress(row).actual) }}
                      </span>
                      <span class="amount-muted"> / {{ formatBudgetAmount(rowProgress(row).planned) }}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    class="card-more-btn"
                    aria-label="Budget options"
                    @click.stop="openCardMenu(row, $event)"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#A8A8A8">
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                </div>

                <div class="progress-track">
                  <div
                    class="progress-fill"
                    :class="barToneClass(rowProgress(row).pct)"
                    :style="{ width: `${rowProgress(row).pct}%` }"
                  />
                  <span class="progress-pct">{{ rowProgress(row).pct }}%</span>
                </div>

                <div class="directory-card__foot">
                  <span class="foot-meta">
                    <template v-if="isRecurring(row)">Recurring ~ {{ formatBudgetPeriodType(row.period_type) }}</template>
                    <template v-else>{{ formatBudgetPeriodType(row.period_type) }}</template>
                  </span>
                  <span class="foot-dates">{{ formatBudgetDateRange(row.start_date, row.end_date) }}</span>
                </div>
              </article>
            </div>

            <div v-else class="empty-directory">
              <p>No budgets in this view.</p>
              <button type="button" class="empty-cta" @click="openCreateBudget">Create budget</button>
            </div>
          </section>
        </template>
      </div>

      <BudgetSetupSheet
        mode="create"
        :is-open="budgetSetupOpen"
        :workspace-id="workspaceId"
        :workspace-name="workspaceName"
        @close="budgetSetupOpen = false"
        @continue-create="onBudgetContinueCreate"
      />

      <ion-action-sheet
        :is-open="workspacePickerOpen"
        header="Select island"
        :buttons="workspacePickerButtons"
        @didDismiss="workspacePickerOpen = false"
      />

      <ion-action-sheet
        :is-open="cardMenuOpen"
        :header="cardMenuRow?.name || 'Budget'"
        :buttons="cardMenuButtons"
        @didDismiss="cardMenuOpen = false"
      />

      <div class="tab-spacer" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onIonViewDidEnter } from '@ionic/vue'
import { IonPage, IonContent, IonSpinner, IonActionSheet } from '@ionic/vue'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getApiErrorMessage } from '@/utils/apiError'
import {
  getBudgets,
  getOngoingBudget,
  getBudgetDashboardSummary,
  getBudgetFullReport,
  abandonBudget,
  activateBudget,
  deleteBudget,
  generateBudgetNext,
  getAccounts,
  getAccountsByWorkspace
} from '@/api/accounting'
import { getWorkspaces, getSharedWorkspaces } from '@/api/workspace'
import BudgetSetupSheet from '@/views/budgets/components/BudgetSetupSheet.vue'
import { budgetSetupDraft } from '@/views/budgets/draftStore'
import {
  BUDGET_STATUS_FILTERS,
  formatBudgetStatusLabel,
  formatBudgetPeriodType,
  formatBudgetDateRange,
  workspaceBudgetParams,
  formatBudgetAmount,
  formatBudgetMoney,
  budgetUsedPercent,
  barToneClass,
  actualAmountClass,
  computeMonthlyProjection,
  pickReportPeriod
} from '@/utils/budgetManagement'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const listLoading = ref(false)
const statusFilter = ref('')
const budgetSetupOpen = ref(false)
const workspacePickerOpen = ref(false)
const cardMenuOpen = ref(false)
const cardMenuRow = ref(null)

const workspaceOptions = ref([])
const workspaceBalance = ref(null)
const balanceCurrency = ref('USD')

const ongoingPlan = ref(null)
const ongoingSummary = ref(null)
const list = ref([])
const progressById = ref({})

const workspaceId = computed(() => {
  const id = route.query.workspace_id
  return id != null && id !== '' ? Number(id) : null
})

const workspaceName = computed(() => {
  const q = route.query.workspace_name
  if (q == null || q === '') return ''
  try {
    return decodeURIComponent(String(q))
  } catch {
    return String(q)
  }
})

const workspaceLabel = computed(() => {
  if (workspaceName.value) return workspaceName.value
  const opt = workspaceOptions.value.find((w) => w.id === workspaceId.value)
  return opt?.label || 'Select island'
})

const showOngoingHero = computed(
  () =>
    ongoingPlan.value &&
    ongoingSummary.value?.has_current_period !== false &&
    statusFilter.value !== 'active'
)

const ongoingPct = computed(() =>
  budgetUsedPercent(ongoingSummary.value?.totalActual, ongoingSummary.value?.totalBudget)
)

const overspentCategoryCount = computed(() => {
  const cats = ongoingSummary.value?.overrunCategories
  return Array.isArray(cats) ? cats.length : 0
})

const overspentAmount = computed(() => {
  const cats = ongoingSummary.value?.overrunCategories
  if (!Array.isArray(cats)) return 0
  return cats.reduce((sum, c) => sum + (Number(c.overrun) || 0), 0)
})

const remainingAmount = computed(() => {
  const budget = Number(ongoingSummary.value?.totalBudget) || 0
  const actual = Number(ongoingSummary.value?.totalActual) || 0
  return Math.max(0, budget - actual)
})

const remainingPct = computed(() => {
  const budget = Number(ongoingSummary.value?.totalBudget) || 0
  if (budget <= 0) return 0
  return (remainingAmount.value / budget) * 100
})

const projection = computed(() =>
  computeMonthlyProjection(
    ongoingSummary.value?.totalActual,
    ongoingSummary.value?.totalBudget,
    ongoingSummary.value?.period_start,
    ongoingSummary.value?.period_end
  )
)

const workspacePickerButtons = computed(() => {
  const buttons = workspaceOptions.value.map((w) => ({
    text: w.label,
    handler: () => selectWorkspace(w)
  }))
  buttons.push({ text: 'Cancel', role: 'cancel' })
  return buttons
})

const cardMenuButtons = computed(() => {
  const row = cardMenuRow.value
  if (!row) return [{ text: 'Cancel', role: 'cancel' }]
  const buttons = [{ text: 'Open budget', handler: () => openBudget(row) }]
  if (row.status === 'active' || row.status === 'draft') {
    buttons.push({ text: 'Edit setup', handler: () => openBudget(row) })
  }
  if (row.status === 'draft') {
    buttons.push({ text: 'Activate', handler: () => onActivate(row) })
  }
  if (row.status === 'active' && isRecurring(row)) {
    buttons.push({ text: 'Next period draft', handler: () => onGenerateNext(row) })
  }
  if (row.status === 'active') {
    buttons.push({ text: 'Abandon', role: 'destructive', handler: () => onAbandon(row) })
  }
  buttons.push({ text: 'Delete', role: 'destructive', handler: () => onDelete(row) })
  buttons.push({ text: 'Cancel', role: 'cancel' })
  return buttons
})

function rowProgress(row) {
  return progressById.value[row.id] || { actual: 0, planned: 0, pct: 0 }
}

function isRecurring(row) {
  return row?.is_recurring !== false && row?.is_recurring !== 0
}

function wsQuery() {
  return workspaceId.value != null ? String(workspaceId.value) : ''
}

function openBudget(row) {
  if (!row?.id) return
  router.push({
    name: 'BudgetOverview',
    params: { id: String(row.id) },
    query: {
      workspace_id: wsQuery(),
      workspace_name: workspaceName.value || workspaceLabel.value || ''
    }
  })
}

function openCreateBudget() {
  if (workspaceId.value == null) {
    showToast('Select an island first')
    return
  }
  budgetSetupOpen.value = true
}

function onBudgetContinueCreate(draft) {
  budgetSetupDraft.value = draft
  budgetSetupOpen.value = false
  router.push({ name: 'BudgetPlan' })
}

function openWorkspacePicker() {
  if (!workspaceOptions.value.length) return
  workspacePickerOpen.value = true
}

function selectWorkspace(w) {
  router.replace({
    name: 'BudgetManagement',
    query: {
      workspace_id: w.id != null ? String(w.id) : '',
      workspace_name: encodeURIComponent(w.label || '')
    }
  })
}

function openCardMenu(row, ev) {
  ev?.stopPropagation?.()
  cardMenuRow.value = row
  cardMenuOpen.value = true
}

function setStatusFilter(value) {
  statusFilter.value = value
  loadList()
}

function extractAccounts(res) {
  const d = res?.data
  if (Array.isArray(d)) return d
  if (d && Array.isArray(d.data)) return d.data
  return []
}

async function loadWorkspaceBalance() {
  workspaceBalance.value = null
  try {
    const wsId = workspaceId.value
    const res =
      wsId != null
        ? await getAccountsByWorkspace(wsId, { is_active: true })
        : await getAccounts({ is_active: true })
    const accounts = extractAccounts(res)
    let sum = 0
    let currency = 'USD'
    for (const a of accounts) {
      if (wsId == null && a.workspace_id != null && a.workspace_id !== '') continue
      sum += parseFloat(a.current_balance ?? a.balance ?? 0) || 0
      if (a.currency) currency = a.currency
    }
    workspaceBalance.value = sum
    balanceCurrency.value = currency
  } catch {
    workspaceBalance.value = null
  }
}

async function loadWorkspaceOptions() {
  try {
    const [ownRes, sharedRes] = await Promise.all([getWorkspaces(), getSharedWorkspaces()])
    const own = Array.isArray(ownRes?.data) ? ownRes.data : []
    const shared = Array.isArray(sharedRes?.data?.active) ? sharedRes.data.active : []
    const opts = []
    for (const w of own) {
      opts.push({ id: Number(w.id), label: w.name || `Island ${w.id}` })
    }
    for (const w of shared) {
      const label = w.tenant_name ? `${w.name || 'Shared'} (${w.tenant_name})` : w.name || 'Shared island'
      opts.push({ id: Number(w.id), label })
    }
    workspaceOptions.value = opts
  } catch {
    workspaceOptions.value = []
  }
}

async function loadBudgetProgress(plan) {
  try {
    const reportRes = await getBudgetFullReport(plan.id)
    const report = reportRes?.data
    const period = pickReportPeriod(plan, report?.periods)
    const actual = Number(period?.totalActual) || 0
    const planned = Number(period?.totalBudget) || 0
    const pct = budgetUsedPercent(actual, planned)
    return { actual, planned, pct }
  } catch {
    return { actual: 0, planned: 0, pct: 0 }
  }
}

async function loadOngoing() {
  ongoingPlan.value = null
  ongoingSummary.value = null
  try {
    const res = await getOngoingBudget(workspaceBudgetParams(workspaceId.value))
    const plan = res?.data
    if (!plan?.id) return
    ongoingPlan.value = plan
    const sumRes = await getBudgetDashboardSummary(plan.id)
    ongoingSummary.value = sumRes?.data || null
  } catch {
    ongoingPlan.value = null
    ongoingSummary.value = null
  }
}

async function loadList() {
  listLoading.value = true
  try {
    const params = { ...workspaceBudgetParams(workspaceId.value) }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getBudgets(params)
    const rows = Array.isArray(res?.data) ? res.data : []
    list.value = rows
    const progressEntries = await Promise.all(
      rows.map(async (row) => [row.id, await loadBudgetProgress(row)])
    )
    progressById.value = Object.fromEntries(progressEntries)
  } catch {
    showToast('Failed to load budgets')
    list.value = []
    progressById.value = {}
  } finally {
    listLoading.value = false
  }
}

async function load() {
  loading.value = true
  try {
    await Promise.all([loadWorkspaceOptions(), loadWorkspaceBalance(), loadOngoing(), loadList()])
  } finally {
    loading.value = false
  }
}

async function onActivate(row) {
  try {
    await showConfirmDialog({
      title: 'Activate budget',
      message: `Activate "${row.name}"? This will make it the active budget and start tracking expenses.`,
      confirmText: 'Activate',
      cancelText: 'Cancel'
    })
  } catch {
    return
  }
  try {
    await activateBudget(row.id)
    showToast('Budget activated')
    await load()
  } catch (e) {
    showToast({
      variant: 'error',
      title: 'Cannot activate',
      message: getApiErrorMessage(e, 'Could not activate budget'),
      duration: 5000
    })
  }
}

async function onAbandon(row) {
  try {
    await showConfirmDialog({
      title: 'Abandon budget',
      message: 'Mark this budget as abandoned?',
      confirmText: 'Abandon',
      cancelText: 'Cancel'
    })
  } catch {
    return
  }
  try {
    await abandonBudget(row.id)
    showToast('Budget abandoned')
    await load()
  } catch (e) {
    showToast(e?.message || 'Could not abandon')
  }
}

async function onGenerateNext(row) {
  try {
    await generateBudgetNext(row.id)
    showToast('Next period draft created')
    await load()
  } catch (e) {
    showToast(e?.message || 'Could not generate draft')
  }
}

async function onDelete(row) {
  try {
    await showConfirmDialog({
      title: 'Delete budget',
      message: 'Delete this budget plan permanently?',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })
  } catch {
    return
  }
  try {
    await deleteBudget(row.id)
    showToast('Budget deleted')
    await load()
  } catch (e) {
    showToast(e?.message || 'Could not delete')
  }
}

watch(
  () => route.query.workspace_id,
  () => {
    loadWorkspaceBalance()
    load()
  }
)

onIonViewDidEnter(load)
</script>

<style scoped>
.budget-mgmt-page {
  --background: #fff;
}

.page-container {
  padding: 12px 22px 100px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 35px;
  margin-bottom: 12px;
}

.back-btn,
.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  color: #ff8d28;
  cursor: pointer;
}

.page-title {
  font-size: 17px;
  font-weight: 700;
  color: #000;
}

.workspace-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.workspace-picker {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  max-width: 58%;
}

.workspace-picker__label {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.72);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.workspace-balance {
  font-size: 14px;
  color: #a8a8a8;
  white-space: nowrap;
}

.loading-state,
.list-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.ongoing-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.16);
  padding: 13px;
  margin-bottom: 14px;
  cursor: pointer;
}

.ongoing-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.ongoing-card__title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ongoing-card__name,
.directory-card__name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 141, 40, 0.95);
}

.ongoing-card__dates {
  display: block;
  margin-top: 5px;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.45);
}

.ongoing-card__avp,
.directory-card__avp {
  text-align: right;
  flex-shrink: 0;
}

.avp-label {
  display: block;
  font-size: 10px;
  color: #6e6a7c;
}

.avp-values {
  font-size: 13px;
  font-weight: 600;
}

.amount-good {
  color: #52bf90;
}

.amount-warn {
  color: #ff8d28;
}

.amount-muted {
  color: #a8a8a8;
}

.status-pill {
  display: inline-flex;
  align-items: center;
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

.progress-track {
  position: relative;
  height: 10px;
  border-radius: 40px;
  background: rgba(168, 168, 168, 0.2);
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-track--lg {
  height: 10px;
}

.progress-fill {
  height: 100%;
  border-radius: 20px;
  transition: width 0.25s ease;
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

.progress-pct {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.72);
  pointer-events: none;
}

.ongoing-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-block {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-label {
  font-size: 8px;
  color: #6e6a7c;
  line-height: 1.2;
}

.stat-value {
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.72);
}

.stat-value--good {
  color: #52bf90;
}

.stat-value--danger {
  color: #c30010;
}

.directory-title {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.72);
}

.filter-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 5px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 10px;
  -webkit-overflow-scrolling: touch;
}

.filter-pill {
  flex: 0 0 auto;
  height: 24px;
  padding: 0 8px;
  border: 1px solid rgba(168, 168, 168, 0.35);
  border-radius: 8px;
  background: transparent;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.72);
  cursor: pointer;
}

.filter-pill--active {
  border-color: rgba(255, 141, 40, 0.75);
  color: rgba(255, 141, 40, 0.95);
}

.directory-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.directory-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.16);
  padding: 13px;
  cursor: pointer;
}

.directory-card__head {
  display: grid;
  grid-template-columns: 1fr auto 20px;
  gap: 8px;
  align-items: start;
  margin-bottom: 10px;
}

.directory-card__left {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.card-more-btn {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
}

.directory-card__foot {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 10px;
  color: #6e6a7c;
}

.foot-dates {
  text-align: right;
  white-space: nowrap;
}

.empty-directory {
  text-align: center;
  padding: 32px 0;
  color: #a8a8a8;
}

.empty-cta {
  margin-top: 12px;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  background: #ff8d28;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.tab-spacer {
  height: 80px;
}
</style>
