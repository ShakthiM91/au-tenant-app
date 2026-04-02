export function maskEmail(email) {
  if (!email) return ''
  const [local, domain] = email.split('@')
  if (!domain) return email
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`
  return `${local.slice(0, 2)}***${local.slice(-2)}@${domain}`
}

/** e.g. +94 77******18 for LK numbers; otherwise masked with optional leading + */
export function maskPhone(phone) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) return phone
  const last = digits.slice(-2)
  if (digits.startsWith('94') && digits.length >= 10) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)}******${last}`
  }
  const headLen = Math.min(4, digits.length - 6)
  const head = digits.slice(0, headLen)
  if (phone.trim().startsWith('+')) {
    return `+${head} ******${last}`
  }
  return `${head}******${last}`
}

export function getAvatarInitials(displayName) {
  const n = (displayName || '').trim()
  const parts = n.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0]?.[0] || 'U').toUpperCase()
}

export const AVATAR_GRADIENT = 'linear-gradient(145deg, #f7b189 0%, #ffc299 100%)'
