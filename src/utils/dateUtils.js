/**
 * Shared date formatting utilities for human-readable display.
 * Handles ISO strings, YYYY-MM-DD, and Date objects.
 */

/**
 * Parse a date value to Date object. Uses date part only to avoid timezone shifts.
 * @param {string|Date} val - ISO string, YYYY-MM-DD, or Date
 * @returns {Date|null}
 */
export function parseDate(val) {
  if (!val) return null
  if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val
  const s = String(val).trim()
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) {
    const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Format date for display: "Jan 31, 2026"
 * @param {string|Date} val
 * @param {string} fallback - Value when invalid (default '-')
 * @returns {string}
 */
export function formatDateDisplay(val, fallback = '-') {
  const d = parseDate(val)
  if (!d) return fallback
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Format date range for display: "Jan 31, 2026 to Apr 30, 2026"
 * @param {string|Date} start
 * @param {string|Date} end
 * @param {string} fallback
 * @returns {string}
 */
export function formatDateRange(start, end, fallback = '-') {
  const s = formatDateDisplay(start, '')
  const e = formatDateDisplay(end, '')
  if (!s || !e) return fallback
  return `${s} to ${e}`
}
