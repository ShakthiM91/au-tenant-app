import { ref } from 'vue'
import { getTenantDefaultCurrency } from '@/api/currency'
import { useUserStore } from '@/store/user'

/** Resolve and format amounts using the tenant/user default currency. */
export function useAppCurrency() {
  const currencyCode = ref('USD')

  async function loadCurrencyCode() {
    const userStore = useUserStore()
    const userCode = userStore.defaultCurrencyCode
    if (userCode) {
      currencyCode.value = String(userCode).toUpperCase()
      return currencyCode.value
    }
    try {
      const res = await getTenantDefaultCurrency()
      const c = res?.data?.data ?? res?.data ?? res
      if (c?.code) {
        currencyCode.value = String(c.code).toUpperCase()
      }
    } catch {
      /* keep fallback */
    }
    return currencyCode.value
  }

  function formatCurrency(value, code) {
    const cur = (code || currencyCode.value || 'USD').toUpperCase()
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: cur,
        maximumFractionDigits: 2,
      }).format(Number(value) || 0)
    } catch {
      return `${cur} ${Number(value) || 0}`
    }
  }

  return { currencyCode, loadCurrencyCode, formatCurrency }
}
