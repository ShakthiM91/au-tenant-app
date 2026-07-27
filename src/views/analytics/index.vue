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
          <button type="button" class="account-pill" @click="showIslandScopeSheet">
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
              <button type="button" class="period-chip" aria-label="Select period" @click="showMonthlyAnalysisPeriodSheet">
                <span>{{ monthlyAnalysisPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h120"
              title="Monthly Analysis"
              :subtitle="monthlyAnalysisPeriodLabel"
              :option="monthlyBarOption"
              :empty="!analytics.loading && chartEmpty('monthlyAnalysis').empty"
              :empty-message="chartEmpty('monthlyAnalysis').message"
              :skeleton-variant="chartEmpty('monthlyAnalysis').skeletonVariant"
              chart-key="monthlyAnalysis"
              :on-drill="drillFor('monthlyAnalysis')"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Sub-category-wise</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Select period" @click="showCategoryDonutPeriodSheet">
                <span>{{ categoryDonutPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--donut chart-card__body--donut-tall"
              chart-class="echart--donut-tall"
              title="Sub-category-wise"
              :subtitle="categoryDonutPeriodLabel"
              :option="subcategoryDonutOption"
              :loading="categoryDonutLoading"
              :empty="chartEmpty('subcategory').empty"
              :empty-message="chartEmpty('subcategory').message"
              :skeleton-variant="chartEmpty('subcategory').skeletonVariant"
              chart-key="subcategory"
              :on-drill="drillFor('subcategory')"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Monthly Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range" @click="showIeMonthlyPeriodSheet">
                <span>{{ ieMonthlyPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h120"
              title="I/E Monthly Analysis"
              :subtitle="ieMonthlyPeriodLabel"
              :option="incomeExpenseBarOption"
              :empty="!analytics.loading && chartEmpty('ieMonthlyBar').empty"
              :empty-message="chartEmpty('ieMonthlyBar').message"
              :skeleton-variant="chartEmpty('ieMonthlyBar').skeletonVariant"
              chart-key="ieMonthlyBar"
              :on-drill="drillFor('ieMonthlyBar')"
              @open="openChartFocus"
            />
          </section>
        </div>

        <div v-show="viewMode === 'advanced'" class="chart-stack">
          <h3 class="section-title section-title--expense">Expense Analysis</h3>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Daily Analysis</h2>
              <button type="button" class="period-chip" aria-label="Select month" @click="showDailyMonthSheet">
                <span>{{ dailyMonthLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h130"
              title="Daily Analysis"
              :subtitle="dailyMonthLabel"
              :option="dailyAnalysisOption"
              :loading="analytics.dailyMonthLoading"
              :empty="chartEmpty('dailyAnalysis').empty"
              :empty-message="chartEmpty('dailyAnalysis').message"
              :skeleton-variant="chartEmpty('dailyAnalysis').skeletonVariant"
              chart-key="dailyAnalysis"
              :on-drill="drillFor('dailyAnalysis')"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Monthly Progression</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Select month" @click="showDailyMonthSheet">
                <span>{{ dailyMonthLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h150"
              title="Monthly Progression"
              :subtitle="dailyMonthLabel"
              :option="monthlyProgressionStepOption"
              :loading="analytics.dailyMonthLoading"
              :empty="chartEmpty('monthlyProgression').empty"
              :empty-message="chartEmpty('monthlyProgression').message"
              :skeleton-variant="chartEmpty('monthlyProgression').skeletonVariant"
              chart-key="monthlyProgression"
              :on-drill="drillFor('monthlyProgression')"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Day-of-Week Analysis</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Select period" @click="showPatternPeriodSheet">
                <span>{{ patternPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h130"
              title="Day-of-Week Analysis"
              :subtitle="patternPeriodLabel"
              :option="weekdayAnalysisOption"
              :loading="analytics.patternLoading"
              :empty="chartEmpty('weekday').empty"
              :empty-message="chartEmpty('weekday').message"
              :skeleton-variant="chartEmpty('weekday').skeletonVariant"
              chart-key="weekday"
              :on-drill="drillFor('weekday')"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Day-of-Month Analysis</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Select period" @click="showPatternPeriodSheet">
                <span>{{ patternPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h130"
              title="Day-of-Month Analysis"
              :subtitle="patternPeriodLabel"
              :option="dayOfMonthAnalysisOption"
              :loading="analytics.patternLoading"
              :empty="chartEmpty('dom').empty"
              :empty-message="chartEmpty('dom').message"
              :skeleton-variant="chartEmpty('dom').skeletonVariant"
              chart-key="dom"
              :on-drill="drillFor('dom')"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Monthly Analysis</h2>
              <button type="button" class="period-chip" aria-label="Select period" @click="showMonthlyAnalysisPeriodSheet">
                <span>{{ monthlyAnalysisPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h120"
              title="Monthly Analysis"
              :subtitle="monthlyAnalysisPeriodLabel"
              :option="monthlyBarOption"
              :empty="!analytics.loading && chartEmpty('monthlyAnalysis').empty"
              :empty-message="chartEmpty('monthlyAnalysis').message"
              :skeleton-variant="chartEmpty('monthlyAnalysis').skeletonVariant"
              chart-key="monthlyAnalysis"
              :on-drill="drillFor('monthlyAnalysis')"
              @open="openChartFocus"
            />
          </section>

          <h3 class="section-title section-title--category">Categorical Analysis</h3>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Category-wise</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Select period" @click="showCategoryDonutPeriodSheet">
                <span>{{ categoryDonutPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--donut"
              chart-class="echart--donut"
              title="Category-wise"
              :subtitle="categoryDonutPeriodLabel"
              :option="categoryWiseDonutOption"
              :loading="categoryDonutLoading"
              :empty="chartEmpty('categoryWise').empty"
              :empty-message="chartEmpty('categoryWise').message"
              :skeleton-variant="chartEmpty('categoryWise').skeletonVariant"
              chart-key="categoryWise"
              :on-drill="drillFor('categoryWise')"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Sub-category-wise</h2>
              <button type="button" class="period-chip" aria-label="Select period" @click="showCategoryDonutPeriodSheet">
                <span>{{ categoryDonutPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--donut chart-card__body--donut-tall"
              chart-class="echart--donut-tall"
              title="Sub-category-wise"
              :subtitle="categoryDonutPeriodLabel"
              :option="subcategoryDonutOption"
              :loading="categoryDonutLoading"
              :empty="chartEmpty('subcategory').empty"
              :empty-message="chartEmpty('subcategory').message"
              :skeleton-variant="chartEmpty('subcategory').skeletonVariant"
              chart-key="subcategory"
              :on-drill="drillFor('subcategory')"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Stacked Analysis</h2>
              <button type="button" class="period-chip" aria-label="Select period" @click="showStackedPeriodSheet">
                <span>{{ stackedPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h150"
              title="Stacked Analysis"
              :subtitle="stackedPeriodLabel"
              :option="stackedCategoryOption"
              :loading="analytics.stackedLoading"
              :empty="chartEmpty('stacked').empty"
              :empty-message="chartEmpty('stacked').message"
              :skeleton-variant="chartEmpty('stacked').skeletonVariant"
              chart-key="stacked"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Category Analysis</h2>
              <CategoryPickerFlyout
                ref="categoryAnalysisPickerRef"
                v-model="categoryAnalysisSelectedId"
                class="category-analysis-picker"
                fit-content
                :workspace-id="categoryPickerWorkspaceId"
                :include-workspace-scoped="categoryPickerIncludeAllWorkspaces"
                :display-label="categoryAnalysisTitle"
                placeholder="Select category"
                aria-label="Select category"
                @select="onCategoryAnalysisSelect"
              >
                <template #chevron>
                  <ion-icon :icon="chevronDown" class="period-chip__icon" />
                </template>
              </CategoryPickerFlyout>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h120"
              title="Category Analysis"
              :subtitle="categoryAnalysisTitle"
              :option="categoryAnalysisBarOption"
              :loading="analytics.categoryAnalysisLoading"
              :empty="chartEmpty('categoryAnalysis').empty"
              :empty-message="chartEmpty('categoryAnalysis').message"
              :skeleton-variant="chartEmpty('categoryAnalysis').skeletonVariant"
              chart-key="categoryAnalysis"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Category Treemap</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Select period" @click="showTreemapPeriodSheet">
                <span>{{ treemapPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h220"
              title="Category Treemap"
              :subtitle="treemapPeriodLabel"
              :option="treemapRsOption"
              :loading="analytics.treemapLoading"
              :empty="chartEmpty('treemap').empty"
              :empty-message="chartEmpty('treemap').message"
              :skeleton-variant="chartEmpty('treemap').skeletonVariant"
              chart-key="treemap"
              :on-drill="drillFor('treemap')"
              @open="openChartFocus"
            />
          </section>

          <h3 class="section-title section-title--category">Flow &amp; distribution</h3>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Sankey Diagram</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Select month" @click="showSankeyMonthSheet">
                <span>{{ sankeyMonthLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--sankey"
              :body-style="sankeyBodyStyle"
              chart-class="echart--sankey"
              title="Sankey Diagram"
              :subtitle="sankeyMonthLabel"
              :option="sankeyOption"
              :loading="analytics.sankeyLoading"
              :empty="chartEmpty('sankey').empty"
              :empty-message="chartEmpty('sankey').message"
              :skeleton-variant="chartEmpty('sankey').skeletonVariant"
              chart-key="sankey"
              :on-drill="drillFor('sankey')"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Pareto Analysis</h2>
              <button type="button" class="period-chip" aria-label="Select period" @click="showParetoPeriodSheet">
                <span>{{ paretoPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              :body-class="['chart-card__body--pareto', 'chart-card__body--pareto-dynamic']"
              chart-class="echart--pareto"
              title="Pareto Analysis"
              :subtitle="paretoPeriodLabel"
              :option="pareto12kOption"
              :loading="analytics.paretoLoading"
              :empty="chartEmpty('pareto').empty"
              :empty-message="chartEmpty('pareto').message"
              :skeleton-variant="chartEmpty('pareto').skeletonVariant"
              chart-key="pareto"
              :on-drill="drillFor('pareto')"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Radar Spider Analysis</h2>
              <button
                type="button"
                class="period-chip period-chip--narrow"
                aria-label="Select budget period"
                @click="showBudgetRadarPeriodSheet"
              >
                <span>{{ analytics.budgetRadarPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h220"
              title="Radar Spider Analysis"
              :subtitle="analytics.budgetRadarPeriodLabel"
              :option="radarPlannedActualOption"
              :loading="analytics.budgetRadarLoading"
              :empty="chartEmpty('radar').empty"
              :empty-message="chartEmpty('radar').message"
              :skeleton-variant="chartEmpty('radar').skeletonVariant"
              chart-key="radar"
              :on-drill="drillFor('radar')"
              @open="openChartFocus"
            />
          </section>

          <h3 class="section-title section-title--category">I/E Analysis</h3>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Monthly Progression</h2>
              <button
                type="button"
                class="period-chip period-chip--narrow"
                aria-label="Select month"
                @click="showIeProgressionMonthSheet"
              >
                <span>{{ progressionMonthLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h150"
              title="I/E Monthly Progression"
              :subtitle="progressionMonthLabel"
              :option="ieProgressionDualAreaOption"
              :loading="analytics.ieProgressionMonthLoading"
              :empty="chartEmpty('ieProgression').empty"
              :empty-message="chartEmpty('ieProgression').message"
              :skeleton-variant="chartEmpty('ieProgression').skeletonVariant"
              chart-key="ieProgression"
              :on-drill="drillFor('ieProgression')"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Monthly Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range" @click="showIeMonthlyPeriodSheet">
                <span>{{ ieMonthlyPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h120"
              title="I/E Monthly Analysis"
              :subtitle="ieMonthlyPeriodLabel"
              :option="incomeExpenseHighlightOption"
              :empty="!analytics.loading && chartEmpty('ieMonthly').empty"
              :empty-message="chartEmpty('ieMonthly').message"
              :skeleton-variant="chartEmpty('ieMonthly').skeletonVariant"
              chart-key="ieMonthly"
              :on-drill="drillFor('ieMonthly')"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Gap Monthly Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range" @click="showIeMonthlyPeriodSheet">
                <span>{{ ieMonthlyPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h130"
              title="I/E Gap Monthly Analysis"
              :subtitle="ieMonthlyPeriodLabel"
              :option="ieGapMonthlyOption"
              :empty="!analytics.loading && chartEmpty('ieGap').empty"
              :empty-message="chartEmpty('ieGap').message"
              :skeleton-variant="chartEmpty('ieGap').skeletonVariant"
              chart-key="ieGap"
              :on-drill="drillFor('ieGap')"
              @open="openChartFocus"
            />
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Waterfall Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range" @click="showIeMonthlyPeriodSheet">
                <span>{{ ieMonthlyPeriodLabel }}</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <AnalyticsChartPanel
              body-class="chart-card__body--h150"
              title="I/E Waterfall Analysis"
              :subtitle="ieMonthlyPeriodLabel"
              :option="ieWaterfall12Option"
              :empty="!analytics.loading && chartEmpty('ieWaterfall').empty"
              :empty-message="chartEmpty('ieWaterfall').message"
              :skeleton-variant="chartEmpty('ieWaterfall').skeletonVariant"
              chart-key="ieWaterfall"
              :on-drill="drillFor('ieWaterfall')"
              @open="openChartFocus"
            />
          </section>
        </div>
      </div>
      <div class="tab-spacer" />
    </ion-content>

    <AnalyticsChartFocusModal
      :open="!!chartFocusKey"
      :title="chartFocusTitle"
      :subtitle="chartFocusSubtitle"
      :option="chartFocusOption"
      :options-label="chartFocusOptionsLabel"
      :options-aria-label="chartFocusOptionsAriaLabel"
      :on-drill="focusDrillHandler"
      @options-click="onChartFocusOptionsClick"
      @close="closeChartFocus"
    />
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
  actionSheetController,
} from '@ionic/vue'
import { ellipsisVertical, chevronDown } from 'ionicons/icons'
import { showToast } from '@/utils/ionicFeedback'
import {
  useAnalyticsCharts,
  selectableDailyMonths,
  selectableSankeyMonths,
  selectableIeProgressionMonths,
  PATTERN_PERIOD_OPTIONS,
  CATEGORY_DONUT_PERIOD_OPTIONS,
  STACKED_PERIOD_OPTIONS,
  TREEMAP_PERIOD_OPTIONS,
  PARETO_PERIOD_OPTIONS,
  STANDARD_PERIOD_OPTIONS,
  chartPeriodLabel,
  sliceMonthlyByPeriod,
  expensesByWeekday,
  expensesByDayOfMonthPattern,
  WEEKDAY_LABELS,
} from '@/composables/useAnalyticsCharts'
import {
  monthlyExpenseBarOption as buildMonthlyExpenseBarOption,
  incomeExpenseBarOption as buildIncomeExpenseBarOption,
  incomeExpenseHighlightOption as buildIncomeExpenseHighlightOption,
  ieGapMonthlyOption as buildIeGapMonthlyOption,
  ieWaterfallOption as buildIeWaterfallOption,
  categoryDonutFromRows,
  dailyExpenseAnalysisOption as buildDailyExpenseAnalysisOption,
  weekdayExpenseAnalysisOption as buildWeekdayExpenseAnalysisOption,
  cumulativeExpenseLineOption as buildCumulativeExpenseLineOption,
  ieProgressionDualAreaOption as buildIeProgressionDualAreaOption,
  ieProgressionDayLabels,
  stackedCategoryPercentOption as buildStackedCategoryPercentOption,
  categoryMonthlyBarsOption as buildCategoryMonthlyBarsOption,
  treemapFromCategories,
  sankeyFromFlow,
  sankeyChartHeight,
  paretoOption as buildParetoOption,
  emptyRadarPlaceholder as buildEmptyRadarPlaceholder,
} from '@/views/analytics/chartOptions'
import { hasRadarChartData, radarFromReportItems } from '@/utils/radarChart'
import { getAnalyticsChartEmptyState } from '@/utils/analyticsChartEmpty'
import AnalyticsChartPanel from '@/views/analytics/components/AnalyticsChartPanel.vue'
import AnalyticsChartFocusModal from '@/views/analytics/components/AnalyticsChartFocusModal.vue'
import { useAnalyticsDrillDown } from '@/views/analytics/useAnalyticsDrillDown.js'
import CategoryPickerFlyout from '@/components/CategoryPickerFlyout.vue'
import { toYmdInLocalTime } from '@/utils/profileDisplay'
import {
  categoryIdsForQuery,
  categoryLabelsForQuery,
} from '@/utils/categoryFilterTree.js'

const analytics = useAnalyticsCharts()
const viewMode = ref('basic')
const chartFocusKey = ref(null)
const chartFocusTitle = ref('')
const categoryAnalysisPickerRef = ref(null)
const categoryAnalysisSelectedId = ref(null)

const categoryPickerWorkspaceId = computed(() => {
  const scope = analytics.selectedIslandScope
  if (scope === 'all' || scope === 'null') return null
  const n = Number(scope)
  return Number.isFinite(n) ? n : null
})

const categoryPickerIncludeAllWorkspaces = computed(
  () => analytics.selectedIslandScope === 'all'
)

const MONTHLY_ANALYSIS_PERIODS = STANDARD_PERIOD_OPTIONS
const monthlyAnalysisMonths = ref(6)

const IE_MONTHLY_PERIOD_OPTIONS = STANDARD_PERIOD_OPTIONS.filter((p) => p.months === 6 || p.months === 12)
const ieMonthlyAnalysisMonths = ref(6)

const drillDown = useAnalyticsDrillDown(analytics, {
  monthlyAnalysisMonths,
  ieMonthlyAnalysisMonths,
})

function drillFor(key) {
  return (params) => drillDown.focusDrillHandler(key, params)
}

const focusDrillHandler = computed(() =>
  chartFocusKey.value ? drillFor(chartFocusKey.value) : null
)

const patternPeriodLabel = computed(() => {
  const opt = PATTERN_PERIOD_OPTIONS.find((p) => p.months === analytics.patternPeriodMonths)
  return opt?.label || 'All Time'
})

const categoryDonutPeriodLabel = computed(() =>
  chartPeriodLabel(analytics.categoryDonutPeriodMonths, 'This Month')
)

const categoryDonutLoading = computed(() => analytics.categoryDonutLoading)

const stackedPeriodLabel = computed(() =>
  chartPeriodLabel(analytics.stackedPeriodMonths, 'Last 6 Months')
)

const treemapPeriodLabel = computed(() =>
  chartPeriodLabel(analytics.treemapPeriodMonths, 'Last 12 Months')
)

const paretoPeriodLabel = computed(() =>
  chartPeriodLabel(analytics.paretoPeriodMonths, 'Last 12 Months')
)

const weekdayAnalysisOption = computed(() => {
  const expenses = expensesByWeekday(analytics.weekdayRows)
  return buildWeekdayExpenseAnalysisOption(WEEKDAY_LABELS, expenses)
})

const dayOfMonthAnalysisOption = computed(() => {
  const expenses = expensesByDayOfMonthPattern(analytics.dayOfMonthRows)
  return buildDailyExpenseAnalysisOption(31, expenses)
})

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
    const ds = toYmdInLocalTime(r.date)
    if (!ds) continue
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
    const ds = toYmdInLocalTime(r.date)
    if (!ds) continue
    const parts = ds.split('-').map(Number)
    const yy = parts[0]
    const mm = parts[1]
    const dd = parts[2]
    if (yy !== year || mm !== month) continue
    arr[dd - 1] += Number(r.income || 0)
  }
  return arr
}

const progressionMonthLabel = computed(() => {
  const { year, month } = analytics.selectedIeProgressionMonth
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const dailyMonthLabel = computed(() => {
  const { year, month } = analytics.selectedDailyMonth
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const sankeyMonthLabel = computed(() => {
  const { year, month } = analytics.selectedSankeyMonth
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const ieMonthlyPeriodLabel = computed(() =>
  chartPeriodLabel(ieMonthlyAnalysisMonths.value, 'Last 6 Months')
)

const ieMonthlySeries = computed(() => {
  const rows = sliceMonthlyByPeriod(analytics.monthlyLast12, ieMonthlyAnalysisMonths.value)
  const labels = rows.map((r) =>
    new Date(r.year, r.month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
  )
  const expense = rows.map((r) => Number(r.expense) || 0)
  const income = rows.map((r) => Number(r.income) || 0)
  return { labels, expense, income }
})

const monthlyAnalysisPeriodLabel = computed(() =>
  chartPeriodLabel(monthlyAnalysisMonths.value, 'Last 6 Months')
)

const monthlyAnalysisSeries = computed(() => {
  const rows = sliceMonthlyByPeriod(analytics.monthlyLast12, monthlyAnalysisMonths.value)
  const labels = rows.map((r) =>
    new Date(r.year, r.month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
  )
  const expense = rows.map((r) => Number(r.expense) || 0)
  const income = rows.map((r) => Number(r.income) || 0)
  return { labels, expense, income }
})

const highlightMonthLabel = computed(() => {
  const { labels, expense } = ieMonthlySeries.value
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
  buildMonthlyExpenseBarOption(monthlyAnalysisSeries.value.labels, monthlyAnalysisSeries.value.expense)
)

const incomeExpenseBarOption = computed(() =>
  buildIncomeExpenseBarOption(
    ieMonthlySeries.value.labels,
    ieMonthlySeries.value.income,
    ieMonthlySeries.value.expense
  )
)

const incomeExpenseHighlightOption = computed(() =>
  buildIncomeExpenseHighlightOption(
    ieMonthlySeries.value.labels,
    ieMonthlySeries.value.income,
    ieMonthlySeries.value.expense,
    highlightMonthLabel.value
  )
)

const ieGapMonthlyOption = computed(() => {
  const { labels, income, expense } = ieMonthlySeries.value
  const gaps = income.map((inc, i) => inc - (expense[i] || 0))
  return buildIeGapMonthlyOption(labels, gaps)
})

const ieWaterfall12Option = computed(() =>
  buildIeWaterfallOption(
    ieMonthlySeries.value.labels,
    ieMonthlySeries.value.income,
    ieMonthlySeries.value.expense
  )
)

const subcategoryDonutOption = computed(() =>
  categoryDonutFromRows(analytics.categoryLeafRowsForDonut, { tall: true })
)

const categoryWiseDonutOption = computed(() =>
  categoryDonutFromRows(analytics.categoryParentRowsForDonut, { tall: false })
)

const dailyExpenseSeries = computed(() => {
  const { year, month } = analytics.selectedDailyMonth
  return expenseByDayOfMonth(analytics.dailyMonthRows, year, month)
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

const ieProgressionDualAreaOption = computed(() => {
  const { year, month } = analytics.selectedIeProgressionMonth
  const exp = expenseByDayOfMonth(analytics.ieProgressionMonthRows, year, month)
  const inc = incomeByDayOfMonth(analytics.ieProgressionMonthRows, year, month)
  const n = Math.max(exp.length, inc.length)
  const labels = ieProgressionDayLabels(year, month, n)
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

function resolveCategoryPickerMaps() {
  const picker = categoryAnalysisPickerRef.value
  const rawMap = picker?.categoryNodeById
  const nodeMap = rawMap instanceof Map ? rawMap : rawMap?.value instanceof Map ? rawMap.value : new Map()
  const rawOpts = picker?.categoryMenuOptions
  const menuOptions = Array.isArray(rawOpts) ? rawOpts : rawOpts?.value ?? []
  return { nodeMap, menuOptions }
}

function categoryAnalysisQueryForId(categoryId) {
  const { nodeMap, menuOptions } = resolveCategoryPickerMaps()
  const id = Number(categoryId)
  return {
    ids: categoryIdsForQuery([id], nodeMap),
    labels: categoryLabelsForQuery([id], menuOptions),
  }
}

function categoryAnalysisLabel(categoryId) {
  const { nodeMap, menuOptions } = resolveCategoryPickerMaps()
  const node = nodeMap.get(Number(categoryId))
  if (node?.name) return node.name
  const flat = menuOptions.find((o) => o.id === Number(categoryId))
  return flat?.label?.split(' > ').pop() || categoryAnalysisTitle.value
}

async function onCategoryAnalysisSelect(categoryId) {
  const id = Number(categoryId)
  if (!Number.isFinite(id) || id <= 0) return
  categoryAnalysisSelectedId.value = id
  const query = categoryAnalysisQueryForId(id)
  try {
    await analytics.setCategoryAnalysisCategory(
      id,
      query.ids,
      categoryAnalysisLabel(id),
      query.labels
    )
    if (analytics.error) showToast(analytics.error)
  } catch {
    if (analytics.error) showToast(analytics.error)
  }
}

watch(
  () => analytics.categoryAnalysisId,
  (id) => {
    const n = Number(id)
    if (Number.isFinite(n) && n > 0) categoryAnalysisSelectedId.value = n
  },
  { immediate: true }
)

const categoryAnalysisBarOption = computed(() => {
  const { labels, values } = analytics.categoryMonthlyBars
  return buildCategoryMonthlyBarsOption(labels, values)
})

const treemapRsOption = computed(() => treemapFromCategories(analytics.treemapParentRows))

const sankeyOption = computed(() => sankeyFromFlow(analytics.sankeyFlow))

const sankeyBodyStyle = computed(() => {
  const h = sankeyChartHeight(sankeyOption.value)
  return { height: `${h}px`, minHeight: `${h}px` }
})

const pareto12kOption = computed(() => {
  const rows = [...analytics.paretoParentRows].sort(
    (a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0)
  )
  const cats = rows.map((r) => r.category_name || 'Uncategorized')
  const amounts = rows.map((r) => Number(r.amount) || 0)
  return buildParetoOption(cats, amounts)
})

const radarPlannedActualOption = computed(() => {
  const items = analytics.budgetRadar?.items
  if (!hasRadarChartData(items)) return buildEmptyRadarPlaceholder()
  return radarFromReportItems(items)
})

const CHART_EMPTY_KEYS = [
  'monthlyAnalysis',
  'subcategory',
  'ieMonthlyBar',
  'dailyAnalysis',
  'monthlyProgression',
  'weekday',
  'dom',
  'categoryWise',
  'stacked',
  'categoryAnalysis',
  'treemap',
  'sankey',
  'pareto',
  'radar',
  'ieProgression',
  'ieMonthly',
  'ieGap',
  'ieWaterfall',
]

const chartEmptyCtx = computed(() => {
  const { year: ieYear, month: ieMonth } = analytics.selectedIeProgressionMonth
  return {
    dailyExpenses: dailyExpenseSeries.value,
    weekdayExpenses: expensesByWeekday(analytics.weekdayRows),
    domExpenses: expensesByDayOfMonthPattern(analytics.dayOfMonthRows),
    monthlyAnalysisExpense: monthlyAnalysisSeries.value.expense,
    categoryParentRows: analytics.categoryParentRowsForDonut,
    categoryLeafRows: analytics.categoryLeafRowsForDonut,
    stackedMonthSlices: analytics.stackedMonthSlices,
    categoryMonthlyBars: analytics.categoryMonthlyBars,
    treemapParentRows: analytics.treemapParentRows,
    paretoParentRows: analytics.paretoParentRows,
    sankeyFlow: analytics.sankeyFlow,
    budgetRadarItems: analytics.budgetRadar?.items,
    ieProgressionDailyExpenses: expenseByDayOfMonth(
      analytics.ieProgressionMonthRows,
      ieYear,
      ieMonth
    ),
    ieProgressionDailyIncome: incomeByDayOfMonth(
      analytics.ieProgressionMonthRows,
      ieYear,
      ieMonth
    ),
    ieMonthlyIncome: ieMonthlySeries.value.income,
    ieMonthlyExpense: ieMonthlySeries.value.expense,
  }
})

const chartEmptyByKey = computed(() => {
  const ctx = chartEmptyCtx.value
  const map = {}
  for (const key of CHART_EMPTY_KEYS) {
    map[key] = getAnalyticsChartEmptyState(key, ctx)
  }
  return map
})

function chartEmpty(key) {
  return chartEmptyByKey.value[key] || { empty: false, message: '', skeletonVariant: 'bar' }
}

const balanceDisplay = computed(() => {
  const n = analytics.totalBalance || 0
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)
  } catch {
    return String(Math.round(n * 100) / 100)
  }
})

function openChartFocus(payload) {
  if (!payload?.chartKey) return
  chartFocusKey.value = payload.chartKey
  chartFocusTitle.value = payload.title || 'Chart'
}

function closeChartFocus() {
  chartFocusKey.value = null
  chartFocusTitle.value = ''
}

const chartFocusOption = computed(() => {
  switch (chartFocusKey.value) {
    case 'monthlyAnalysis':
      return monthlyBarOption.value
    case 'subcategory':
      return subcategoryDonutOption.value
    case 'categoryWise':
      return categoryWiseDonutOption.value
    case 'ieMonthlyBar':
      return incomeExpenseBarOption.value
    case 'ieMonthly':
      return incomeExpenseHighlightOption.value
    case 'ieGap':
      return ieGapMonthlyOption.value
    case 'ieWaterfall':
      return ieWaterfall12Option.value
    case 'dailyAnalysis':
      return dailyAnalysisOption.value
    case 'monthlyProgression':
      return monthlyProgressionStepOption.value
    case 'weekday':
      return weekdayAnalysisOption.value
    case 'dom':
      return dayOfMonthAnalysisOption.value
    case 'stacked':
      return stackedCategoryOption.value
    case 'categoryAnalysis':
      return categoryAnalysisBarOption.value
    case 'treemap':
      return treemapRsOption.value
    case 'sankey':
      return sankeyOption.value
    case 'pareto':
      return pareto12kOption.value
    case 'radar':
      return radarPlannedActualOption.value
    case 'ieProgression':
      return ieProgressionDualAreaOption.value
    default:
      return {}
  }
})

const chartFocusSubtitle = computed(() => {
  switch (chartFocusKey.value) {
    case 'monthlyAnalysis':
      return monthlyAnalysisPeriodLabel.value
    case 'subcategory':
    case 'categoryWise':
      return categoryDonutPeriodLabel.value
    case 'ieMonthlyBar':
    case 'ieMonthly':
    case 'ieGap':
    case 'ieWaterfall':
      return ieMonthlyPeriodLabel.value
    case 'dailyAnalysis':
    case 'monthlyProgression':
      return dailyMonthLabel.value
    case 'weekday':
    case 'dom':
      return patternPeriodLabel.value
    case 'stacked':
      return stackedPeriodLabel.value
    case 'categoryAnalysis':
      return categoryAnalysisTitle.value
    case 'treemap':
      return treemapPeriodLabel.value
    case 'sankey':
      return sankeyMonthLabel.value
    case 'pareto':
      return paretoPeriodLabel.value
    case 'radar':
      return analytics.budgetRadarPeriodLabel
    case 'ieProgression':
      return progressionMonthLabel.value
    default:
      return ''
  }
})

const chartFocusOptionsLabel = computed(() =>
  chartFocusKey.value ? chartFocusSubtitle.value : ''
)

const chartFocusOptionsAriaLabel = computed(() => {
  switch (chartFocusKey.value) {
    case 'dailyAnalysis':
    case 'monthlyProgression':
    case 'sankey':
    case 'ieProgression':
      return 'Select month'
    case 'categoryAnalysis':
      return 'Select category'
    case 'radar':
      return 'Select budget period'
    case 'ieMonthlyBar':
    case 'ieMonthly':
    case 'ieGap':
    case 'ieWaterfall':
      return 'Time range'
    default:
      return 'Select period'
  }
})

function onChartFocusOptionsClick() {
  switch (chartFocusKey.value) {
    case 'monthlyAnalysis':
      return showMonthlyAnalysisPeriodSheet()
    case 'subcategory':
    case 'categoryWise':
      return showCategoryDonutPeriodSheet()
    case 'ieMonthlyBar':
    case 'ieMonthly':
    case 'ieGap':
    case 'ieWaterfall':
      return showIeMonthlyPeriodSheet()
    case 'dailyAnalysis':
    case 'monthlyProgression':
      return showDailyMonthSheet()
    case 'weekday':
    case 'dom':
      return showPatternPeriodSheet()
    case 'stacked':
      return showStackedPeriodSheet()
    case 'categoryAnalysis':
      return showCategoryAnalysisSheet()
    case 'treemap':
      return showTreemapPeriodSheet()
    case 'sankey':
      return showSankeyMonthSheet()
    case 'pareto':
      return showParetoPeriodSheet()
    case 'radar':
      return showBudgetRadarPeriodSheet()
    case 'ieProgression':
      return showIeProgressionMonthSheet()
    default:
      return undefined
  }
}

async function showCategoryAnalysisSheet() {
  await categoryAnalysisPickerRef.value?.loadCategories?.()
  const { menuOptions } = resolveCategoryPickerMaps()
  if (!menuOptions.length) {
    showToast('No categories available')
    return
  }
  const selected = categoryAnalysisSelectedId.value
  const buttons = menuOptions.map((opt) => ({
    text: opt.id === selected ? `${opt.label} ✓` : opt.label,
    handler: () => {
      void onCategoryAnalysisSelect(opt.id)
    },
  }))
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Select category',
    buttons,
  })
  await sheet.present()
}

async function loadAdvancedCharts() {
  await categoryAnalysisPickerRef.value?.loadCategories?.()
  await Promise.all([
    analytics.loadStackedChart(),
    analytics.loadPatternCharts(),
    analytics.loadTreemapChart(),
    analytics.loadParetoChart(),
    analytics.loadBudgetRadarChart(),
    analytics.ensureSankeyChart(),
    analytics.ensureIeProgressionMonth(),
    analytics.ensureCategoryAnalysisChart((id) => categoryAnalysisQueryForId(id)),
  ])
  if (analytics.error) showToast(analytics.error)
}

async function showTreemapPeriodSheet() {
  const selected = analytics.treemapPeriodMonths
  const buttons = TREEMAP_PERIOD_OPTIONS.map(({ months, label }) => ({
    text: months === selected ? `${label} ✓` : label,
    handler: () => {
      void (async () => {
        if (months === selected) return
        try {
          await analytics.setTreemapPeriod(months)
          if (analytics.error) showToast(analytics.error)
        } catch {
          if (analytics.error) showToast(analytics.error)
        }
      })()
    },
  }))
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Time range',
    buttons,
  })
  await sheet.present()
}

async function showParetoPeriodSheet() {
  const selected = analytics.paretoPeriodMonths
  const buttons = PARETO_PERIOD_OPTIONS.map(({ months, label }) => ({
    text: months === selected ? `${label} ✓` : label,
    handler: () => {
      void (async () => {
        if (months === selected) return
        try {
          await analytics.setParetoPeriod(months)
          if (analytics.error) showToast(analytics.error)
        } catch {
          if (analytics.error) showToast(analytics.error)
        }
      })()
    },
  }))
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Time range',
    buttons,
  })
  await sheet.present()
}

async function showBudgetRadarPeriodSheet() {
  if (analytics.selectedIslandScope === 'all') {
    showToast('Select a specific island to view budget periods')
    return
  }
  try {
    await analytics.ensureBudgetRadarPickerOptions()
  } catch {
    if (analytics.error) showToast(analytics.error)
    return
  }
  const options = analytics.budgetRadarPickerOptions
  if (!options?.length) {
    showToast('No budgets for this island')
    return
  }
  const selected = analytics.budgetRadarSelection
  const buttons = options.map((opt) => {
    const isSelected =
      selected?.planId === opt.planId && selected?.periodIndex === opt.periodIndex
    return {
      text: isSelected ? `${opt.label} ✓` : opt.label,
      handler: () => {
        void (async () => {
          if (isSelected) return
          try {
            await analytics.setBudgetRadarSelection(opt.planId, opt.periodIndex)
            if (analytics.error) showToast(analytics.error)
          } catch {
            if (analytics.error) showToast(analytics.error)
          }
        })()
      },
    }
  })
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Budget period',
    buttons,
  })
  await sheet.present()
}

async function showStackedPeriodSheet() {
  const selected = analytics.stackedPeriodMonths
  const buttons = STACKED_PERIOD_OPTIONS.map(({ months, label }) => ({
    text: months === selected ? `${label} ✓` : label,
    handler: () => {
      void (async () => {
        if (months === selected) return
        try {
          await analytics.setStackedPeriod(months)
          if (analytics.error) showToast(analytics.error)
        } catch {
          if (analytics.error) showToast(analytics.error)
        }
      })()
    },
  }))
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Time range',
    buttons,
  })
  await sheet.present()
}

async function showCategoryDonutPeriodSheet() {
  const selected = analytics.categoryDonutPeriodMonths
  const buttons = CATEGORY_DONUT_PERIOD_OPTIONS.map(({ months, label }) => ({
    text: months === selected ? `${label} ✓` : label,
    handler: () => {
      void (async () => {
        if (months === selected) return
        try {
          await analytics.setCategoryDonutPeriod(months)
          if (analytics.error) showToast(analytics.error)
        } catch {
          if (analytics.error) showToast(analytics.error)
        }
      })()
    },
  }))
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Time range',
    buttons,
  })
  await sheet.present()
}

async function showPatternPeriodSheet() {
  const selected = analytics.patternPeriodMonths
  const buttons = PATTERN_PERIOD_OPTIONS.map(({ months, label }) => ({
    text: months === selected ? `${label} ✓` : label,
    handler: () => {
      void (async () => {
        if (months === selected) return
        try {
          await analytics.setPatternPeriod(months)
          if (analytics.error) showToast(analytics.error)
        } catch {
          if (analytics.error) showToast(analytics.error)
        }
      })()
    },
  }))
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Time range',
    buttons,
  })
  await sheet.present()
}

async function showIeMonthlyPeriodSheet() {
  const selected = ieMonthlyAnalysisMonths.value
  const buttons = IE_MONTHLY_PERIOD_OPTIONS.map(({ months, label }) => ({
    text: months === selected ? `${label} ✓` : label,
    handler: () => {
      ieMonthlyAnalysisMonths.value = months
    },
  }))
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Time range',
    buttons,
  })
  await sheet.present()
}

async function showMonthlyAnalysisPeriodSheet() {
  const selected = monthlyAnalysisMonths.value
  const buttons = MONTHLY_ANALYSIS_PERIODS.map(({ months, label }) => ({
    text: months === selected ? `${label} ✓` : label,
    handler: () => {
      monthlyAnalysisMonths.value = months
    },
  }))
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Time range',
    buttons,
  })
  await sheet.present()
}

async function showSankeyMonthSheet() {
  const selected = analytics.selectedSankeyMonth
  const buttons = selectableSankeyMonths().map(({ year, month }) => {
    const label = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    const isSelected = year === selected.year && month === selected.month
    return {
      text: isSelected ? `${label} ✓` : label,
      handler: () => {
        void (async () => {
          if (isSelected) return
          try {
            await analytics.loadSankeyChart(year, month)
            if (analytics.error) showToast(analytics.error)
          } catch {
            if (analytics.error) showToast(analytics.error)
          }
        })()
      },
    }
  })
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Select month',
    buttons,
  })
  await sheet.present()
}

async function showIeProgressionMonthSheet() {
  const selected = analytics.selectedIeProgressionMonth
  const buttons = selectableIeProgressionMonths().map(({ year, month }) => {
    const label = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    const isSelected = year === selected.year && month === selected.month
    return {
      text: isSelected ? `${label} ✓` : label,
      handler: () => {
        void (async () => {
          if (isSelected) return
          try {
            await analytics.loadIeProgressionMonth(year, month)
            if (analytics.error) showToast(analytics.error)
          } catch {
            if (analytics.error) showToast(analytics.error)
          }
        })()
      },
    }
  })
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Select month',
    buttons,
  })
  await sheet.present()
}

async function showDailyMonthSheet() {
  const selected = analytics.selectedDailyMonth
  const buttons = selectableDailyMonths().map(({ year, month }) => {
    const label = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    const isSelected = year === selected.year && month === selected.month
    return {
      text: isSelected ? `${label} ✓` : label,
      handler: () => {
        void (async () => {
          if (isSelected) return
          try {
            await analytics.loadDailyMonth(year, month)
            if (analytics.error) showToast(analytics.error)
          } catch {
            if (analytics.error) showToast(analytics.error)
          }
        })()
      },
    }
  })
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Select month',
    buttons,
  })
  await sheet.present()
}

async function showIslandScopeSheet() {
  await analytics.loadIslandOptions()
  const buttons = analytics.islandOptions.map((o) => ({
    text: o.name,
    handler: () => {
      void (async () => {
        await analytics.setIslandScope(o.key)
        if (analytics.error) {
          showToast(analytics.error)
          return
        }
        if (viewMode.value === 'advanced') {
          await loadAdvancedCharts()
        }
      })()
    },
  }))
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Select island',
    buttons,
  })
  await sheet.present()
}

onIonViewDidEnter(async () => {
  await analytics.loadIslandOptions()
  await analytics.refresh()
  if (analytics.error) {
    showToast(analytics.error)
  }
  if (viewMode.value === 'advanced') {
    await loadAdvancedCharts()
  }
})

watch(viewMode, async (mode) => {
  if (mode !== 'advanced') return
  await loadAdvancedCharts()
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
  min-height: 176px;
}

.analytics-toolbar {
  --min-height: 48px;
  --border-width: 0;
  --background: white;
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
  --background: white;
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
  --section-title-accent: #ff8d28;
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
  color: #ff8d28;
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
  font-size: 10px;
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
  height: 300px;
  min-height: 300px;
}

.echart {
  width: 100%;
  min-height: 100%;
}

.echart--donut {
  min-height: 200px;
}

.echart--donut-tall {
  min-height: 300px;
}

.chart-card__body--pareto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 200px;
}

.echart--pareto {
  flex: 0 0 156px;
  height: 156px;
  min-height: 156px;
}

.tab-spacer {
  height: 68px;
}
</style>
