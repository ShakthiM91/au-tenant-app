import { DONUT_OTHER_COLOR, donutChartColor } from '@/utils/donutChartColors'

/**
 * @param {{ category_id?: number, category_name?: string, amount?: number }[]} rows
 * @param {{ tall?: boolean, expanded?: boolean }} [opts]
 */
export function prepareDonutSlices(rows, { tall = false, expanded = false } = {}) {
  const sourceRows = (rows || []).filter((r) => Number(r.amount) > 0)
  const mapped = sourceRows.map((r, i) => ({
    name: r.category_name || 'Uncategorized',
    value: Number(r.amount) || 0,
    color: donutChartColor(i),
    category_id: r.category_id != null ? Number(r.category_id) : 0,
  }))

  if (!mapped.length) return { slices: [], total: 0, sourceRows: [] }

  const total = mapped.reduce((s, r) => s + r.value, 0)
  const sliceCap = expanded ? 24 : tall ? 14 : 10
  const sorted = [...mapped].sort((a, b) => b.value - a.value)
  const top = sorted.slice(0, sliceCap - 1)
  const rest = sorted.slice(sliceCap - 1)
  const otherVal = rest.reduce((s, r) => s + r.value, 0)

  let slices = top
  if (otherVal > 0) {
    slices = [
      ...top,
      {
        name: 'Other',
        value: otherVal,
        color: DONUT_OTHER_COLOR,
        isOther: true,
        category_ids: rest.map((r) => r.category_id).filter((id) => id != null),
      },
    ]
  }

  return { slices, total, sourceRows }
}

/** @param {{ category_name?: string, amount?: number }[]} rows */
export function rowsToDonutItems(rows, opts) {
  return prepareDonutSlices(rows, opts).slices
}

/** Map slice index back to underlying row data for drill-down. */
export function donutSliceAt(rows, sliceIndex, opts = {}) {
  const { slices } = prepareDonutSlices(rows, opts)
  return slices[sliceIndex] ?? null
}

/** Resolve a donut slice by display name (used when focus modal slice order differs). */
export function donutSliceByName(rows, name, opts = {}) {
  const label = String(name || '').trim()
  if (!label) return null
  const { slices } = prepareDonutSlices(rows, opts)
  return slices.find((s) => s.name === label) ?? null
}
