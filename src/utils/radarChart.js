import { emptyRadarPlaceholder, radarBudgetOption } from '@/views/analytics/chartOptions'

/** Prefer server-built radar rows; fall back to budget period report lines. */
export function resolveRadarReportItems(report) {
  const radar = report?.radar_items
  if (Array.isArray(radar) && radar.length) return radar
  return Array.isArray(report?.items) ? report.items : []
}

/**
 * Merge parent-category expense totals into radar rows so unbudgeted spend appears
 * and budgeted rows use full-period actuals (not only budget-scoped cache).
 *
 * @param {Array} budgetItems
 * @param {Array<{ category_id?: number, category_name?: string, amount?: number }>} expenseParents
 */
export function mergeRadarItemsWithParentExpenses(budgetItems, expenseParents) {
  const rows = (budgetItems || []).map((item) => ({ ...item }))
  const byId = new Map(rows.map((item) => [Number(item.category_id), item]))
  const extras = []

  for (const row of expenseParents || []) {
    const cid = Number(row.category_id)
    const actual = Number(row.amount) || 0
    if (!Number.isFinite(cid) || actual <= 0) continue

    const existing = byId.get(cid)
    if (existing) {
      const budget = Number(existing.budget) || 0
      existing.actual = actual
      existing.variance = budget - actual
      existing.overrun = actual > budget ? actual - budget : 0
      continue
    }

    extras.push({
      category_id: cid,
      category_name: row.category_name || 'Uncategorized',
      budget: 0,
      actual,
      variance: -actual,
      overrun: actual,
      is_divertable: false,
      is_system_calculated: false,
    })
  }

  extras.sort((a, b) => (Number(b.actual) || 0) - (Number(a.actual) || 0))
  return [...rows, ...extras]
}

export function radarItemsForChart(items) {
  return (items || []).filter((it) => it?.category_name != null)
}

export function hasRadarChartData(items) {
  return (items || []).some(
    (it) => it?.category_name != null && (Number(it.budget) > 0 || Number(it.actual) > 0)
  )
}

/** Rows for the radar category breakdown list (includes unbudgeted categories with actual > 0). */
export function radarListItems(items) {
  return (items || []).filter(
    (it) => it?.category_name != null && (Number(it.budget) > 0 || Number(it.actual) > 0)
  )
}

/** Resolve the radar category row for a chart click (axis label or either series). */
export function radarCategoryFromClick(params, option) {
  const items = option?.__radarItems || []
  if (!items.length) return null

  const indicators = option?.radar?.indicator || []
  let item = null

  if (params?.seriesType === 'radar' && params.dataIndex != null) {
    item = items[params.dataIndex] ?? null
  }

  const clickName = params?.name
  if (!item && clickName && clickName !== 'Planned' && clickName !== 'Actual') {
    item = items.find((it) => it.category_name === clickName) ?? null
    if (!item) {
      const idx = indicators.findIndex((ind) => ind.name === clickName)
      if (idx >= 0) item = items[idx] ?? null
    }
  }

  if (!item) return null

  return {
    name: item.category_name || 'Category',
    categoryId: item.category_id,
    budget: Number(item.budget) || 0,
    actual: Number(item.actual) || 0,
  }
}

/** Tooltip HTML for one radar category (planned + actual). */
export function radarCategoryTooltipHtml(item, formatAmount = (n) => String(n)) {
  if (!item) return ''
  const name = item.category_name || 'Category'
  const planned = formatAmount(Number(item.budget) || 0)
  const actual = formatAmount(Number(item.actual) || 0)
  return `${name}<br/>Planned: ${planned}<br/>Actual: ${actual}`
}

/** @param {{ category_name?: string, budget?: number, actual?: number }[]} items */
export function radarFromReportItems(items) {
  const filtered = radarItemsForChart(items)
  if (!filtered.length) return emptyRadarPlaceholder()
  const option = radarBudgetOption(filtered)
  option.__radarItems = filtered.map((it) => ({
    ...it,
    budget: Number(it.budget) || 0,
    actual: Number(it.actual) || 0,
  }))
  return option
}

