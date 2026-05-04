/**
 * Display label for transaction / flow-log author: first name only, or "Me" for the current user.
 */

function parseId(v) {
  if (v == null || v === '') return NaN
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

export function firstNameOnly(fullName) {
  const s = (fullName || '').toString().trim()
  if (!s) return ''
  const parts = s.split(/\s+/).filter(Boolean)
  return parts[0] || ''
}

/**
 * @param {object | null | undefined} row
 * @param {number | string | null | undefined} currentUserId
 */
export function formatTransactionAuthorLabel(row, currentUserId) {
  if (row?._pending) return 'Me'

  const uid = parseId(currentUserId)
  const createdBy = parseId(row?.created_by)
  if (Number.isFinite(uid) && Number.isFinite(createdBy) && uid === createdBy) {
    return 'Me'
  }

  const full = row?.created_by_name || row?.user_name || ''
  const first = firstNameOnly(full)
  if (first) return first

  return '—'
}

/**
 * "Last edited" line — same first-name / Me rules when `updated_by` is present.
 */
export function formatTransactionEditorLabel(row, currentUserId) {
  const uid = parseId(currentUserId)
  const updatedBy = parseId(row?.updated_by)
  if (Number.isFinite(uid) && Number.isFinite(updatedBy) && uid === updatedBy) {
    return 'Me'
  }
  const first = firstNameOnly(row?.updated_by_name || '')
  return first || '—'
}

export function transactionHasCreatedAudit(row) {
  if (!row) return false
  return !!(row.created_by_name || row.created_by != null || row._pending)
}
