import { ref, reactive, computed } from 'vue'
import {
  getAccounts,
  getAnalyticsOverview,
  getAnalyticsDaily,
  getAnalyticsPatterns,
  getAnalyticsCategories,
  getAnalyticsStacked,
  getAnalyticsCategoryMonthly,
  getAnalyticsSankey,
  getBudgets,
  getBudgetPeriods,
  getBudgetPeriodReport,
} from '@/api/accounting'
import { getWorkspaces, getSharedWorkspaces } from '@/api/workspace'
import {
  mergeRadarItemsWithParentExpenses,
  resolveRadarReportItems,
} from '@/utils/radarChart'

const ALL_ISLANDS_KEY = 'all'
const DEFAULT_ISLAND_KEY = 'null'
const ISLAND_SCOPE_STORAGE_KEY = 'au_analytics_island_scope'

function islandScopeAllowsView(scope) {
  if (!scope) return true
  return !!scope.view
}

function isActiveWorkspace(ws) {
  return !!ws && (ws.deleted_at == null || ws.deleted_at === '')
}

/** @param {string} key */
function scopeKeyToValue(key) {
  if (key === ALL_ISLANDS_KEY) return 'all'
  if (key === DEFAULT_ISLAND_KEY) return 'null'
  const n = Number(key)
  return Number.isNaN(n) ? 'all' : n
}

/** @param {'all' | 'null' | number} scope */
function scopeValueToKey(scope) {
  if (scope === 'all') return ALL_ISLANDS_KEY
  if (scope === 'null') return DEFAULT_ISLAND_KEY
  return String(scope)
}

function loadPersistedScope() {
  try {
    const raw = localStorage.getItem(ISLAND_SCOPE_STORAGE_KEY)
    if (!raw) return 'all'
    return scopeKeyToValue(raw)
  } catch {
    return 'all'
  }
}

/** @param {'all' | 'null' | number} scope */
function persistScope(scope) {
  try {
    localStorage.setItem(ISLAND_SCOPE_STORAGE_KEY, scopeValueToKey(scope))
  } catch {
    /* ignore */
  }
}

/** @param {Date} d */
export function ymd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

/** Rolling last `n` calendar months through end of current month. */
export function lastNMonthsRange(n) {
  const end = endOfMonth(new Date())
  const start = startOfMonth(new Date(end.getFullYear(), end.getMonth() - (n - 1), 1))
  return { start_date: ymd(start), end_date: ymd(end) }
}

export function previousCalendarMonthRange() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const last = new Date(now.getFullYear(), now.getMonth(), 0)
  return { start_date: ymd(first), end_date: ymd(last) }
}

/** @param {number} year @param {number} month 1–12 */
export function calendarMonthRange(year, month) {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  return { start_date: ymd(first), end_date: ymd(last) }
}

/** Default month for Daily Analysis (current calendar month). */
export function defaultDailyAnalysisMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

/** Selectable months for Daily Analysis: current month back 5 months (6 total). */
export function selectableDailyMonths() {
  const now = new Date()
  const out = []
  for (let i = 0; i <= 5; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }
  return out
}

/** Selectable months for Sankey diagram: current month back 11 months (12 total). */
export function selectableSankeyMonths() {
  const now = new Date()
  const out = []
  for (let i = 0; i <= 11; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }
  return out
}

/** Selectable months for I/E Monthly Progression: current month back 11 months (12 total). */
export function selectableIeProgressionMonths() {
  return selectableSankeyMonths()
}

export function allTimeRangeStart() {
  return { start_date: '2000-01-01', end_date: ymd(new Date()) }
}

/** Shared period picker: 1=this month, 0=last calendar month, 3|6|12=rolling through current month. */
export const STANDARD_PERIOD_OPTIONS = [
  { months: 1, label: 'This Month' },
  { months: 0, label: 'Last Month' },
  { months: 3, label: 'Last 3 Months' },
  { months: 6, label: 'Last 6 Months' },
  { months: 12, label: 'Last 12 Months' },
]

export function chartPeriodLabel(months, fallback = 'Last 6 Months') {
  const opt = STANDARD_PERIOD_OPTIONS.find((p) => p.months === months)
  return opt?.label || fallback
}

/** Date range for chart period pickers (months: 0 = previous calendar month). */
export function chartPeriodDateRange(months) {
  if (months === 0) return previousCalendarMonthRange()
  return lastNMonthsRange(months)
}

/** Build ordered calendar months for a period picker value. */
export function calendarMonthsForPeriod(periodMonths, now = new Date()) {
  if (periodMonths === 0) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return [{ year: d.getFullYear(), month: d.getMonth() + 1 }]
  }
  const n = Math.max(1, Number(periodMonths) || 1)
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }
  return out
}

function findMonthlyRow(rows, year, month) {
  const y = Number(year)
  const m = Number(month)
  return (rows || []).find((r) => Number(r.year) === y && Number(r.month) === m)
}

function zeroMonthlyRow(year, month) {
  return { year, month, income: 0, expense: 0 }
}

/** Slice monthly rows for a period picker value, aligned to calendar months (zeros when no data). */
export function sliceMonthlyByPeriod(rows, periodMonths, now = new Date()) {
  return calendarMonthsForPeriod(periodMonths, now).map(({ year, month }) => {
    const row = findMonthlyRow(rows, year, month)
    if (!row) return zeroMonthlyRow(year, month)
    return {
      year,
      month,
      income: Number(row.income) || 0,
      expense: Number(row.expense) || 0,
    }
  })
}

/** Date range for pattern charts: null = all time, else chart period. */
export function patternDateRange(months) {
  if (months == null) return allTimeRangeStart()
  return chartPeriodDateRange(months)
}

export const PATTERN_PERIOD_OPTIONS = [
  { months: null, label: 'All Time' },
  ...STANDARD_PERIOD_OPTIONS,
]

export const CATEGORY_DONUT_PERIOD_OPTIONS = STANDARD_PERIOD_OPTIONS

export function categoryDonutDateRange(months) {
  return chartPeriodDateRange(months)
}

export const STACKED_PERIOD_OPTIONS = STANDARD_PERIOD_OPTIONS

export function stackedDateRange(months) {
  return chartPeriodDateRange(months)
}

export const TREEMAP_PERIOD_OPTIONS = STANDARD_PERIOD_OPTIONS

export const PARETO_PERIOD_OPTIONS = STANDARD_PERIOD_OPTIONS

/** @param {Array<{weekday:number,expense:number}>} rows */
export function expensesByWeekday(rows) {
  const arr = Array(7).fill(0)
  for (const r of rows || []) {
    const idx = Number(r.weekday)
    if (idx >= 0 && idx < 7) arr[idx] = Number(r.expense) || 0
  }
  return arr
}

/** @param {Array<{day:number,expense:number}>} rows */
export function expensesByDayOfMonthPattern(rows) {
  const arr = Array(31).fill(0)
  for (const r of rows || []) {
    const day = Number(r.day)
    if (day >= 1 && day <= 31) arr[day - 1] = Number(r.expense) || 0
  }
  return arr
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** @param {string} startYmd @param {string} endYmd */
export function enumerateMonthsInclusive(startYmd, endYmd) {
  const [sy, sm] = startYmd.split('-').map(Number)
  const [ey, em] = endYmd.split('-').map(Number)
  const out = []
  let y = sy
  let m = sm
  while (y < ey || (y === ey && m <= em)) {
    out.push({ year: y, month: m })
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return out
}

/** @param {Array<{year:number,month:number,amount:number}>} rows */
function rowsToMonthlyAmountSeries(rows, startYmd, endYmd) {
  const byKey = new Map()
  for (const r of rows || []) {
    byKey.set(`${r.year}-${r.month}`, Number(r.amount) || 0)
  }
  return enumerateMonthsInclusive(startYmd, endYmd).map(({ year, month }) => {
    const label = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
    const amount = byKey.get(`${year}-${month}`) || 0
    return { label, amount }
  })
}

/** @param {Array<{year:number,month:number,category_name?:string,amount:number}>} rows */
function rowsToStackedMonthSlices(rows, startYmd, endYmd) {
  const byMonth = new Map()
  for (const r of rows || []) {
    const key = `${r.year}-${r.month}`
    if (!byMonth.has(key)) byMonth.set(key, [])
    byMonth.get(key).push({
      name: r.category_name || 'Uncategorized',
      amount: Number(r.amount || 0),
    })
  }
  return enumerateMonthsInclusive(startYmd, endYmd).map(({ year, month }) => {
    const s = new Date(year, month - 1, 1)
    const label = s.toLocaleDateString('en-US', { month: 'short' })
    const parents = byMonth.get(`${year}-${month}`) || []
    return { label, parents }
  })
}

export { resolveAccessibleAccounts } from '@/composables/useAnalyticsChartsCore'

export function formatBudgetPeriodLabel(periodType, period) {
  if (!period?.periodStart) return 'Budget period'
  const start = new Date(`${period.periodStart}T12:00:00`)
  if (periodType === 'month') {
    return start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }
  if (periodType === 'year') {
    return String(start.getFullYear())
  }
  return `${period.periodStart} – ${period.periodEnd}`
}

export function useAnalyticsCharts() {
  const loading = ref(false)
  const error = ref(null)

  const totalBalance = ref(0)
  const headerLabel = ref('All islands')
  /** @type {import('vue').Ref<'all' | 'null' | number>} */
  const selectedIslandScope = ref(loadPersistedScope())
  /** @type {import('vue').Ref<{ key: string, idNum: number | null, name: string }[]>} */
  const islandOptions = ref([{ key: ALL_ISLANDS_KEY, idNum: null, name: 'All islands' }])

  /** @type {import('vue').Ref<Array<{year:number,month:number,income:number,expense:number}>>} */
  const monthlyLast12 = ref([])
  const categoryLeafAllTime = ref([])
  const categoryParentAllTime = ref([])
  const categoryDonutPeriodMonths = ref(1)
  const categoryDonutParentRows = ref([])
  const categoryDonutLeafRows = ref([])
  const categoryDonutLoading = ref(false)
  /** @type {Map<string, { parent: unknown[], leaf: unknown[] }>} */
  const categoryDonutCache = new Map()
  const dailyLastMonth = ref([])
  /** @type {import('vue').Ref<{year:number,month:number}>} */
  const selectedDailyMonth = ref(defaultDailyAnalysisMonth())
  const dailyMonthRows = ref([])
  const dailyMonthLoading = ref(false)
  /** @type {import('vue').Ref<{year:number,month:number}>} */
  const selectedIeProgressionMonth = ref(defaultDailyAnalysisMonth())
  const ieProgressionMonthRows = ref([])
  const ieProgressionMonthLoading = ref(false)
  /** @type {Map<string, Array<{date:string,income:number,expense:number}>>} */
  const dailyMonthCache = new Map()
  const stackedMonthSlices = ref([])
  const stackedPeriodMonths = ref(6)
  const stackedLoading = ref(false)
  /** @type {Map<string, Array<{label:string,parents:Array<{name:string,amount:number}>}>>} */
  const stackedCache = new Map()
  const categoryMonthlyBars = ref({ labels: [], values: [], categoryName: '' })
  const categoryAnalysisId = ref(null)
  const categoryAnalysisExpandedIds = ref([])
  const categoryAnalysisLoading = ref(false)
  /** @type {Map<string, { labels: string[], values: number[], categoryName: string }>} */
  const categoryAnalysisCache = new Map()
  const treemapParentRows = ref([])
  const treemapPeriodMonths = ref(12)
  const treemapLoading = ref(false)
  /** @type {Map<string, unknown[]>} */
  const treemapCache = new Map()
  const paretoParentRows = ref([])
  const paretoPeriodMonths = ref(12)
  const paretoLoading = ref(false)
  /** @type {Map<string, unknown[]>} */
  const paretoCache = new Map()
  const sankeyFlow = ref({ income: [], expense: [], totals: { income: 0, expense: 0 } })
  /** @type {import('vue').Ref<{year:number,month:number}>} */
  const selectedSankeyMonth = ref(defaultDailyAnalysisMonth())
  const sankeyLoading = ref(false)
  /** @type {Map<string, { income: unknown[], expense: unknown[], totals: { income: number, expense: number } }>} */
  const sankeyCache = new Map()

  const patternPeriodMonths = ref(null)
  const weekdayRows = ref([])
  const dayOfMonthRows = ref([])
  const patternLoading = ref(false)
  const patternChartsLoaded = ref(false)
  /** @type {Map<string, { weekday: unknown[], dayOfMonth: unknown[] }>} */
  const patternCache = new Map()
  const budgetRadar = ref(null)
  const budgetPlanMeta = ref(null)
  const budgetRadarPlans = ref([])
  /** @type {import('vue').Ref<{ planId: number, periodIndex: number } | null>} */
  const budgetRadarSelection = ref(null)
  const budgetRadarPeriods = ref([])
  const budgetRadarPickerOptions = ref([])
  const budgetRadarLoading = ref(false)
  /** @type {Map<number, unknown[]>} */
  const budgetRadarPeriodsCache = new Map()
  /** @type {Map<string, { items: unknown[], periodLabel: string, periodIndex: number }>} */
  const budgetRadarCache = new Map()

  function updateHeaderLabel() {
    const key = scopeValueToKey(selectedIslandScope.value)
    const opt = islandOptions.value.find((o) => o.key === key)
    headerLabel.value = opt?.name || 'All islands'
  }

  function validatePersistedScope() {
    const keys = new Set(islandOptions.value.map((o) => o.key))
    const currentKey = scopeValueToKey(selectedIslandScope.value)
    if (!keys.has(currentKey)) {
      selectedIslandScope.value = 'all'
      persistScope('all')
    }
    updateHeaderLabel()
  }

  async function loadIslandOptions() {
    const opts = [{ key: ALL_ISLANDS_KEY, idNum: null, name: 'All islands' }]

    const [ownRes, sharedRes] = await Promise.all([
      getWorkspaces().catch(() => null),
      getSharedWorkspaces().catch(() => null),
    ])
    const own = (Array.isArray(ownRes?.data) ? ownRes.data : []).filter(isActiveWorkspace)
    const shared = (Array.isArray(sharedRes?.data?.active) ? sharedRes.data.active : []).filter(
      isActiveWorkspace
    )

    for (const ws of own) {
      const s = ws.permission_scope
      if (s && !islandScopeAllowsView(s)) continue
      opts.push({
        key: String(ws.id),
        idNum: Number(ws.id),
        name: ws.name || 'My island',
      })
    }
    for (const ws of shared) {
      const s = ws.permission_scope
      if (s && !islandScopeAllowsView(s)) continue
      opts.push({
        key: String(ws.id),
        idNum: Number(ws.id),
        name: ws.tenant_name
          ? `${ws.name || 'Shared'} (${ws.tenant_name})`
          : ws.name || 'Shared island',
      })
    }

    const mainRes = await getAccounts({ is_active: true }).catch(() => null)
    const mainAccounts = Array.isArray(mainRes?.data) ? mainRes.data : []
    const hasDefault = mainAccounts.some(
      (a) => a?.is_active !== false && (a.workspace_id == null || a.workspace_id === '')
    )
    if (hasDefault) {
      opts.push({ key: DEFAULT_ISLAND_KEY, idNum: null, name: 'Default Island' })
    }

    islandOptions.value = opts
    validatePersistedScope()
  }

  async function setIslandScope(key) {
    selectedIslandScope.value = scopeKeyToValue(key)
    persistScope(selectedIslandScope.value)
    updateHeaderLabel()
    patternChartsLoaded.value = false
    patternCache.clear()
    categoryDonutCache.clear()
    stackedCache.clear()
    categoryAnalysisCache.clear()
    treemapCache.clear()
    paretoCache.clear()
    budgetRadarCache.clear()
    budgetRadarPeriodsCache.clear()
    sankeyCache.clear()
    dailyMonthCache.clear()
    await refresh()
  }

  function clearChartState() {
    monthlyLast12.value = []
    categoryLeafAllTime.value = []
    categoryParentAllTime.value = []
    categoryDonutParentRows.value = []
    categoryDonutLeafRows.value = []
    dailyLastMonth.value = []
    dailyMonthRows.value = []
    ieProgressionMonthRows.value = []
    stackedMonthSlices.value = []
    categoryMonthlyBars.value = { labels: [], values: [], categoryName: '' }
    categoryAnalysisId.value = null
    categoryAnalysisExpandedIds.value = []
    treemapParentRows.value = []
    paretoParentRows.value = []
    sankeyFlow.value = { income: [], expense: [], totals: { income: 0, expense: 0 } }
    budgetRadar.value = null
    budgetPlanMeta.value = null
    budgetRadarPlans.value = []
    budgetRadarSelection.value = null
    budgetRadarPeriods.value = []
    budgetRadarPickerOptions.value = []
    budgetRadarPeriodsCache.clear()
    weekdayRows.value = []
    dayOfMonthRows.value = []
    patternChartsLoaded.value = false
  }

  function defaultCategoryAnalysisId() {
    const top = categoryLeafAllTime.value?.[0]
    const id = Number(top?.category_id)
    return Number.isFinite(id) && id > 0 ? id : null
  }

  function categoryAnalysisCacheKey(expandedIds, labels) {
    const labelKey = (labels || []).join('|')
    return `${scopeValueToKey(selectedIslandScope.value)}:${expandedIds.join(',')}:${labelKey}`
  }

  async function loadCategoryAnalysisChart(
    categoryId,
    expandedIds,
    categoryName,
    categoryLabels = [],
    force = false
  ) {
    const ids = (expandedIds || []).map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
    const labels = (categoryLabels || []).map((s) => String(s)).filter((s) => s.length > 0)
    if (!ids.length && !labels.length) {
      categoryMonthlyBars.value = { labels: [], values: [], categoryName: categoryName || '' }
      return
    }

    const cacheKey = categoryAnalysisCacheKey(ids, labels)
    const cached = categoryAnalysisCache.get(cacheKey)
    if (!force && cached) {
      categoryAnalysisId.value = categoryId
      categoryMonthlyBars.value = cached
      return
    }

    categoryAnalysisLoading.value = true
    error.value = null
    try {
      const { start_date, end_date } = lastNMonthsRange(12)
      const res = await getAnalyticsCategoryMonthly(
        selectedIslandScope.value,
        start_date,
        end_date,
        ids,
        labels
      )
      const rows = Array.isArray(res?.data) ? res.data : []
      const series = rowsToMonthlyAmountSeries(rows, start_date, end_date)
      const payload = {
        labels: series.map((s) => s.label),
        values: series.map((s) => s.amount),
        categoryName: categoryName || 'Category',
      }
      categoryAnalysisCache.set(cacheKey, payload)
      categoryAnalysisId.value = categoryId
      categoryAnalysisExpandedIds.value = ids
      categoryMonthlyBars.value = payload
    } catch (e) {
      error.value = e?.message || String(e)
      categoryMonthlyBars.value = { labels: [], values: [], categoryName: categoryName || '' }
      throw e
    } finally {
      categoryAnalysisLoading.value = false
    }
  }

  async function setCategoryAnalysisCategory(
    categoryId,
    expandedIds,
    categoryName,
    categoryLabels = []
  ) {
    const id = Number(categoryId)
    if (!Number.isFinite(id) || id <= 0) return
    await loadCategoryAnalysisChart(id, expandedIds, categoryName, categoryLabels)
  }

  async function ensureCategoryAnalysisChart(resolveCategoryQuery) {
    const id = categoryAnalysisId.value ?? defaultCategoryAnalysisId()
    if (!id) {
      categoryMonthlyBars.value = { labels: [], values: [], categoryName: '' }
      return
    }
    let expanded = [id]
    let labels = []
    if (typeof resolveCategoryQuery === 'function') {
      const resolved = resolveCategoryQuery(id)
      expanded = resolved?.ids?.length ? resolved.ids : [id]
      labels = resolved?.labels || []
    } else if (categoryAnalysisExpandedIds.value.length) {
      expanded = categoryAnalysisExpandedIds.value
    }
    const name =
      categoryLeafAllTime.value.find((r) => Number(r.category_id) === id)?.category_name ||
      categoryParentAllTime.value.find((r) => Number(r.category_id) === id)?.category_name ||
      'Category'
    if (!labels.length && name) labels = [name]
    await loadCategoryAnalysisChart(id, expanded, name, labels)
  }

  function dailyCacheKey(year, month) {
    return `${scopeValueToKey(selectedIslandScope.value)}:${year}-${String(month).padStart(2, '0')}`
  }

  async function loadDailyMonth(year, month) {
    const cacheKey = dailyCacheKey(year, month)
    const cached = dailyMonthCache.get(cacheKey)
    if (cached) {
      selectedDailyMonth.value = { year, month }
      dailyMonthRows.value = cached
      return
    }

    const prev = { ...selectedDailyMonth.value }
    selectedDailyMonth.value = { year, month }
    dailyMonthLoading.value = true
    error.value = null
    try {
      const { start_date, end_date } = calendarMonthRange(year, month)
      const res = await getAnalyticsDaily(selectedIslandScope.value, start_date, end_date)
      const rows = Array.isArray(res?.data) ? res.data : []
      dailyMonthCache.set(cacheKey, rows)
      dailyMonthRows.value = rows
    } catch (e) {
      error.value = e?.message || String(e)
      selectedDailyMonth.value = prev
      throw e
    } finally {
      dailyMonthLoading.value = false
    }
  }

  async function loadIeProgressionMonth(year, month) {
    const cacheKey = dailyCacheKey(year, month)
    const cached = dailyMonthCache.get(cacheKey)
    if (cached) {
      selectedIeProgressionMonth.value = { year, month }
      ieProgressionMonthRows.value = cached
      return
    }

    const prev = { ...selectedIeProgressionMonth.value }
    selectedIeProgressionMonth.value = { year, month }
    ieProgressionMonthLoading.value = true
    error.value = null
    try {
      const { start_date, end_date } = calendarMonthRange(year, month)
      const res = await getAnalyticsDaily(selectedIslandScope.value, start_date, end_date)
      const rows = Array.isArray(res?.data) ? res.data : []
      dailyMonthCache.set(cacheKey, rows)
      ieProgressionMonthRows.value = rows
    } catch (e) {
      error.value = e?.message || String(e)
      selectedIeProgressionMonth.value = prev
      throw e
    } finally {
      ieProgressionMonthLoading.value = false
    }
  }

  async function ensureIeProgressionMonth() {
    const { year, month } = selectedIeProgressionMonth.value
    await loadIeProgressionMonth(year, month)
  }

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      updateHeaderLabel()
      patternChartsLoaded.value = false
      patternCache.clear()
      categoryDonutCache.clear()
      stackedCache.clear()
      categoryAnalysisCache.clear()
      treemapCache.clear()
      paretoCache.clear()
      budgetRadarCache.clear()
      sankeyCache.clear()
      stackedMonthSlices.value = []
      categoryAnalysisId.value = null
      categoryAnalysisExpandedIds.value = []
      dailyMonthCache.clear()

      const res = await getAnalyticsOverview(selectedIslandScope.value)
      const data = res?.data

      totalBalance.value = Number(data?.total_balance) || 0
      monthlyLast12.value = Array.isArray(data?.monthly_last_12) ? data.monthly_last_12 : []
      categoryLeafAllTime.value = Array.isArray(data?.category_leaf_12) ? data.category_leaf_12 : []
      categoryParentAllTime.value = Array.isArray(data?.category_parent_12) ? data.category_parent_12 : []
      if (treemapPeriodMonths.value === 12 && categoryParentAllTime.value.length) {
        treemapParentRows.value = categoryParentAllTime.value
        treemapCache.set(treemapCacheKey(12), categoryParentAllTime.value)
      } else {
        treemapParentRows.value = []
      }
      if (paretoPeriodMonths.value === 12 && categoryParentAllTime.value.length) {
        paretoParentRows.value = categoryParentAllTime.value
        paretoCache.set(paretoCacheKey(12), categoryParentAllTime.value)
      } else {
        paretoParentRows.value = []
      }
      dailyLastMonth.value = Array.isArray(data?.daily_last_month) ? data.daily_last_month : []
      budgetRadar.value = null
      budgetPlanMeta.value = null
      budgetRadarPlans.value = []
      budgetRadarSelection.value = null
      budgetRadarPeriods.value = []
      budgetRadarPickerOptions.value = []
      budgetRadarPeriodsCache.clear()
      budgetRadarCache.clear()

      const { year, month } = selectedDailyMonth.value
      try {
        await loadDailyMonth(year, month)
      } catch {
        /* daily month optional on refresh */
      }
      const ieProg = selectedIeProgressionMonth.value
      try {
        await loadIeProgressionMonth(ieProg.year, ieProg.month)
      } catch {
        /* error surfaced via analytics.error */
      }

      try {
        await loadCategoryDonutCharts(true)
      } catch {
        /* error surfaced via analytics.error */
      }
    } catch (e) {
      error.value = e?.message || String(e)
      clearChartState()
      totalBalance.value = 0
    } finally {
      loading.value = false
    }
  }

  function patternCacheKey(months) {
    const period = months == null ? 'all' : String(months)
    return `${scopeValueToKey(selectedIslandScope.value)}:${period}`
  }

  async function loadPatternCharts(force = false) {
    const months = patternPeriodMonths.value
    const cacheKey = patternCacheKey(months)
    const cached = patternCache.get(cacheKey)
    if (!force && cached) {
      weekdayRows.value = cached.weekday
      dayOfMonthRows.value = cached.dayOfMonth
      patternChartsLoaded.value = true
      return
    }

    patternLoading.value = true
    error.value = null
    try {
      const { start_date, end_date } = patternDateRange(months)
      const scope = selectedIslandScope.value
      const [weekdayRes, dayOfMonthRes] = await Promise.all([
        getAnalyticsPatterns(scope, 'weekday', start_date, end_date),
        getAnalyticsPatterns(scope, 'day_of_month', start_date, end_date),
      ])
      const weekday = Array.isArray(weekdayRes?.data) ? weekdayRes.data : []
      const dayOfMonth = Array.isArray(dayOfMonthRes?.data) ? dayOfMonthRes.data : []
      patternCache.set(cacheKey, { weekday, dayOfMonth })
      weekdayRows.value = weekday
      dayOfMonthRows.value = dayOfMonth
      patternChartsLoaded.value = true
    } catch (e) {
      error.value = e?.message || String(e)
      weekdayRows.value = []
      dayOfMonthRows.value = []
      throw e
    } finally {
      patternLoading.value = false
    }
  }

  async function setPatternPeriod(months) {
    if (patternPeriodMonths.value === months) return
    patternPeriodMonths.value = months
    await loadPatternCharts()
  }

  function stackedCacheKey(months) {
    return `${scopeValueToKey(selectedIslandScope.value)}:${months}`
  }

  async function loadStackedChart(force = false) {
    const months = stackedPeriodMonths.value
    const cacheKey = stackedCacheKey(months)
    const cached = stackedCache.get(cacheKey)
    if (!force && cached) {
      stackedMonthSlices.value = cached
      return
    }

    stackedLoading.value = true
    error.value = null
    try {
      const { start_date, end_date } = stackedDateRange(months)
      const res = await getAnalyticsStacked(selectedIslandScope.value, start_date, end_date)
      const rows = Array.isArray(res?.data?.category_parent_monthly)
        ? res.data.category_parent_monthly
        : []
      const slices = rowsToStackedMonthSlices(rows, start_date, end_date)
      stackedCache.set(cacheKey, slices)
      stackedMonthSlices.value = slices
    } catch (e) {
      error.value = e?.message || String(e)
      stackedMonthSlices.value = []
      throw e
    } finally {
      stackedLoading.value = false
    }
  }

  async function setStackedPeriod(months) {
    if (stackedPeriodMonths.value === months) return
    stackedPeriodMonths.value = months
    await loadStackedChart()
  }

  function categoryDonutCacheKey(months) {
    return `${scopeValueToKey(selectedIslandScope.value)}:${months}`
  }

  async function loadCategoryDonutCharts(force = false) {
    const months = categoryDonutPeriodMonths.value
    const cacheKey = categoryDonutCacheKey(months)
    const cached = categoryDonutCache.get(cacheKey)
    if (!force && cached) {
      categoryDonutParentRows.value = cached.parent
      categoryDonutLeafRows.value = cached.leaf
      return
    }

    categoryDonutLoading.value = true
    error.value = null
    try {
      const { start_date, end_date } = categoryDonutDateRange(months)
      const res = await getAnalyticsCategories(selectedIslandScope.value, start_date, end_date)
      const data = res?.data
      const parent = Array.isArray(data?.category_parent) ? data.category_parent : []
      const leaf = Array.isArray(data?.category_leaf) ? data.category_leaf : []
      categoryDonutCache.set(cacheKey, { parent, leaf })
      categoryDonutParentRows.value = parent
      categoryDonutLeafRows.value = leaf
    } catch (e) {
      error.value = e?.message || String(e)
      categoryDonutParentRows.value = []
      categoryDonutLeafRows.value = []
      throw e
    } finally {
      categoryDonutLoading.value = false
    }
  }

  async function setCategoryDonutPeriod(months) {
    if (categoryDonutPeriodMonths.value === months) return
    categoryDonutPeriodMonths.value = months
    await loadCategoryDonutCharts()
  }

  function treemapCacheKey(months) {
    return `${scopeValueToKey(selectedIslandScope.value)}:${months}`
  }

  async function loadTreemapChart(force = false) {
    const months = treemapPeriodMonths.value
    const cacheKey = treemapCacheKey(months)
    const cached = treemapCache.get(cacheKey)
    if (!force && cached) {
      treemapParentRows.value = cached
      return
    }

    treemapLoading.value = true
    error.value = null
    try {
      const { start_date, end_date } = chartPeriodDateRange(months)
      const res = await getAnalyticsCategories(selectedIslandScope.value, start_date, end_date)
      const parent = Array.isArray(res?.data?.category_parent) ? res.data.category_parent : []
      treemapCache.set(cacheKey, parent)
      treemapParentRows.value = parent
    } catch (e) {
      error.value = e?.message || String(e)
      treemapParentRows.value = []
      throw e
    } finally {
      treemapLoading.value = false
    }
  }

  async function setTreemapPeriod(months) {
    if (treemapPeriodMonths.value === months) return
    treemapPeriodMonths.value = months
    await loadTreemapChart()
  }

  function paretoCacheKey(months) {
    return `${scopeValueToKey(selectedIslandScope.value)}:${months}`
  }

  async function loadParetoChart(force = false) {
    const months = paretoPeriodMonths.value
    const cacheKey = paretoCacheKey(months)
    const cached = paretoCache.get(cacheKey)
    if (!force && cached) {
      paretoParentRows.value = cached
      return
    }

    paretoLoading.value = true
    error.value = null
    try {
      const { start_date, end_date } = chartPeriodDateRange(months)
      const res = await getAnalyticsCategories(selectedIslandScope.value, start_date, end_date)
      const parent = Array.isArray(res?.data?.category_parent) ? res.data.category_parent : []
      paretoCache.set(cacheKey, parent)
      paretoParentRows.value = parent
    } catch (e) {
      error.value = e?.message || String(e)
      paretoParentRows.value = []
      throw e
    } finally {
      paretoLoading.value = false
    }
  }

  async function setParetoPeriod(months) {
    if (paretoPeriodMonths.value === months) return
    paretoPeriodMonths.value = months
    await loadParetoChart()
  }

  function workspaceParamsForOngoingBudget(scope) {
    if (typeof scope === 'number') return { workspace_id: scope }
    if (scope === 'null') return { workspace_id: 'null' }
    return null
  }

  function pickDefaultBudgetPeriodIndex(periods) {
    if (!periods?.length) return 0
    const today = new Date().toISOString().slice(0, 10)
    const idx = periods.findIndex((p) => today >= p.periodStart && today <= p.periodEnd)
    return idx >= 0 ? idx : periods.length - 1
  }

  async function loadBudgetPlansForRadar(wsParams) {
    const params = {}
    if (wsParams.workspace_id !== 'null' && wsParams.workspace_id != null) {
      params.workspace_id = wsParams.workspace_id
    }
    const res = await getBudgets(params)
    let plans = Array.isArray(res?.data) ? res.data : []
    plans = plans.filter((p) => p.status === 'active' || p.status === 'completed')
    if (wsParams.workspace_id === 'null') {
      plans = plans.filter((p) => p.workspace_id == null)
    }
    plans.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1
      if (b.status === 'active' && a.status !== 'active') return 1
      return String(b.start_date || '').localeCompare(String(a.start_date || ''))
    })
    return plans
  }

  async function loadPeriodsForPlan(planId) {
    const cached = budgetRadarPeriodsCache.get(planId)
    if (cached) return cached
    const perRes = await getBudgetPeriods(planId)
    const periods = Array.isArray(perRes?.data) ? perRes.data : []
    budgetRadarPeriodsCache.set(planId, periods)
    return periods
  }

  function pickDefaultBudgetRadarSelection(plans, periodsByPlan) {
    const activePlan = plans.find((p) => p.status === 'active')
    if (activePlan) {
      const periods = periodsByPlan.get(activePlan.id) || []
      if (!periods.length) return null
      return {
        planId: activePlan.id,
        periodIndex: pickDefaultBudgetPeriodIndex(periods),
      }
    }
    const completed = plans.find((p) => p.status === 'completed')
    if (completed) {
      const periods = periodsByPlan.get(completed.id) || []
      if (!periods.length) return null
      return { planId: completed.id, periodIndex: periods.length - 1 }
    }
    return null
  }

  function budgetRadarOptionLabel(plan, periodType, period) {
    const periodLabel = formatBudgetPeriodLabel(periodType, period)
    const name = plan?.name || 'Budget'
    return `${name} · ${periodLabel}`
  }

  async function ensureBudgetRadarPickerOptions() {
    const plans = budgetRadarPlans.value
    if (!plans.length) {
      budgetRadarPickerOptions.value = []
      return
    }
    const options = []
    await Promise.all(
      plans.map(async (plan) => {
        const periods = await loadPeriodsForPlan(plan.id)
        periods.forEach((period, periodIndex) => {
          options.push({
            planId: plan.id,
            periodIndex,
            planName: plan.name,
            periodType: plan.period_type,
            period,
            status: plan.status,
            label: budgetRadarOptionLabel(plan, plan.period_type, period),
          })
        })
      })
    )
    options.sort((a, b) => {
      const endCmp = String(b.period?.periodEnd || '').localeCompare(String(a.period?.periodEnd || ''))
      if (endCmp !== 0) return endCmp
      return a.periodIndex - b.periodIndex
    })
    budgetRadarPickerOptions.value = options
  }

  function budgetRadarCacheKey(planId, periodIndex) {
    return `${scopeValueToKey(selectedIslandScope.value)}:${planId}:${periodIndex}`
  }

  async function loadBudgetRadarChart(force = false) {
    const scope = selectedIslandScope.value
    const wsParams = workspaceParamsForOngoingBudget(scope)
    if (!wsParams) {
      budgetRadar.value = null
      budgetPlanMeta.value = null
      budgetRadarPlans.value = []
      budgetRadarSelection.value = null
      budgetRadarPeriods.value = []
      budgetRadarPickerOptions.value = []
      return
    }

    budgetRadarLoading.value = true
    error.value = null
    try {
      if (!budgetRadarPlans.value.length || force) {
        budgetRadarPlans.value = await loadBudgetPlansForRadar(wsParams)
        budgetRadarPeriodsCache.clear()
        budgetRadarPickerOptions.value = []
        budgetRadarSelection.value = null
      }

      if (!budgetRadarPlans.value.length) {
        budgetRadar.value = null
        budgetPlanMeta.value = null
        budgetRadarPeriods.value = []
        return
      }

      if (!budgetRadarSelection.value || force) {
        const periodsByPlan = new Map()
        await Promise.all(
          budgetRadarPlans.value.map(async (plan) => {
            const periods = await loadPeriodsForPlan(plan.id)
            periodsByPlan.set(plan.id, periods)
          })
        )
        budgetRadarSelection.value = pickDefaultBudgetRadarSelection(
          budgetRadarPlans.value,
          periodsByPlan
        )
      }

      const selection = budgetRadarSelection.value
      if (!selection) {
        budgetRadar.value = null
        return
      }

      const plan = budgetRadarPlans.value.find((p) => p.id === selection.planId)
      if (!plan) {
        budgetRadar.value = null
        return
      }

      const periods = await loadPeriodsForPlan(plan.id)
      budgetRadarPeriods.value = periods
      budgetPlanMeta.value = {
        id: plan.id,
        name: plan.name,
        period_type: plan.period_type,
        status: plan.status,
      }

      if (!periods.length || selection.periodIndex < 0 || selection.periodIndex >= periods.length) {
        budgetRadar.value = null
        return
      }

      const { planId, periodIndex } = selection
      const cacheKey = budgetRadarCacheKey(planId, periodIndex)
      const cached = budgetRadarCache.get(cacheKey)
      if (!force && cached) {
        budgetRadar.value = cached
        return
      }

      const repRes = await getBudgetPeriodReport(planId, periodIndex)
      const report = repRes?.data
      const period = periods[periodIndex]
      let items = resolveRadarReportItems(report)
      const periodStart = String(report?.period_start || period?.periodStart || '').slice(0, 10)
      const periodEnd = String(report?.period_end || period?.periodEnd || '').slice(0, 10)
      if (periodStart && periodEnd) {
        try {
          const expRes = await getAnalyticsCategories(
            selectedIslandScope.value,
            periodStart,
            periodEnd
          )
          const parents = Array.isArray(expRes?.data?.category_parent)
            ? expRes.data.category_parent
            : []
          items = mergeRadarItemsWithParentExpenses(items, parents)
        } catch {
          /* keep budget report rows when category analytics is unavailable */
        }
      }
      const payload = {
        items,
        periodLabel: formatBudgetPeriodLabel(plan.period_type, period),
        periodIndex,
        periodStart,
        periodEnd,
      }
      budgetRadarCache.set(cacheKey, payload)
      budgetRadar.value = payload
    } catch (e) {
      error.value = e?.message || String(e)
      budgetRadar.value = null
      throw e
    } finally {
      budgetRadarLoading.value = false
    }
  }

  async function setBudgetRadarSelection(planId, periodIndex) {
    const pid = Number(planId)
    const idx = Number(periodIndex)
    if (!Number.isFinite(pid) || pid <= 0 || !Number.isFinite(idx) || idx < 0) return
    const current = budgetRadarSelection.value
    if (current?.planId === pid && current?.periodIndex === idx) return
    budgetRadarSelection.value = { planId: pid, periodIndex: idx }
    await loadBudgetRadarChart()
  }

  const budgetRadarPeriodLabel = computed(() => {
    const scope = selectedIslandScope.value
    if (scope === 'all') return 'Select an island'
    if (!budgetRadarPlans.value.length) return 'No budgets'
    const selection = budgetRadarSelection.value
    if (!selection) return 'Select period'
    const plan = budgetRadarPlans.value.find((p) => p.id === selection.planId)
    const periods = budgetRadarPeriodsCache.get(selection.planId) || budgetRadarPeriods.value
    const period = periods[selection.periodIndex]
    if (!plan || !period) return 'Budget period'
    const periodLabel = formatBudgetPeriodLabel(plan.period_type, period)
    if (budgetRadarPlans.value.length > 1) {
      return `${plan.name} · ${periodLabel}`
    }
    return periodLabel
  })

  function sankeyCacheKey(year, month) {
    return `${scopeValueToKey(selectedIslandScope.value)}:${year}-${String(month).padStart(2, '0')}`
  }

  async function loadSankeyChart(year, month, force = false) {
    const cacheKey = sankeyCacheKey(year, month)
    const cached = sankeyCache.get(cacheKey)
    if (!force && cached) {
      selectedSankeyMonth.value = { year, month }
      sankeyFlow.value = cached
      return
    }

    const prev = { ...selectedSankeyMonth.value }
    selectedSankeyMonth.value = { year, month }
    sankeyLoading.value = true
    error.value = null
    try {
      const { start_date, end_date } = calendarMonthRange(year, month)
      const res = await getAnalyticsSankey(selectedIslandScope.value, start_date, end_date)
      const data = res?.data
      const payload = {
        income: Array.isArray(data?.income) ? data.income : [],
        expense: Array.isArray(data?.expense) ? data.expense : [],
        totals: {
          income: Number(data?.totals?.income) || 0,
          expense: Number(data?.totals?.expense) || 0,
        },
      }
      sankeyCache.set(cacheKey, payload)
      sankeyFlow.value = payload
    } catch (e) {
      error.value = e?.message || String(e)
      selectedSankeyMonth.value = prev
      sankeyFlow.value = { income: [], expense: [], totals: { income: 0, expense: 0 } }
      throw e
    } finally {
      sankeyLoading.value = false
    }
  }

  async function ensureSankeyChart() {
    const { year, month } = selectedSankeyMonth.value
    await loadSankeyChart(year, month)
  }

  const categoryParentRowsForDonut = computed(() => categoryDonutParentRows.value)

  const categoryLeafRowsForDonut = computed(() => categoryDonutLeafRows.value)

  return reactive({
    loading,
    error,
    totalBalance,
    headerLabel,
    selectedIslandScope,
    islandOptions,
    monthlyLast12,
    categoryLeafAllTime,
    categoryParentAllTime,
    categoryDonutPeriodMonths,
    categoryDonutLoading,
    categoryParentRowsForDonut,
    categoryLeafRowsForDonut,
    treemapParentRows,
    treemapPeriodMonths,
    treemapLoading,
    paretoParentRows,
    paretoPeriodMonths,
    paretoLoading,
    sankeyFlow,
    selectedSankeyMonth,
    sankeyLoading,
    dailyLastMonth,
    selectedDailyMonth,
    dailyMonthRows,
    dailyMonthLoading,
    selectedIeProgressionMonth,
    ieProgressionMonthRows,
    ieProgressionMonthLoading,
    stackedMonthSlices,
    stackedPeriodMonths,
    stackedLoading,
    categoryMonthlyBars,
    categoryAnalysisId,
    categoryAnalysisExpandedIds,
    categoryAnalysisLoading,
    budgetRadar,
    budgetPlanMeta,
    budgetRadarPlans,
    budgetRadarSelection,
    budgetRadarPeriods,
    budgetRadarPickerOptions,
    budgetRadarPeriodLabel,
    budgetRadarLoading,
    patternPeriodMonths,
    weekdayRows,
    dayOfMonthRows,
    patternLoading,
    patternChartsLoaded,
    loadIslandOptions,
    setIslandScope,
    refresh,
    loadDailyMonth,
    loadIeProgressionMonth,
    ensureIeProgressionMonth,
    loadPatternCharts,
    setPatternPeriod,
    setCategoryDonutPeriod,
    loadCategoryDonutCharts,
    loadTreemapChart,
    setTreemapPeriod,
    loadParetoChart,
    setParetoPeriod,
    loadBudgetRadarChart,
    ensureBudgetRadarPickerOptions,
    setBudgetRadarSelection,
    loadSankeyChart,
    ensureSankeyChart,
    loadStackedChart,
    setStackedPeriod,
    loadCategoryAnalysisChart,
    setCategoryAnalysisCategory,
    ensureCategoryAnalysisChart,
  })
}
