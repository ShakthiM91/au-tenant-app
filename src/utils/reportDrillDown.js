/**
 * Navigation helpers for analytics chart → transaction drill-down.
 */

import { donutSliceAt, donutSliceByName } from '@/utils/categoryDonutData'
import { appendIslandScopeQuery } from '@/utils/analyticsIslandScope'

function baseQuery(opts) {
  const query = { from: opts.from || '/analytics' }
  if (opts.islandScope != null) appendIslandScopeQuery(query, opts.islandScope)
  return query
}

/**
 * @param {import('vue-router').Router} router
 * @param {{
 *   categoryId?: number,
 *   categoryIds?: number[],
 *   level?: 'parent'|'leaf',
 *   name?: string,
 *   type?: 'expense'|'income',
 *   startDate?: string,
 *   endDate?: string,
 *   from?: string,
 *   islandScope?: 'all' | 'null' | number,
 * }} opts
 */
export function navigateToCategoryTransactions(router, opts = {}) {
  const type = opts.type === 'income' ? 'income' : 'expense'
  const categoryId = opts.categoryId ?? 0
  const path =
    type === 'income'
      ? `/analytics/income-by-category/${categoryId}`
      : `/analytics/expense-by-category/${categoryId}`

  const query = {
    ...baseQuery(opts),
    level: opts.level === 'parent' ? 'parent' : 'leaf',
    name: opts.name || 'Uncategorized',
    type,
  }
  if (opts.startDate && opts.endDate) {
    query.start_date = opts.startDate
    query.end_date = opts.endDate
  }
  if (opts.categoryIds?.length) {
    query.category_ids = opts.categoryIds.join(',')
  }

  router.push({ path, query })
}

/**
 * @param {import('vue-router').Router} router
 * @param {{
 *   pattern: 'weekday'|'dom',
 *   value: number,
 *   label?: string,
 *   startDate: string,
 *   endDate: string,
 *   from?: string,
 *   islandScope?: 'all' | 'null' | number,
 * }} opts
 */
export function navigateToPatternTransactions(router, opts) {
  const query = {
    ...baseQuery(opts),
    pattern: opts.pattern,
    value: String(opts.value),
    label: opts.label || '',
    start_date: opts.startDate,
    end_date: opts.endDate,
  }
  router.push({ path: '/analytics/pattern-transactions', query })
}

/**
 * @param {import('vue-router').Router} router
 * @param {{ date: string, from?: string, islandScope?: 'all' | 'null' | number }} opts
 */
export function navigateToDay(router, opts) {
  router.push({
    name: 'AnalyticsDay',
    params: { date: opts.date },
    query: baseQuery(opts),
  })
}

/**
 * @param {import('vue-router').Router} router
 * @param {{ ym: string, from?: string, islandScope?: 'all' | 'null' | number }} opts
 */
export function navigateToMonth(router, opts) {
  router.push({
    name: 'AnalyticsMonth',
    params: { ym: opts.ym },
    query: baseQuery(opts),
  })
}

export function drillDownFromDonutSlice(rows, sliceIndex, opts = {}) {
  const prepOpts = { tall: opts.tall, expanded: opts.expanded ?? true }
  let slice = null
  if (opts.sliceName) {
    slice = donutSliceByName(rows, opts.sliceName, prepOpts)
  }
  if (!slice && sliceIndex != null) {
    slice = donutSliceAt(rows, sliceIndex, prepOpts)
  }
  if (!slice) return null

  if (slice.isOther && slice.category_ids?.length) {
    return {
      categoryId: 0,
      categoryIds: slice.category_ids,
      name: 'Other',
      level: opts.level || 'leaf',
    }
  }
  return {
    categoryId: slice.category_id ?? 0,
    name: slice.name,
    level: opts.level || 'leaf',
  }
}

export function sankeyDrillFromClick(params) {
  if (params?.dataType !== 'node') return null
  const d = params?.data
  if (!d?.drillable) return null
  return {
    categoryId: d.categoryId ?? 0,
    categoryName: d.categoryName || d.name,
    txnType: d.txnType === 'income' ? 'income' : 'expense',
  }
}

export function transactionMatchesWeekday(row, weekdayIdx) {
  const s = row?.transaction_date
  if (!s) return false
  const d = new Date(String(s).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return false
  const jsDay = d.getDay()
  const monBased = jsDay === 0 ? 6 : jsDay - 1
  return monBased === Number(weekdayIdx)
}

export function transactionMatchesDayOfMonth(row, dom) {
  const s = row?.transaction_date
  if (!s) return false
  const d = new Date(String(s).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return false
  return d.getDate() === Number(dom)
}
