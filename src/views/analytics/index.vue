<template>
  <ion-page class="analytics-page">
    <ion-header class="ion-no-border">
      <ion-toolbar class="analytics-toolbar">
        <ion-title>Analytics</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" class="header-more-btn" aria-label="More options">
            <ion-icon :icon="ellipsisVertical" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="analytics-content">
      <div class="page-inner">
        <div v-if="analytics.loading" class="analytics-loading">
          <ion-spinner name="crescent" />
        </div>

        <div class="account-row">
          <button type="button" class="account-pill">
            <span class="account-pill__label">{{ analytics.headerLabel }}</span>
            <ion-icon :icon="chevronDown" class="account-pill__chev" />
          </button>
          <span class="account-balance">Bal: Rs {{ balanceDisplay }}</span>
        </div>

        <div class="view-toggle" role="tablist" aria-label="Report view">
          <button
            type="button"
            class="view-toggle__item"
            :class="{ 'view-toggle__item--active': viewMode === 'basic' }"
            role="tab"
            :aria-selected="viewMode === 'basic'"
            @click="viewMode = 'basic'"
          >
            <span>Basic view</span>
            <span v-if="viewMode === 'basic'" class="view-toggle__underline" />
          </button>
          <button
            type="button"
            class="view-toggle__item"
            :class="{ 'view-toggle__item--active': viewMode === 'advanced' }"
            role="tab"
            :aria-selected="viewMode === 'advanced'"
            @click="viewMode = 'advanced'"
          >
            <span>Advanced view</span>
            <span v-if="viewMode === 'advanced'" class="view-toggle__underline" />
          </button>
        </div>

        <div v-show="viewMode === 'basic'" class="chart-stack">
          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Monthly Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 12 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h120">
              <VChart class="echart" :option="monthlyBarOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Sub-category-wise</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>Last 12 months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--donut chart-card__body--donut-tall">
              <VChart class="echart echart--donut-tall" :option="subcategoryDonutAllTimeOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Monthly Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 12 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h120">
              <VChart class="echart" :option="incomeExpenseBarOption" autoresize />
            </div>
          </section>
        </div>

        <div v-show="viewMode === 'advanced'" class="chart-stack">
          <h3 class="section-title section-title--expense">Expense Analysis</h3>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Daily Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last Month</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h130">
              <VChart class="echart" :option="dailyAnalysisOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Monthly Progression</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>{{ progressionMonthLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h150">
              <VChart class="echart" :option="monthlyProgressionStepOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Day-of-Week Analysis</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>All Time</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h130 chart-card__body--deferred">
              <p class="chart-deferred-msg">Coming soon — needs weekday aggregation in reporting.</p>
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Day-of-Month Analysis</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>All Time</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h130 chart-card__body--deferred">
              <p class="chart-deferred-msg">Coming soon — needs cross-month day-of-month aggregation.</p>
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Monthly Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 12 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h120">
              <VChart class="echart" :option="monthlyBarOption" autoresize />
            </div>
          </section>

          <h3 class="section-title section-title--category">Categorical Analysis</h3>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Category-wise</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>Last 12 months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--donut">
              <VChart class="echart echart--donut" :option="categoryWiseDonutOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Sub-category-wise</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 6 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--donut chart-card__body--donut-tall chart-card__body--chart-loading">
              <div v-if="analytics.advancedCategoryLoading" class="chart-inline-loading">
                <ion-spinner name="crescent" />
              </div>
              <VChart v-else class="echart echart--donut-tall" :option="subcategoryDonutLast6Option" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Stacked Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 6 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h150 chart-card__body--chart-loading">
              <div v-if="analytics.advancedCategoryLoading" class="chart-inline-loading">
                <ion-spinner name="crescent" />
              </div>
              <VChart v-else class="echart" :option="stackedCategoryOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Category Analysis</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Category">
                <span>{{ categoryAnalysisTitle }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <p v-if="analytics.categoryMonthlyBars?.heuristic" class="chart-hint">
              Approximate monthly amounts (same share as top sub-category over 12 months).
            </p>
            <div class="chart-card__body chart-card__body--h120">
              <VChart class="echart" :option="categoryAnalysisBarOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Category Treemap</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>Last 12 months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h220">
              <VChart class="echart" :option="treemapRsOption" autoresize />
            </div>
          </section>

          <h3 class="section-title section-title--category">Flow &amp; distribution</h3>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Sankey Diagram</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>All Time</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h260 chart-card__body--deferred">
              <p class="chart-deferred-msg">Coming soon — flow charts need a dedicated reporting contract.</p>
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Pareto Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 12 months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--pareto chart-card__body--pareto-dynamic">
              <VChart class="echart echart--pareto" :option="pareto12kOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Radar Spider Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Current budget period</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h220">
              <VChart class="echart" :option="radarPlannedActualOption" autoresize />
            </div>
          </section>

          <h3 class="section-title section-title--category">I/E Analysis</h3>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Monthly Progression</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>{{ progressionMonthLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h150">
              <VChart class="echart" :option="ieProgressionDualAreaOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Monthly Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 12 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h120">
              <VChart class="echart" :option="incomeExpenseHighlightOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Gap Monthly Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 12 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h130">
              <VChart class="echart" :option="ieGapMonthlyOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Waterfall Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 12 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h150">
              <VChart class="echart" :option="ieWaterfall12Option" autoresize />
            </div>
          </section>
        </div>
      </div>
      <div class="tab-spacer" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  onIonViewDidEnter,
} from '@ionic/vue'
import { ellipsisVertical, chevronDown } from 'ionicons/icons'
import { showToast } from '@/utils/ionicFeedback'
import { useAnalyticsCharts, previousCalendarMonthRange } from '@/composables/useAnalyticsCharts'
import {
  monthlyExpenseBarOption as buildMonthlyExpenseBarOption,
  incomeExpenseBarOption as buildIncomeExpenseBarOption,
  incomeExpenseHighlightOption as buildIncomeExpenseHighlightOption,
  ieGapMonthlyOption as buildIeGapMonthlyOption,
  ieWaterfallOption as buildIeWaterfallOption,
  categoryDonutFromRows,
  dailyExpenseAnalysisOption as buildDailyExpenseAnalysisOption,
  cumulativeExpenseLineOption as buildCumulativeExpenseLineOption,
  ieProgressionDualAreaOption as buildIeProgressionDualAreaOption,
  stackedCategoryPercentOption as buildStackedCategoryPercentOption,
  categoryMonthlyBarsOption as buildCategoryMonthlyBarsOption,
  treemapFromCategories,
  paretoOption as buildParetoOption,
  radarBudgetOption as buildRadarBudgetOption,
  emptyRadarPlaceholder as buildEmptyRadarPlaceholder,
} from '@/views/analytics/chartOptions'

const analytics = useAnalyticsCharts()
const viewMode = ref('basic')

function cumSum(arr) {
  let s = 0
  return arr.map((v) => {
    s += v
    return s
  })
}

/** Expense per calendar day (1..dim) for `year`-`month` */
function expenseByDayOfMonth(dailyRows, year, month) {
  const dim = new Date(year, month, 0).getDate()
  const arr = Array(dim).fill(0)
  for (const r of dailyRows) {
    const ds = String(r.date).slice(0, 10)
    const parts = ds.split('-').map(Number)
    const yy = parts[0]
    const mm = parts[1]
    const dd = parts[2]
    if (yy !== year || mm !== month) continue
    arr[dd - 1] += Number(r.expense || 0)
  }
  return arr
}

function incomeByDayOfMonth(dailyRows, year, month) {
  const dim = new Date(year, month, 0).getDate()
  const arr = Array(dim).fill(0)
  for (const r of dailyRows) {
    const ds = String(r.date).slice(0, 10)
    const parts = ds.split('-').map(Number)
    const yy = parts[0]
    const mm = parts[1]
    const dd = parts[2]
    if (yy !== year || mm !== month) continue
    arr[dd - 1] += Number(r.income || 0)
  }
  return arr
}

const progressionYm = computed(() => {
  const { start_date } = previousCalendarMonthRange()
  const [y, m] = start_date.split('-').map(Number)
  return { year: y, month: m }
})

const progressionMonthLabel = computed(() => {
  const { year, month } = progressionYm.value
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })
})

const monthlySeries = computed(() => {
  const rows = analytics.monthlyLast12
  const labels = rows.map((r) =>
    new Date(r.year, r.month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
  )
  const expense = rows.map((r) => Number(r.expense) || 0)
  const income = rows.map((r) => Number(r.income) || 0)
  return { labels, expense, income }
})

const highlightMonthLabel = computed(() => {
  const { labels, expense } = monthlySeries.value
  if (!labels.length) return ''
  let maxIdx = 0
  let maxV = -1
  expense.forEach((v, i) => {
    if (v > maxV) {
      maxV = v
      maxIdx = i
    }
  })
  return labels[maxIdx] || labels[0]
})

const monthlyBarOption = computed(() =>
  buildMonthlyExpenseBarOption(monthlySeries.value.labels, monthlySeries.value.expense)
)

const incomeExpenseBarOption = computed(() =>
  buildIncomeExpenseBarOption(
    monthlySeries.value.labels,
    monthlySeries.value.income,
    monthlySeries.value.expense
  )
)

const incomeExpenseHighlightOption = computed(() =>
  buildIncomeExpenseHighlightOption(
    monthlySeries.value.labels,
    monthlySeries.value.income,
    monthlySeries.value.expense,
    highlightMonthLabel.value
  )
)

const ieGapMonthlyOption = computed(() => {
  const { labels, income, expense } = monthlySeries.value
  const gaps = income.map((inc, i) => inc - (expense[i] || 0))
  return buildIeGapMonthlyOption(labels, gaps)
})

const ieWaterfall12Option = computed(() =>
  buildIeWaterfallOption(
    monthlySeries.value.labels,
    monthlySeries.value.income,
    monthlySeries.value.expense
  )
)

const subcategoryDonutAllTimeOption = computed(() =>
  categoryDonutFromRows(analytics.categoryLeafAllTime, { tall: true })
)

const subcategoryDonutLast6Option = computed(() =>
  categoryDonutFromRows(analytics.categoryLeafLast6, { tall: true })
)

const categoryWiseDonutOption = computed(() =>
  categoryDonutFromRows(analytics.categoryParentAllTime, { tall: false })
)

const dailyExpenseSeries = computed(() => {
  const { year, month } = progressionYm.value
  return expenseByDayOfMonth(analytics.dailyLastMonth, year, month)
})

const dailyAnalysisOption = computed(() => {
  const dim = dailyExpenseSeries.value.length || 31
  return buildDailyExpenseAnalysisOption(dim, dailyExpenseSeries.value)
})

const monthlyProgressionStepOption = computed(() => {
  const exp = dailyExpenseSeries.value
  const labels = exp.map((_, i) => String(i + 1))
  return buildCumulativeExpenseLineOption(labels, cumSum(exp))
})

const ieDailyIncome = computed(() => {
  const { year, month } = progressionYm.value
  return incomeByDayOfMonth(analytics.dailyLastMonth, year, month)
})

const ieProgressionDualAreaOption = computed(() => {
  const exp = dailyExpenseSeries.value
  const inc = ieDailyIncome.value
  const n = Math.max(exp.length, inc.length)
  const labels = Array.from({ length: n }, (_, i) => String(i + 1))
  const pad = (a) => {
    const out = [...a]
    while (out.length < n) out.push(0)
    return out.slice(0, n)
  }
  return buildIeProgressionDualAreaOption(labels, cumSum(pad(inc)), cumSum(pad(exp)))
})

const stackedCategoryOption = computed(() =>
  buildStackedCategoryPercentOption(analytics.stackedMonthSlices)
)

const categoryAnalysisTitle = computed(() => analytics.categoryMonthlyBars.categoryName || 'Category')

const categoryAnalysisBarOption = computed(() => {
  const { labels, values } = analytics.categoryMonthlyBars
  return buildCategoryMonthlyBarsOption(labels, values)
})

const treemapRsOption = computed(() => treemapFromCategories(analytics.categoryParentAllTime))

const pareto12kOption = computed(() => {
  const rows = analytics.categoryParentAllTime
  const cats = rows.map((r) => r.category_name || 'Uncategorized')
  const amounts = rows.map((r) => Number(r.amount) || 0)
  return buildParetoOption(cats, amounts)
})

const radarPlannedActualOption = computed(() => {
  const raw = analytics.budgetRadar
  const items = raw?.items
  if (!items?.length) return buildEmptyRadarPlaceholder()
  const filtered = items.filter((it) => it.category_name != null)
  if (!filtered.length) return buildEmptyRadarPlaceholder()
  return buildRadarBudgetOption(filtered)
})

const balanceDisplay = computed(() => {
  const n = analytics.totalBalance || 0
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)
  } catch {
    return String(Math.round(n * 100) / 100)
  }
})

onIonViewDidEnter(async () => {
  await analytics.refresh()
  if (analytics.error) {
    showToast(analytics.error)
  }
  if (viewMode.value === 'advanced') {
    await analytics.loadAdvancedCategoryCharts()
    if (analytics.error) showToast(analytics.error)
  }
})

watch(viewMode, async (mode) => {
  if (mode !== 'advanced') return
  await analytics.loadAdvancedCategoryCharts()
  if (analytics.error) showToast(analytics.error)
})
</script>

<style scoped>
.analytics-page {
  --background: #efeef3;
}

.analytics-loading {
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
}

.chart-card__body--chart-loading {
  position: relative;
  min-height: 120px;
}

.chart-inline-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.65);
  z-index: 1;
}

.chart-hint {
  margin: 0 0 6px;
  font-size: 9px;
  line-height: 1.3;
  color: rgba(0, 0, 0, 0.45);
}

.chart-card__body--deferred {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}

.chart-deferred-msg {
  margin: 0;
  padding: 12px 14px;
  font-size: 11px;
  line-height: 1.35;
  color: rgba(0, 0, 0, 0.45);
  text-align: center;
}

.chart-card__body--pareto-dynamic {
  min-height: 160px;
}

.analytics-toolbar {
  --min-height: 48px;
  --border-width: 0;
  --background: #efeef3;
  --padding-top: 4px;
}

.analytics-toolbar ion-title {
  font-size: 16px;
  font-weight: 600;
  color: #000;
}

.header-more-btn {
  --color: #ff8d28;
  margin: 0;
}

.header-more-btn ion-icon {
  font-size: 24px;
}

.analytics-content {
  --background: #efeef3;
}

.page-inner {
  max-width: 400px;
  margin: 0 auto;
  padding: 0 16px 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.account-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 24px;
  margin-bottom: 10px;
}

.account-pill {
  display: inline-flex;
  align-items: center;
  max-width: 58%;
  padding: 0;
  background: none;
  border: none;
  color: rgba(0, 0, 0, 0.75);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
  text-align: left;
}

.account-pill__chev {
  width: 18px;
  height: 18px;
  color: #a8a8a8;
  flex-shrink: 0;
}

.account-balance {
  flex-shrink: 0;
  font-size: 12px;
  color: #a8a8a8;
}

.view-toggle {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 12px;
}

.view-toggle__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 2px 0 0;
  background: none;
  border: none;
  font-size: 14px;
  color: #8e8e93;
  cursor: pointer;
  min-width: 88px;
  font-weight: 500;
}

.view-toggle__item--active {
  font-weight: 700;
  color: #f39c12;
}

.view-toggle__underline {
  display: block;
  width: 20px;
  height: 3px;
  border-radius: 2px;
  background: #f39c12;
  margin-top: 2px;
}

.section-title {
  --section-title-accent: #007bff;
  margin: 10px 0 8px;
  padding: 12px 14px 12px 22px;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.25px;
  background: #fff;
  border: none;
  border-left: 3px solid var(--section-title-accent);
  border-radius: 6px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04) inset, 0 1px 2px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 3px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, transparent 100%);
  pointer-events: none;
  border-radius: 6px 6px 0 0;
}

.section-title--expense {
  color: #7b1fa2;
}

.section-title--category {
  color: #ff8c00;
}

.chart-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 10px 10px 12px;
}

.chart-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  min-height: 18px;
}

.chart-card__title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.2;
}

.period-chip {
  display: inline-flex;
  align-items: center;
  max-width: 52%;
  padding: 4px 4px 4px 6px;
  background: #fff;
  border: 1px solid rgba(168, 168, 168, 0.35);
  border-radius: 5px;
  font-size: 8px;
  line-height: 1;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  white-space: nowrap;
}

.period-chip--narrow {
  max-width: 46%;
}

.period-chip__icon {
  width: 16px;
  height: 16px;
  color: #a8a8a8;
  flex-shrink: 0;
}

.chart-card__body {
  width: 100%;
}

.chart-card__body--h120 {
  height: 120px;
}

.chart-card__body--h130 {
  height: 130px;
}

.chart-card__body--h150 {
  height: 150px;
}

.chart-card__body--h220 {
  height: 220px;
}

.chart-card__body--h260 {
  height: 260px;
}

.chart-card__body--donut {
  height: 200px;
}

.chart-card__body--donut-tall {
  height: 280px;
  min-height: 280px;
}

.echart {
  width: 100%;
  min-height: 100%;
}

.echart--donut {
  min-height: 200px;
}

.echart--donut-tall {
  min-height: 280px;
}

.chart-card__body--pareto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 188px;
}

.echart--pareto {
  flex: 0 0 132px;
  height: 132px;
  min-height: 132px;
}

.tab-spacer {
  height: 68px;
}
</style>
