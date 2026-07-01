const REFERRAL_CODE_KEY = 'referralCode'

export function storeReferralCode(code) {
  const normalized = String(code ?? '').trim()
  if (!normalized) return
  try {
    sessionStorage.setItem(REFERRAL_CODE_KEY, normalized)
  } catch {
    /* ignore quota / private mode */
  }
}

export function getStoredReferralCode() {
  try {
    return sessionStorage.getItem(REFERRAL_CODE_KEY) || ''
  } catch {
    return ''
  }
}

export function clearStoredReferralCode() {
  try {
    sessionStorage.removeItem(REFERRAL_CODE_KEY)
  } catch {
    /* ignore */
  }
}
