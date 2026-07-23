import { formatDateRange } from '@/utils/dateUtils'

export const BUDGET_STATUS_FILTERS = [
  { label: 'Ongoing', value: 'active' },
  { label: 'All', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Done', value: 'completed' },
  { label: 'Abandoned', value: 'abandoned' }
]

export function formatBudgetStatusLabel(status) {
  const map = {
    active: 'Ongoing',
    draft: 'Draft',
    completed: 'Done',
    abandoned: 'Abandoned'
  }
  return map[status] || status || ''
}

export function formatBudgetPeriodType(t) {
  const map = {
    month: 'Monthly',
    monthly: 'Monthly',
    week: 'Weekly',
    weekly: 'Weekly',
    year: 'Yearly',
    yearly: 'Yearly',
    custom: 'Custom'
  }
  return map[t] || t || ''
}

export function formatBudgetDateRange(start, end) {
  return formatDateRange(start, end, '')
}

export function normalizeBudgetPeriodType(periodType) {
  const t = String(periodType || 'month').toLowerCase()
  if (t === 'weekly') return 'week'
  if (t === 'monthly') return 'month'
  if (t === 'yearly') return 'year'
  return t
}

function parseCalendarYmd(ymd) {
  const s = String(ymd).split('T')[0]
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

function toCalendarYmd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDaysToYmd(ymd, deltaDays) {
  const d = parseCalendarYmd(ymd)
  d.setDate(d.getDate() + deltaDays)
  return toCalendarYmd(d)
}

export function calendarTodayYmd() {
  return toCalendarYmd(new Date())
}

/** Matches accounting-service budgetPeriodUtils.computePeriodEndDate */
export function computePeriodEndDate(periodType, startYmd) {
  const startStr = String(startYmd).split('T')[0]
  const [y, m] = startStr.split('-').map(Number)
  const type = normalizeBudgetPeriodType(periodType)
  if (type === 'week') {
    const start = parseCalendarYmd(startStr)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return toCalendarYmd(end)
  }
  if (type === 'month') {
    return toCalendarYmd(new Date(y, m, 0, 12, 0, 0, 0))
  }
  return toCalendarYmd(new Date(y, 11, 31, 12, 0, 0, 0))
}

/** Matches accounting-service budgetPeriodUtils.computeNextPeriodDates */
export function computeNextPeriodDates(endDate, periodType) {
  const endStr = String(endDate).split('T')[0]
  const newStart = addDaysToYmd(endStr, 1)
  const newEnd = computePeriodEndDate(periodType, newStart)
  return { newStart, newEnd }
}

export function periodBounds(period) {
  if (!period) return { start: '', end: '' }
  return {
    start: period.period_start ?? period.periodStart ?? '',
    end: period.period_end ?? period.periodEnd ?? ''
  }
}

export function stripBudgetPeriodBracketSuffix(name) {
  return String(name || '').replace(/\s*\([^)]+\)\s*$/, '').trim()
}

/** Period-only label, e.g. "July 2026". Mirrors accounting-service formatPeriodLabelOnly. */
export function formatBudgetPeriodLabel(periodType, startDate, endDate) {
  const startStr = String(startDate || '').split('T')[0]
  const endStr = String(endDate || '').split('T')[0]
  if (!startStr) return ''
  const start = parseCalendarYmd(startStr)
  const type = normalizeBudgetPeriodType(periodType)

  if (type === 'month') {
    return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  if (type === 'year') {
    return String(start.getFullYear())
  }
  if (type === 'week' && endStr) {
    const end = parseCalendarYmd(endStr)
    const opts = { day: 'numeric', month: 'short', year: 'numeric' }
    const a = start.toLocaleDateString('en-US', opts)
    const b = end.toLocaleDateString('en-US', opts)
    return a === b ? a : `${a} – ${b}`
  }
  return endStr ? `${startStr} – ${endStr}` : startStr
}

/**
 * Build a plan display name: "My budget (July 2026)".
 * If the base name is empty or equals the period label, returns the period label only.
 */
export function formatBudgetPlanNameWithPeriod(baseName, periodType, startDate, endDate) {
  const periodLabel = formatBudgetPeriodLabel(periodType, startDate, endDate)
  const base = stripBudgetPeriodBracketSuffix(baseName)
  if (!base || base === periodLabel) return periodLabel
  return `${base} (${periodLabel})`
}

export function workspaceBudgetParams(workspaceId) {
  if (workspaceId != null && workspaceId !== '') {
    return { workspace_id: Number(workspaceId) }
  }
  return { workspace_id: 'null' }
}

export function formatBudgetAmount(val) {
  const n = Number(val) || 0
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export function formatBudgetMoney(val, currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(val || 0)
  } catch {
    return formatBudgetAmount(val)
  }
}

export function budgetUsedPercent(actual, planned) {
  const p = Number(planned) || 0
  if (p <= 0) return 0
  return Math.min(100, Math.round(((Number(actual) || 0) / p) * 100))
}

export function barToneClass(pct) {
  const p = Number(pct) || 0
  if (p >= 90) return 'tone-danger'
  if (p > 60) return 'tone-warn'
  return 'tone-ok'
}

export function actualAmountClass(status, actual, planned) {
  if (status === 'abandoned' || status === 'draft') return 'amount-muted'
  if (status === 'completed' && (Number(actual) || 0) / (Number(planned) || 1) >= 0.9) return 'amount-warn'
  if (status === 'active') return 'amount-good'
  return 'amount-muted'
}

export function computeMonthlyProjection(actual, planned, periodStart, periodEnd) {
  const a = Number(actual) || 0
  const budget = Number(planned) || 0
  if (!periodStart || !periodEnd || budget <= 0) {
    return { projected: 0, changePct: 0 }
  }
  const start = new Date(`${periodStart}T12:00:00`)
  const end = new Date(`${periodEnd}T12:00:00`)
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00`)
  const cap = today > end ? end : today < start ? start : today
  const msPerDay = 86400000
  const daysElapsed = Math.max(1, Math.floor((cap - start) / msPerDay) + 1)
  const totalDays = Math.max(1, Math.floor((end - start) / msPerDay) + 1)
  const projected = (a / daysElapsed) * totalDays
  const changePct = budget > 0 ? ((projected - budget) / budget) * 100 : 0
  return { projected, changePct }
}

export function pickReportPeriod(plan, periods) {
  const list = Array.isArray(periods) ? periods : []
  if (!list.length) return null
  const idx = pickDashboardPeriodIndex(plan, list)
  return idx == null ? null : list[idx]
}

/** 0-based period index for overview/detailed views. */
export function pickDashboardPeriodIndex(plan, periods) {
  const list = Array.isArray(periods) ? periods : []
  if (!list.length) return null
  const status = String(plan?.status || '').toLowerCase()
  if (status === 'completed' || status === 'abandoned') return list.length - 1
  if (status === 'draft') return 0
  const today = calendarTodayYmd()
  const idx = list.findIndex((p) => {
    const { start, end } = periodBounds(p)
    return start && end && today >= start && today <= end
  })
  return idx >= 0 ? idx : list.length - 1
}

export function flattenPieSlices(items) {
  const slices = []
  for (const row of items || []) {
    if (row.sub_items?.length) {
      for (const sub of row.sub_items) {
        const actual = Number(sub.actual) || 0
        if (actual > 0) {
          slices.push({ name: sub.category_name || 'Other', value: actual })
        }
      }
    } else {
      const actual = Number(row.actual) || 0
      if (actual > 0) {
        slices.push({ name: row.category_name || 'Other', value: actual })
      }
    }
  }
  return slices.sort((a, b) => b.value - a.value).slice(0, 6)
}

export function currentPeriodSpendLabel(periodType) {
  const map = {
    month: 'This month',
    monthly: 'This month',
    week: 'This week',
    weekly: 'This week',
    year: 'This year',
    yearly: 'This year'
  }
  return map[periodType] || 'This period'
}

export function formatBudgetPct(val, digits = 1) {
  const n = Number(val) || 0
  return `${n.toFixed(digits)}%`
}

export function formatSignedBudgetPct(val, digits = 1) {
  const n = Number(val) || 0
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(digits)}%`
}

export function buildDonutSlicesFromItem(item) {
  const subs = item?.sub_items || []
  const raw =
    subs.length > 0
      ? subs.map((s) => ({ name: s.category_name || 'Other', value: Number(s.actual) || 0 }))
      : [{ name: item?.category_name || 'Other', value: Number(item?.actual) || 0 }]
  const slices = raw.filter((s) => s.value > 0).sort((a, b) => b.value - a.value)
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  if (total <= 0) return []
  return slices.map((s) => ({
    ...s,
    pct: Math.round((s.value / total) * 100)
  }))
}

export function buildCategoryDetailStats(item, periodReport, fullReport) {
  const actual = Number(item?.actual) || 0
  const budget = Number(item?.budget) || 0
  const remaining = Math.max(0, budget - actual)
  const overallPct = budget > 0 ? (actual / budget) * 100 : 0
  const remainingPct = budget > 0 ? (remaining / budget) * 100 : 0

  const periodIndex = Number(periodReport?.period_index) || 0
  const categoryId = Number(item?.category_id)

  let lastActuals = Array.isArray(item?.last_periods_actuals) ? item.last_periods_actuals : []
  if (!lastActuals.length && categoryId && fullReport) {
    lastActuals = buildLastPeriodsActualsForCategory(categoryId, fullReport, periodIndex)
  }

  const lastMonth =
    lastActuals.length >= 2 ? Number(lastActuals[lastActuals.length - 2]) || 0 : Number(lastActuals[0]) || 0
  const monthlyAvg = lastActuals.length
    ? lastActuals.reduce((sum, v) => sum + (Number(v) || 0), 0) / lastActuals.length
    : 0

  const projection = computeMonthlyProjection(
    actual,
    budget,
    periodReport?.period_start,
    periodReport?.period_end
  )

  let ytd = 0
  const periods = fullReport?.periods || []
  for (let i = 0; i <= periodIndex && i < periods.length; i++) {
    const row = findReportRowInPeriod(periods[i], categoryId)
    ytd += Number(row?.actual) || 0
  }

  return {
    ytd,
    lastMonth,
    monthlyAvg,
    projected: projection.projected,
    changePct: projection.changePct,
    overallPct,
    remaining,
    remainingPct
  }
}

export function findReportRowInPeriod(period, categoryId) {
  if (!period || categoryId == null) return null
  const id = Number(categoryId)
  for (const it of period.items || []) {
    if (Number(it.category_id) === id) return it
    const sub = (it.sub_items || []).find((s) => Number(s.category_id) === id)
    if (sub) return sub
  }
  return null
}

export function buildLastPeriodsActualsForCategory(categoryId, fullReport, periodIndex, lookback = 6) {
  const periods = fullReport?.periods || []
  const startIdx = Math.max(0, periodIndex - lookback + 1)
  const out = []
  for (let i = startIdx; i <= periodIndex && i < periods.length; i++) {
    const row = findReportRowInPeriod(periods[i], categoryId)
    out.push(Number(row?.actual) || 0)
  }
  return out
}

export const BUDGET_DONUT_COLORS = [
  '#B84B45',
  '#D65F55',
  '#E88A82',
  '#C8C8C8',
  '#F0B4AE',
  '#F8D4D0'
]

/** Mid-angles (degrees) for each donut slice — matches ECharts pie defaults. */
export function computeDonutSliceMidAngles(
  slices,
  { startAngle = 90, padAngle = 2.5, clockwise = true } = {}
) {
  const rows = (slices || []).filter((s) => (Number(s.value) || 0) > 0)
  const total = rows.reduce((sum, s) => sum + (Number(s.value) || 0), 0)
  if (!total) return []

  const n = rows.length
  const sweep = 360 - padAngle * n
  const dir = clockwise ? -1 : 1
  let cursor = startAngle

  return rows.map((row) => {
    const sliceAngle = (row.value / total) * sweep
    const mid = cursor + dir * (sliceAngle / 2)
    cursor += dir * (sliceAngle + padAngle)
    return mid
  })
}

/** ECharts donut for budget detail (chart only — labels rendered in HTML for narrow columns). */
export function buildBudgetDetailDonutOption(slices) {
  const rows = (slices || []).filter((s) => (Number(s.value) || 0) > 0)
  const total = rows.reduce((sum, s) => sum + (Number(s.value) || 0), 0)
  if (!total || !rows.length) return null

  const pieData = rows.map((s, i) => ({
    name: s.name,
    value: Number(s.value) || 0,
    itemStyle: {
      color: BUDGET_DONUT_COLORS[i % BUDGET_DONUT_COLORS.length],
      borderColor: '#fff',
      borderWidth: 2,
      borderRadius: 4
    }
  }))

  return {
    animation: false,
    tooltip: { show: false },
    series: [
      {
        type: 'pie',
        startAngle: 90,
        clockwise: true,
        padAngle: 2.5,
        minShowLabelAngle: 0.5,
        radius: ['46%', '72%'],
        center: ['50%', '50%'],
        data: pieData,
        label: { show: false },
        labelLine: { show: false },
        emphasis: { disabled: true }
      }
    ]
  }
}

/** Slice rows with display color for HTML legend beside the donut. */
export function buildBudgetDetailDonutLabels(slices) {
  return (slices || [])
    .filter((s) => (Number(s.value) || 0) > 0)
    .map((s, i) => ({
      name: s.name,
      pct: s.pct ?? 0,
      color: BUDGET_DONUT_COLORS[i % BUDGET_DONUT_COLORS.length]
    }))
}

/** Split a donut label across at most two lines, preferring word boundaries. */
export function splitDonutLabelLines(name, maxLineLen = 10) {
  const text = String(name || '').trim()
  if (!text) return ['']
  if (text.length <= maxLineLen) return [text]

  let splitAt = text.lastIndexOf(' ', maxLineLen)
  if (splitAt <= 0) splitAt = text.indexOf(' ', maxLineLen)

  if (splitAt > 0) {
    const line1 = text.slice(0, splitAt)
    const line2 = text.slice(splitAt + 1)
    return line2 ? [line1, line2] : [line1]
  }

  return [text.slice(0, maxLineLen), text.slice(maxLineLen)]
}

/** Spread donut labels on one side so they do not overlap (yPct is vertical center). */
export function layoutDonutSideLabels(labels, containerHeightPx, { minGapPx = 3, paddingPx = 4 } = {}) {
  if (!labels.length || containerHeightPx <= 0) return labels

  const sorted = [...labels]
    .map((row) => ({
      ...row,
      yPx: (row.yPct / 100) * containerHeightPx,
      blockPx: row.blockPx || 24
    }))
    .sort((a, b) => a.yPx - b.yPx)

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const minY = prev.yPx + (prev.blockPx + sorted[i].blockPx) / 2 + minGapPx
    if (sorted[i].yPx < minY) sorted[i].yPx = minY
  }

  const topLimit = sorted[0].blockPx / 2 + paddingPx
  const bottomLimit = containerHeightPx - sorted[sorted.length - 1].blockPx / 2 - paddingPx
  const span = sorted[sorted.length - 1].yPx - sorted[0].yPx
  const allowedSpan = Math.max(0, bottomLimit - topLimit)

  if (span > allowedSpan && span > 0) {
    const scale = allowedSpan / span
    const anchor = sorted[0].yPx
    for (const item of sorted) {
      item.yPx = topLimit + (item.yPx - anchor) * scale
    }
  } else {
    const overflowBottom = sorted[sorted.length - 1].yPx - bottomLimit
    if (overflowBottom > 0) {
      for (const item of sorted) item.yPx -= overflowBottom
    }
    const overflowTop = topLimit - sorted[0].yPx
    if (overflowTop > 0) {
      for (const item of sorted) item.yPx += overflowTop
    }
  }

  return sorted.map((row) => ({
    ...row,
    yPct: Math.min(99, Math.max(1, (row.yPx / containerHeightPx) * 100))
  }))
}

export function estimateDonutSideHeight(labels, blockPxByIndex = {}) {
  if (!labels.length) return 58
  const blocks = labels.map((row) => blockPxByIndex[row.index] || row.blockPx || 24)
  const gaps = Math.max(0, labels.length - 1) * 3
  const padding = 8
  return Math.max(58, blocks.reduce((sum, h) => sum + h, 0) + gaps + padding)
}
