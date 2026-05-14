import { ref, reactive } from 'vue'
import { getReports, getAccounts, getAccountsByWorkspace, getOngoingBudget, getBudgetDashboardSummary } from '@/api/accounting'
import { getWorkspaces, getSharedWorkspaces } from '@/api/workspace'

const IDS_CHUNK = 35

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

function mergeMonthlyRows(parts) {
  const map = new Map()
  for (const rows of parts) {
    for (const r of rows) {
      const key = `${r.year}-${r.month}`
      const prev = map.get(key) || { year: r.year, month: r.month, income: 0, expense: 0 }
      prev.income += Number(r.income || 0)
      prev.expense += Number(r.expense || 0)
      map.set(key, prev)
    }
  }
  return [...map.values()].sort((a, b) => a.year - b.year || a.month - b.month)
}

function mergeDailyRows(parts) {
  const map = new Map()
  for (const rows of parts) {
    for (const r of rows) {
      const d = String(r.date).slice(0, 10)
      const prev = map.get(d) || { date: d, income: 0, expense: 0 }
      prev.income += Number(r.income || 0)
      prev.expense += Number(r.expense || 0)
      map.set(d, prev)
    }
  }
  return [...map.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

function mergeCategoryRows(parts) {
  const map = new Map()
  for (const rows of parts) {
    for (const r of rows) {
      const id = Number(r.category_id) || 0
      const prev = map.get(id) || { category_id: id, category_name: r.category_name || 'Uncategorized', amount: 0 }
      prev.amount += Number(r.amount || 0)
      if (r.category_name) prev.category_name = r.category_name
      map.set(id, prev)
    }
  }
  return [...map.values()].sort((a, b) => (b.amount || 0) - (a.amount || 0))
}

/**
 * Same union as Accounts: own workspaces + default accounts from main list + per-shared-workspace fetch.
 * @returns {{ ids: number[], accounts: object[] }}
 */
export async function resolveAccessibleAccounts() {
  const byId = new Map()

  const addList = (list) => {
    if (!Array.isArray(list)) return
    for (const a of list) {
      if (a?.is_active === false) continue
      const id = Number(a.id)
      if (Number.isNaN(id)) continue
      if (!byId.has(id)) byId.set(id, a)
    }
  }

  const [ownResult, sharedResult, mainRes] = await Promise.all([
    getWorkspaces().catch(() => null),
    getSharedWorkspaces().catch(() => null),
    getAccounts({ is_active: true }).catch(() => null),
  ])

  const ownWorkspaces = Array.isArray(ownResult?.data) ? ownResult.data : []
  const sharedWorkspaces = Array.isArray(sharedResult?.data?.active) ? sharedResult.data.active : []
  const mainAccounts = Array.isArray(mainRes?.data) ? mainRes.data : []

  const byWorkspace = (wid) => (a) => (a.workspace_id ?? null) === (wid ?? null)

  for (const ws of ownWorkspaces) {
    addList(mainAccounts.filter(byWorkspace(ws.id)))
  }
  addList(mainAccounts.filter(byWorkspace(null)))

  await Promise.all(
    sharedWorkspaces.map(async (ws) => {
      try {
        const r = await getAccountsByWorkspace(ws.id, { is_active: true })
        addList(Array.isArray(r?.data) ? r.data : [])
      } catch {
        /* skip */
      }
    })
  )

  const accounts = [...byId.values()].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''))
  )
  return { ids: accounts.map((a) => Number(a.id)), accounts }
}

async function reportsChunked(accountIds, params) {
  const type = params.type || 'monthly'
  if (!accountIds.length) return []

  const run = async (ids) => {
    const res = await getReports({ ...params, account_ids: ids.join(',') })
    const data = res?.data
    return Array.isArray(data) ? data : []
  }

  if (accountIds.length <= IDS_CHUNK) {
    return run(accountIds)
  }

  const chunks = []
  for (let i = 0; i < accountIds.length; i += IDS_CHUNK) {
    chunks.push(accountIds.slice(i, i + IDS_CHUNK))
  }
  const parts = await Promise.all(chunks.map(run))
  if (type === 'monthly') return mergeMonthlyRows(parts)
  if (type === 'daily') return mergeDailyRows(parts)
  if (type === 'category_expense' || type === 'category_income') return mergeCategoryRows(parts)
  return parts[0] || []
}

export function useAnalyticsCharts() {
  const loading = ref(false)
  const error = ref(null)

  const accountIds = ref([])
  const totalBalance = ref(0)
  const headerLabel = ref('All accessible accounts')

  /** @type {import('vue').Ref<Array<{year:number,month:number,income:number,expense:number}>>} */
  const monthlyLast12 = ref([])
  /** Category rows */
  /** Leaf breakdown for last 12 months (used for basic subcategory donut + treemap inputs share parent range). */
  const categoryLeafAllTime = ref([])
  /** True last-6 leaf breakdown; filled when Advanced charts load (rate-limit friendly). */
  const categoryLeafLast6 = ref([])
  /** Parent breakdown for last 12 months (category donut, treemap, pareto). */
  const categoryParentAllTime = ref([])
  const dailyLastMonth = ref([])

  /** { label: string, parents: { name: string, amount: number }[] }[] */
  const stackedMonthSlices = ref([])

  /** { labels: string[], values: number[], categoryName: string, heuristic?: boolean } */
  const categoryMonthlyBars = ref({ labels: [], values: [], categoryName: '' })

  const advancedCategoryLoaded = ref(false)
  const advancedCategoryLoading = ref(false)

  /** @type {import('vue').Ref<{ items: { category_name: string, budget: number, actual: number }[] } | null>} */
  const budgetRadar = ref(null)

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      const { ids, accounts } = await resolveAccessibleAccounts()
      accountIds.value = ids
      totalBalance.value = accounts.reduce((s, a) => s + (parseFloat(a.current_balance) || 0), 0)

      if (!ids.length) {
        monthlyLast12.value = []
        categoryLeafAllTime.value = []
        categoryLeafLast6.value = []
        categoryParentAllTime.value = []
        dailyLastMonth.value = []
        stackedMonthSlices.value = []
        categoryMonthlyBars.value = { labels: [], values: [], categoryName: '' }
        budgetRadar.value = null
        advancedCategoryLoaded.value = false
        return
      }

      advancedCategoryLoaded.value = false
      stackedMonthSlices.value = []
      categoryLeafLast6.value = []

      const last12 = lastNMonthsRange(12)
      const prevMonth = previousCalendarMonthRange()

      const ongoingPromise = getOngoingBudget({}).catch(() => ({ data: null }))

      /** Only two category_expense calls on initial load (chunked per account batch). */
      const [monthlyRows, catLeaf12, catParent12, dailyRows, ongoingRes] = await Promise.all([
        reportsChunked(ids, { type: 'monthly', start_date: last12.start_date, end_date: last12.end_date }),
        reportsChunked(ids, {
          type: 'category_expense',
          category_level: 'leaf',
          start_date: last12.start_date,
          end_date: last12.end_date,
        }),
        reportsChunked(ids, {
          type: 'category_expense',
          category_level: 'parent',
          start_date: last12.start_date,
          end_date: last12.end_date,
        }),
        reportsChunked(ids, {
          type: 'daily',
          start_date: prevMonth.start_date,
          end_date: prevMonth.end_date,
        }),
        ongoingPromise,
      ])

      monthlyLast12.value = monthlyRows
      categoryLeafAllTime.value = catLeaf12
      categoryParentAllTime.value = catParent12
      dailyLastMonth.value = dailyRows

      /**
       * Category Analysis bars: avoid N monthly category_expense calls (rate limit).
       * Approximate top leaf spend per month as total_expense(month) * (top_leaf_share_of_leaf_total).
       * Less accurate when category mix shifts month-to-month; good enough for overview.
       */
      const leafRows = catLeaf12 || []
      const sumLeaf = leafRows.reduce((s, r) => s + Number(r.amount || 0), 0)
      const topLeaf = leafRows[0]
      let catBars = { labels: [], values: [], categoryName: '', heuristic: false }
      if (topLeaf && sumLeaf > 0) {
        const ratio = Number(topLeaf.amount) / sumLeaf
        catBars = {
          labels: monthlyRows.map((r) =>
            new Date(r.year, r.month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
          ),
          values: monthlyRows.map((r) => (Number(r.expense) || 0) * ratio),
          categoryName: topLeaf.category_name || 'Category',
          heuristic: true,
        }
      }
      categoryMonthlyBars.value = catBars

      const ongoing = ongoingRes?.data
      const budgetId = ongoing?.id != null ? Number(ongoing.id) : null
      if (budgetId != null && !Number.isNaN(budgetId)) {
        try {
          const dash = await getBudgetDashboardSummary(budgetId)
          const items = dash?.data?.items
          if (Array.isArray(items) && items.length) {
            budgetRadar.value = { items }
          } else {
            budgetRadar.value = null
          }
        } catch {
          budgetRadar.value = null
        }
      } else {
        budgetRadar.value = null
      }
    } catch (e) {
      error.value = e?.message || String(e)
      monthlyLast12.value = []
      categoryLeafAllTime.value = []
      categoryLeafLast6.value = []
      categoryParentAllTime.value = []
      dailyLastMonth.value = []
      stackedMonthSlices.value = []
      categoryMonthlyBars.value = { labels: [], values: [], categoryName: '' }
      budgetRadar.value = null
      advancedCategoryLoaded.value = false
    } finally {
      loading.value = false
    }
  }

  /**
   * Advanced-only category_expense usage: true last-6 leaf donut + stacked parent per month (sequential to reduce bursts).
   */
  async function loadAdvancedCategoryCharts() {
    const ids = accountIds.value
    if (!ids.length || advancedCategoryLoaded.value) return
    advancedCategoryLoading.value = true
    error.value = null
    try {
      const last6 = lastNMonthsRange(6)
      const leaf6 = await reportsChunked(ids, {
        type: 'category_expense',
        category_level: 'leaf',
        start_date: last6.start_date,
        end_date: last6.end_date,
      })
      categoryLeafLast6.value = leaf6

      const monthsForStack = enumerateMonthsInclusive(last6.start_date, last6.end_date)
      const stacked = []
      for (const { year, month } of monthsForStack) {
        const s = new Date(year, month - 1, 1)
        const e = endOfMonth(s)
        const rows = await reportsChunked(ids, {
          type: 'category_expense',
          category_level: 'parent',
          start_date: ymd(s),
          end_date: ymd(e),
        })
        const label = s.toLocaleDateString('en-US', { month: 'short' })
        stacked.push({
          label,
          parents: rows.map((r) => ({
            name: r.category_name || 'Uncategorized',
            amount: Number(r.amount || 0),
          })),
        })
      }
      stackedMonthSlices.value = stacked
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
    accountIds,
    totalBalance,
    headerLabel,
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
    refresh,
    loadAdvancedCategoryCharts,
  })
}
