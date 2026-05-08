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

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent" />
        </div>

        <template v-else-if="planMeta">
          <section v-if="activeTab === 'overview' && dashboardData" class="overall-block">
            <div class="overall-head">
              <span class="overall-label">Overall Progress</span>
              <span class="overall-pct">{{ overallPct.toFixed(0) }}%</span>
            </div>
            <div class="overall-values">
              {{ formatMoney(dashboardData.totalActual, currency) }} / {{ formatMoney(dashboardData.totalBudget, currency) }}
            </div>
            <div class="progress-track">
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
                <div class="card-head-right">
                  <span class="card-ratio">{{ formatMoney(row.actual, currency) }} / {{ formatMoney(row.budget, currency) }}</span>
                  <span class="card-pct">{{ rowPct(row).toFixed(0) }}%</span>
                </div>
              </div>
              <div class="progress-track progress-track--lg">
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
                  <div class="sub-right">
                    <span class="sub-stats">{{ formatMoney(s.actual, currency) }} / {{ formatMoney(s.budget, currency) }}</span>
                    <div class="progress-track progress-track--sm">
                      <div
                        class="progress-fill"
                        :class="barToneClass(rowPct(s))"
                        :style="{ width: `${Math.min(rowPct(s), 100)}%` }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </template>

          <template v-else-if="activeTab === 'detailed'">
            <p v-if="detailedLoading" class="loading-inline">Loading…</p>
            <template v-else-if="periodReport?.items?.length">
              <p class="period-label">{{ periodReport.period_start }} – {{ periodReport.period_end }}</p>
              <section v-for="item in periodReport.items" :key="'d-' + item.category_id" class="budget-card">
                <div class="card-head">
                  <span class="card-title">{{ item.category_name }}</span>
                  <span class="card-ratio">{{ formatMoney(item.actual, currency) }} / {{ formatMoney(item.budget, currency) }}</span>
                </div>
                <div class="progress-track progress-track--lg">
                  <div
                    class="progress-fill"
                    :class="barToneClass(rowPct(item))"
                    :style="{ width: `${Math.min(rowPct(item), 100)}%` }"
                  />
                </div>
                <div v-if="item.sub_items?.length" class="sub-list">
                  <div v-for="s in item.sub_items" :key="'sd-' + s.category_id" class="sub-row">
                    <span class="grip" aria-hidden="true" />
                    <span class="sub-name">{{ s.category_name }}</span>
                    <div class="sub-right">
                      <span class="sub-stats">{{ formatMoney(s.actual, currency) }} / {{ formatMoney(s.budget, currency) }}</span>
                      <div class="progress-track progress-track--sm">
                        <div
                          class="progress-fill"
                          :class="barToneClass(rowPct(s))"
                          :style="{ width: `${Math.min(rowPct(s), 100)}%` }"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
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
            <ion-item v-if="canEditPlan" button lines="none" :detail="false" @click="onMore('edit')">
              <ion-label>Edit budget</ion-label>
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
  IonLabel
} from '@ionic/vue'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import {
  getBudgetById,
  getBudgetDashboardSummary,
  getBudgetPeriods,
  getBudgetPeriodReport,
  abandonBudget,
  deleteBudget
} from '@/api/accounting'
import BudgetSetupSheet from '@/views/budgets/components/BudgetSetupSheet.vue'

const route = useRoute()
const router = useRouter()

const planId = computed(() => route.params.id)

const loading = ref(true)
const detailedLoading = ref(false)
const activeTab = ref('overview')
const planMeta = ref(null)
const dashboardRaw = ref(null)
const periodReport = ref(null)

const moreOpen = ref(false)
const moreEvent = ref(undefined)
const editSheetOpen = ref(false)

const workspaceNameDisplay = computed(() => {
  const q = route.query.workspace_name
  if (q == null || q === '') return ''
  return typeof q === 'string' ? decodeURIComponent(q) : String(q)
})

const currency = computed(() => planMeta.value?.currency || dashboardRaw.value?.currency || 'USD')

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

const displayItems = computed(() => dashboardData.value?.items || [])

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

function barToneClass(pct) {
  if (pct > 100) return 'tone-danger'
  if (pct >= 70) return 'tone-warn'
  return 'tone-ok'
}

function formatMoney(val, code) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(val || 0)
  } catch {
    return String(val ?? 0)
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
  } catch {
    planMeta.value = null
    dashboardRaw.value = null
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
  try {
    const perRes = await getBudgetPeriods(planId.value)
    const periods = perRes?.data || []
    const idx = pickPeriodIndex(periods)
    const repRes = await getBudgetPeriodReport(planId.value, idx)
    periodReport.value = repRes?.data ?? null
  } catch {
    periodReport.value = null
  } finally {
    detailedLoading.value = false
  }
}

function setTab(tab) {
  activeTab.value = tab
  if (tab === 'detailed' && !periodReport.value) loadDetailed()
}

watch(
  () => planId.value,
  () => {
    periodReport.value = null
    loadCore()
  },
  { immediate: true }
)

function openMore(ev) {
  moreEvent.value = ev
  moreOpen.value = true
}

async function onMore(action) {
  moreOpen.value = false
  if (!planMeta.value) return
  if (action === 'edit') {
    editSheetOpen.value = true
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
      if (e !== 'cancel') showToast(e?.message || 'Failed')
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
      if (e !== 'cancel') showToast(e?.message || 'Failed')
    }
  }
}

async function onEdited() {
  await loadCore()
  periodReport.value = null
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
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.overall-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overall-label {
  font-weight: 600;
  color: #1a1a2e;
}

.overall-pct {
  font-weight: 700;
  color: #52bf90;
}

.overall-values {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.55);
  margin: 8px 0 12px;
}

.progress-track {
  height: 8px;
  background: #ececec;
  border-radius: 6px;
  overflow: hidden;
}

.progress-track--lg {
  height: 10px;
  margin-top: 8px;
}

.progress-track--sm {
  height: 6px;
  margin-top: 6px;
  max-width: 120px;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.2s ease;
}

.tone-ok {
  background: #52bf90;
}

.tone-warn {
  background: #e6c200;
}

.tone-danger {
  background: rgba(196, 0, 16, 0.74);
}

.budget-card {
  background: #fff;
  border-radius: 16px;
  padding: 14px 16px 12px;
  margin-bottom: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #ff8d28;
}

.card-head-right {
  text-align: right;
}

.card-ratio {
  display: block;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
}

.card-pct {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.sub-list {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.sub-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
}

.sub-name {
  flex: 1;
  font-size: 14px;
  color: #1a1a2e;
}

.sub-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 120px;
}

.sub-stats {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
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
