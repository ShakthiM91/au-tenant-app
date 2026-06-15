export function parseBackdateSettings(settings = {}) {
  const rawLimit = settings.accounting_backdate_limit_days
  const limitDays =
    rawLimit != null && rawLimit !== '' && !Number.isNaN(Number(rawLimit))
      ? Math.max(0, Math.floor(Number(rawLimit)))
      : 30

  return {
    limitDays,
    timezone: settings.timezone || 'UTC'
  }
}

export function getCalendarDateInTimezone(date, timezone) {
  const tz = timezone || 'UTC'
  const d = date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}

export function addDaysToYmd(ymd, days) {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

export function getMinAllowedTransactionDay(settings = {}) {
  const { limitDays, timezone } = parseBackdateSettings(settings)
  const today = getCalendarDateInTimezone(new Date(), timezone)
  if (limitDays === 0) return today
  return addDaysToYmd(today, -limitDays)
}

export function getBackdateLimitHint(settings = {}) {
  const { limitDays } = parseBackdateSettings(settings)
  if (limitDays === 0) return 'Backdating is not allowed — today only'
  return `Transactions can be dated up to ${limitDays} days in the past`
}

export function isDateBeforeMin(dateStr, minDay) {
  if (!minDay || !dateStr) return false
  const day = String(dateStr).slice(0, 10)
  return day < minDay
}
