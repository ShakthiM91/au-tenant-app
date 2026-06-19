import { ref, reactive } from 'vue'
import { getAnalyticsOverview, getAnalyticsAdvanced } from '@/api/accounting'
import { getWorkspaces, getSharedWorkspaces } from '@/api/workspace'
import { resolveAccessibleAccounts } from '@/composables/useAnalyticsChartsCore'

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

export function allTimeRangeStart() {
  return { start_date: '2000-01-01', end_date: ymd(new Date()) }
}

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
  const categoryLeafLast6 = ref([])
  const categoryParentAllTime = ref([])
  const dailyLastMonth = ref([])
  const stackedMonthSlices = ref([])
  const categoryMonthlyBars = ref({ labels: [], values: [], categoryName: '' })

  const advancedCategoryLoaded = ref(false)
  const advancedCategoryLoading = ref(false)
  const budgetRadar = ref(null)

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

    const { accounts } = await resolveAccessibleAccounts()
    const hasDefault = accounts.some((a) => a.workspace_id == null || a.workspace_id === '')
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
    advancedCategoryLoaded.value = false
    await refresh()
  }

  function clearChartState() {
    monthlyLast12.value = []
    categoryLeafAllTime.value = []
    categoryLeafLast6.value = []
    categoryParentAllTime.value = []
    dailyLastMonth.value = []
    stackedMonthSlices.value = []
    categoryMonthlyBars.value = { labels: [], values: [], categoryName: '' }
    budgetRadar.value = null
    advancedCategoryLoaded.value = false
  }

  function applyCategoryMonthlyBars(monthlyRows, catLeaf12) {
    const leafRows = catLeaf12 || []
    const sumLeaf = leafRows.reduce((s, r) => s + Number(r.amount || 0), 0)
    const topLeaf = leafRows[0]
    if (!topLeaf || sumLeaf <= 0) {
      categoryMonthlyBars.value = { labels: [], values: [], categoryName: '', heuristic: false }
      return
    }
    const ratio = Number(topLeaf.amount) / sumLeaf
    categoryMonthlyBars.value = {
      labels: monthlyRows.map((r) =>
        new Date(r.year, r.month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
      ),
      values: monthlyRows.map((r) => (Number(r.expense) || 0) * ratio),
      categoryName: topLeaf.category_name || 'Category',
      heuristic: true,
    }
  }

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      updateHeaderLabel()
      advancedCategoryLoaded.value = false
      stackedMonthSlices.value = []
      categoryLeafLast6.value = []

      const res = await getAnalyticsOverview(selectedIslandScope.value)
      const data = res?.data

      totalBalance.value = Number(data?.total_balance) || 0
      monthlyLast12.value = Array.isArray(data?.monthly_last_12) ? data.monthly_last_12 : []
      categoryLeafAllTime.value = Array.isArray(data?.category_leaf_12) ? data.category_leaf_12 : []
      categoryParentAllTime.value = Array.isArray(data?.category_parent_12) ? data.category_parent_12 : []
      dailyLastMonth.value = Array.isArray(data?.daily_last_month) ? data.daily_last_month : []
      budgetRadar.value = data?.budget_radar ?? null

      applyCategoryMonthlyBars(monthlyLast12.value, categoryLeafAllTime.value)
    } catch (e) {
      error.value = e?.message || String(e)
      clearChartState()
      totalBalance.value = 0
    } finally {
      loading.value = false
    }
  }

  async function loadAdvancedCategoryCharts() {
    if (advancedCategoryLoaded.value) return
    advancedCategoryLoading.value = true
    error.value = null
    try {
      const last6 = lastNMonthsRange(6)
      const res = await getAnalyticsAdvanced(selectedIslandScope.value)
      const data = res?.data

      categoryLeafLast6.value = Array.isArray(data?.category_leaf_6) ? data.category_leaf_6 : []
      stackedMonthSlices.value = rowsToStackedMonthSlices(
        data?.category_parent_monthly_6,
        last6.start_date,
        last6.end_date
      )
      advancedCategoryLoaded.value = true
    } catch (e) {
      error.value = e?.message || String(e)
      stackedMonthSlices.value = []
    } finally {
      advancedCategoryLoading.value = false
    }
  }

  return reactive({
    loading,
    error,
    totalBalance,
    headerLabel,
    selectedIslandScope,
    islandOptions,
    monthlyLast12,
    categoryLeafAllTime,
    categoryLeafLast6,
    categoryParentAllTime,
    dailyLastMonth,
    stackedMonthSlices,
    categoryMonthlyBars,
    budgetRadar,
    advancedCategoryLoaded,
    advancedCategoryLoading,
    loadIslandOptions,
    setIslandScope,
    refresh,
    loadAdvancedCategoryCharts,
  })
}
