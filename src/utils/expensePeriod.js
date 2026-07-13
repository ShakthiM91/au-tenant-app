/** Date helpers for analytics drill-down detail views. */

export function toYmd(value) {
  if (value == null || value === '') return ''
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ''
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const s = String(value).trim()
  const only = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (only) return only[0]
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return ''
}

export function parseYmd(ymd) {
  const s = toYmd(ymd)
  if (!s) return null
  const d = new Date(`${s}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function pickerLabelFromYmd(ymd, { daily = false } = {}) {
  const d = parseYmd(ymd)
  if (!d) return 'This period'
  if (daily) {
    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function shortDayLabel(dateStr) {
  const d = parseYmd(dateStr)
  if (!d) return '—'
  return String(d.getDate())
}

export function monthRangeFromYmd(ymdOrYm) {
  const match = String(ymdOrYm || '').trim().match(/^(\d{4})-(\d{2})/)
  if (!match) return { startStr: '', endStr: '' }
  const y = Number(match[1])
  const m = Number(match[2])
  if (!y || m < 1 || m > 12) return { startStr: '', endStr: '' }
  const startStr = `${y}-${String(m).padStart(2, '0')}-01`
  const end = new Date(y, m, 0)
  return { startStr, endStr: toYmd(end) }
}

export function dayQueryBounds(ymd) {
  const d = toYmd(ymd)
  if (!d) return { startStr: '', endStr: '' }
  return { startStr: `${d} 00:00:00`, endStr: `${d} 23:59:59` }
}

export function periodQueryBounds(startYmd, endYmd) {
  const start = toYmd(startYmd)
  const end = toYmd(endYmd)
  if (!start || !end) return { startStr: '', endStr: '' }
  return { startStr: `${start} 00:00:00`, endStr: `${end} 23:59:59` }
}

export function transactionInPeriod(row, startYmd, endYmd) {
  const ymd = toYmd(row?.transaction_date)
  if (!ymd) return false
  const start = toYmd(startYmd)
  const end = toYmd(endYmd)
  if (!start || !end) return true
  return ymd >= start && ymd <= end
}
