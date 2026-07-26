import { useRouter } from 'vue-router'
import {
  navigateToCategoryTransactions,
  navigateToPatternTransactions,
  navigateToDay,
  navigateToMonth,
  drillDownFromDonutSlice,
  sankeyDrillFromClick,
} from '@/utils/reportDrillDown'
import {
  sliceMonthlyByPeriod,
  chartPeriodDateRange,
  categoryDonutDateRange,
  patternDateRange,
  calendarMonthRange,
  WEEKDAY_LABELS,
} from '@/composables/useAnalyticsCharts'

const DRILL_FROM = '/analytics'

/** @param {import('vue-router').Router} router @param {'all'|'null'|number} islandScope */
function drillBase(router, islandScope) {
  return { router, islandScope, from: DRILL_FROM }
}

function barClickIndex(params) {
  if (params?.componentType !== 'series') return null
  if (params.seriesType !== 'bar' && params.seriesType !== 'line') return null
  const idx = params.dataIndex
  return Number.isFinite(idx) ? idx : null
}

/**
 * @param {ReturnType<typeof useAnalyticsCharts>} analytics
 * @param {object} ctx - period refs from index.vue
 */
export function useAnalyticsDrillDown(analytics, ctx) {
  const router = useRouter()
  const scope = () => analytics.selectedIslandScope

  function openCategory(opts) {
    navigateToCategoryTransactions(router, {
      ...opts,
      islandScope: scope(),
      from: DRILL_FROM,
    })
  }

  function onMonthlyBarDrill(periodMonthsRef) {
    return (params) => {
      const idx = barClickIndex(params)
      if (idx == null) return
      const rows = sliceMonthlyByPeriod(analytics.monthlyLast12, periodMonthsRef.value)
      const row = rows[idx]
      if (!row?.year || !row?.month) return
      const ym = `${row.year}-${String(row.month).padStart(2, '0')}`
      navigateToMonth(router, { ym, islandScope: scope(), from: DRILL_FROM })
    }
  }

  function onDailyMonthDrill(getMonth) {
    return (params) => {
      const idx = barClickIndex(params)
      if (idx == null) return
      const { year, month } = getMonth()
      const day = idx + 1
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      navigateToDay(router, { date, islandScope: scope(), from: DRILL_FROM })
    }
  }

  function onWeekdayDrill(params) {
    const idx = barClickIndex(params)
    if (idx == null) return
    const { start_date, end_date } = patternDateRange(analytics.patternPeriodMonths)
    navigateToPatternTransactions(router, {
      pattern: 'weekday',
      value: idx,
      label: `${WEEKDAY_LABELS[idx] || 'Weekday'} expenses`,
      startDate: start_date,
      endDate: end_date,
      islandScope: scope(),
      from: DRILL_FROM,
    })
  }

  function onDomDrill(params) {
    const idx = barClickIndex(params)
    if (idx == null) return
    const dom = idx + 1
    const { start_date, end_date } = patternDateRange(analytics.patternPeriodMonths)
    navigateToPatternTransactions(router, {
      pattern: 'dom',
      value: dom,
      label: `Day ${dom} expenses`,
      startDate: start_date,
      endDate: end_date,
      islandScope: scope(),
      from: DRILL_FROM,
    })
  }

  function onDonutDrill(rows, level, tall, { expanded } = {}) {
    const sliceExpanded = expanded ?? tall
    return (params) => {
      if (params?.seriesType !== 'pie') return
      const drill = drillDownFromDonutSlice(rows, params.dataIndex, {
        level,
        tall,
        expanded: sliceExpanded,
        sliceName: params.name,
      })
      if (!drill) return
      const { start_date, end_date } = categoryDonutDateRange(analytics.categoryDonutPeriodMonths)
      openCategory({
        ...drill,
        type: 'expense',
        startDate: start_date,
        endDate: end_date,
      })
    }
  }

  function onFocusDonutDrill(rows, level, tall) {
    return onDonutDrill(rows, level, tall, { expanded: true })
  }

function onTreemapDrill(rows) {
    return (params) => {
      if (params?.seriesType !== 'treemap') return
      const name = params?.data?.name ?? params?.name
      if (!name) return
      const row = (rows || []).find((r) => (r.category_name || 'Uncategorized') === name)
      const categoryId =
        params?.data?.category_id != null
          ? Number(params.data.category_id)
          : row?.category_id != null
            ? Number(row.category_id)
            : 0
      const { start_date, end_date } = chartPeriodDateRange(analytics.treemapPeriodMonths)
      openCategory({
        categoryId,
        name: String(name),
        level: 'parent',
        type: 'expense',
        startDate: start_date,
        endDate: end_date,
      })
    }
  }

  function onSankeyDrill(params) {
    const drill = sankeyDrillFromClick(params)
    if (!drill) return
    const { year, month } = analytics.selectedSankeyMonth
    const { start_date, end_date } = calendarMonthRange(year, month)
    openCategory({
      categoryId: drill.categoryId,
      name: drill.categoryName,
      level: 'parent',
      type: drill.txnType === 'income' ? 'income' : 'expense',
      startDate: start_date,
      endDate: end_date,
    })
  }

  function onParetoDrill(params) {
    const idx = barClickIndex(params)
    if (idx == null) return
    const rows = [...analytics.paretoParentRows].sort(
      (a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0)
    )
    const row = rows[idx]
    if (!row) return
    const { start_date, end_date } = chartPeriodDateRange(analytics.paretoPeriodMonths)
    openCategory({
      categoryId: row.category_id != null ? Number(row.category_id) : 0,
      name: row.category_name || 'Uncategorized',
      level: 'parent',
      type: 'expense',
      startDate: start_date,
      endDate: end_date,
    })
  }

  function onRadarDrill(params) {
    const name = params?.name
    if (!name) return
    const items = analytics.budgetRadar?.items || []
    const item = items.find((it) => it.category_name === name)
    if (!item) return
    const selection = analytics.budgetRadarSelection
    const periods = analytics.budgetRadarPeriods || []
    const period = selection != null ? periods[selection.periodIndex] : null
    const startDate =
      analytics.budgetRadar?.periodStart ||
      period?.periodStart ||
      period?.start_date ||
      ''
    const endDate =
      analytics.budgetRadar?.periodEnd ||
      period?.periodEnd ||
      period?.end_date ||
      ''
    openCategory({
      categoryId: item.category_id != null ? Number(item.category_id) : 0,
      name: item.category_name || 'Category',
      level: 'parent',
      type: 'expense',
      startDate,
      endDate,
    })
  }

  function onIeProgressionDrill(params) {
    const idx = barClickIndex(params)
    if (idx == null) return
    const { year, month } = analytics.selectedIeProgressionMonth
    const day = idx + 1
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    navigateToDay(router, { date, islandScope: scope(), from: DRILL_FROM })
  }

  function focusDrillHandler(chartKey, params) {
    const handlers = {
      monthlyAnalysis: onMonthlyBarDrill(ctx.monthlyAnalysisMonths),
      ieMonthlyBar: onMonthlyBarDrill(ctx.ieMonthlyAnalysisMonths),
      ieMonthly: onMonthlyBarDrill(ctx.ieMonthlyAnalysisMonths),
      ieGap: onMonthlyBarDrill(ctx.ieMonthlyAnalysisMonths),
      ieWaterfall: onMonthlyBarDrill(ctx.ieMonthlyAnalysisMonths),
      dailyAnalysis: onDailyMonthDrill(() => analytics.selectedDailyMonth),
      monthlyProgression: onDailyMonthDrill(() => analytics.selectedDailyMonth),
      ieProgression: onIeProgressionDrill,
      weekday: onWeekdayDrill,
      dom: onDomDrill,
      categoryWise: onFocusDonutDrill(analytics.categoryParentRowsForDonut, 'parent', false),
      subcategory: onFocusDonutDrill(analytics.categoryLeafRowsForDonut, 'leaf', true),
      treemap: onTreemapDrill(analytics.treemapParentRows),
      sankey: onSankeyDrill,
      pareto: onParetoDrill,
      radar: onRadarDrill,
    }
    handlers[chartKey]?.(params)
  }

  return {
    drillBase: () => drillBase(router, scope()),
    onMonthlyBarDrill,
    onDailyMonthDrill,
    onWeekdayDrill,
    onDomDrill,
    onDonutDrill,
    onTreemapDrill,
    onSankeyDrill,
    onParetoDrill,
    onRadarDrill,
    onIeProgressionDrill,
    focusDrillHandler,
    drillFromDonutSlice: (rows, sliceIndex, level, tall) => {
      const drill = drillDownFromDonutSlice(rows, sliceIndex, { level, tall, expanded: true })
      if (!drill) return
      const { start_date, end_date } = categoryDonutDateRange(analytics.categoryDonutPeriodMonths)
      openCategory({ ...drill, type: 'expense', startDate: start_date, endDate: end_date })
    },
  }
}
