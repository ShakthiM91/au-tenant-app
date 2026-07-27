import { sliceMonthlyByPeriod } from '@/composables/useAnalyticsCharts'
import { hasRadarChartData } from '@/utils/radarChart'

export const ANALYTICS_EMPTY_MESSAGES = {
  expensePeriod: 'No expense transactions for the selected time period.',
  categoryAnalysis: 'No expense transactions for the selected category in this period.',
  incomeExpensePeriod: 'No income or expense transactions for the selected time period.',
  radar:
    'No budget for the selected island and no expense transactions for the selected time period.',
}

const SKELETON_VARIANTS = {
  dailyAnalysis: 'bar',
  monthlyProgression: 'line',
  weekday: 'bar',
  dom: 'bar',
  monthlyAnalysis: 'bar',
  categoryWise: 'donut',
  subcategory: 'donut',
  stacked: 'stacked',
  categoryAnalysis: 'bar',
  treemap: 'treemap',
  sankey: 'sankey',
  pareto: 'pareto',
  radar: 'radar',
  ieProgression: 'line',
  ieMonthlyBar: 'bar',
  ieMonthly: 'bar',
  ieGap: 'bar',
  ieWaterfall: 'line',
}

const EXPENSE_PERIOD_KEYS = new Set([
  'dailyAnalysis',
  'monthlyProgression',
  'weekday',
  'dom',
  'monthlyAnalysis',
  'categoryWise',
  'subcategory',
  'stacked',
  'treemap',
  'sankey',
  'pareto',
])

const INCOME_EXPENSE_PERIOD_KEYS = new Set([
  'ieProgression',
  'ieMonthlyBar',
  'ieMonthly',
  'ieGap',
  'ieWaterfall',
])

/** @param {number[]} values */
export function hasPositiveTotal(values) {
  return (values || []).some((v) => Number(v) > 0)
}

/** @param {Array<Record<string, unknown>>} rows @param {string} field */
export function hasPositiveAmounts(rows, field) {
  return (rows || []).some((r) => Number(r[field]) > 0)
}

/** @param {Array<{ amount?: number }>} rows */
export function hasExpenseInCategoryRows(rows) {
  return (rows || []).some((r) => Number(r.amount) > 0)
}

/**
 * @param {Array<{ parents?: Array<{ amount?: number }> }>} slices
 */
export function hasStackedExpenseData(slices) {
  return (slices || []).some((s) =>
    (s.parents || []).some((p) => Number(p.amount) > 0)
  )
}

/** @param {Array<{ income?: number, expense?: number }>} rows @param {number} periodMonths */
export function hasMonthlyExpense(rows, periodMonths) {
  const sliced = sliceMonthlyByPeriod(rows, periodMonths)
  return sliced.some((r) => Number(r.expense) > 0)
}

/** @param {Array<{ income?: number, expense?: number }>} rows @param {number} periodMonths */
export function hasMonthlyIncomeOrExpense(rows, periodMonths) {
  const sliced = sliceMonthlyByPeriod(rows, periodMonths)
  return sliced.some((r) => Number(r.income) > 0 || Number(r.expense) > 0)
}

/** @param {{ totals?: { expense?: number } }} flow */
export function hasSankeyExpense(flow) {
  return Number(flow?.totals?.expense) > 0
}

/** @param {unknown[]} items */
export function isRadarEmpty(items) {
  return !hasRadarChartData(items)
}

/** @param {{ values?: number[] }} bars */
export function hasCategoryAnalysisExpense(bars) {
  return (bars?.values || []).some((v) => Number(v) > 0)
}

/**
 * @param {string} chartKey
 * @param {Record<string, unknown>} ctx
 * @returns {{ empty: boolean, message: string, skeletonVariant: string }}
 */
export function getAnalyticsChartEmptyState(chartKey, ctx) {
  const skeletonVariant = SKELETON_VARIANTS[chartKey] || 'bar'
  const empty = isChartEmpty(chartKey, ctx)
  return {
    empty,
    message: getAnalyticsEmptyMessage(chartKey),
    skeletonVariant,
  }
}

/** @param {string} chartKey */
export function getAnalyticsEmptyMessage(chartKey) {
  if (chartKey === 'categoryAnalysis') return ANALYTICS_EMPTY_MESSAGES.categoryAnalysis
  if (chartKey === 'radar') return ANALYTICS_EMPTY_MESSAGES.radar
  if (INCOME_EXPENSE_PERIOD_KEYS.has(chartKey)) return ANALYTICS_EMPTY_MESSAGES.incomeExpensePeriod
  if (EXPENSE_PERIOD_KEYS.has(chartKey)) return ANALYTICS_EMPTY_MESSAGES.expensePeriod
  return ANALYTICS_EMPTY_MESSAGES.expensePeriod
}

/** @param {string} chartKey @param {Record<string, unknown>} ctx */
function isChartEmpty(chartKey, ctx) {
  switch (chartKey) {
    case 'dailyAnalysis':
    case 'monthlyProgression':
      return !hasPositiveTotal(ctx.dailyExpenses)

    case 'weekday':
      return !hasPositiveTotal(ctx.weekdayExpenses)

    case 'dom':
      return !hasPositiveTotal(ctx.domExpenses)

    case 'monthlyAnalysis':
      return !hasPositiveTotal(ctx.monthlyAnalysisExpense)

    case 'categoryWise':
      return !hasExpenseInCategoryRows(ctx.categoryParentRows)

    case 'subcategory':
      return !hasExpenseInCategoryRows(ctx.categoryLeafRows)

    case 'stacked':
      return !hasStackedExpenseData(ctx.stackedMonthSlices)

    case 'categoryAnalysis':
      return !hasCategoryAnalysisExpense(ctx.categoryMonthlyBars)

    case 'treemap':
      return !hasExpenseInCategoryRows(ctx.treemapParentRows)

    case 'pareto':
      return !hasExpenseInCategoryRows(ctx.paretoParentRows)

    case 'sankey':
      return !hasSankeyExpense(ctx.sankeyFlow)

    case 'radar':
      return isRadarEmpty(ctx.budgetRadarItems)

    case 'ieProgression':
      return (
        !hasPositiveTotal(ctx.ieProgressionDailyIncome) &&
        !hasPositiveTotal(ctx.ieProgressionDailyExpenses)
      )

    case 'ieMonthlyBar':
    case 'ieMonthly':
    case 'ieGap':
    case 'ieWaterfall':
      return (
        !hasPositiveTotal(ctx.ieMonthlyIncome) && !hasPositiveTotal(ctx.ieMonthlyExpense)
      )

    default:
      return false
  }
}
