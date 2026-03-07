import request from '@/utils/request'
import { CACHE_KEYS } from '@/db/readCache'
import { getWithCache } from '@/utils/cacheFirst'

export function getCurrencies(params = {}) {
  return request({
    url: '/api/currencies',
    method: 'get',
    params
  })
}

export function getTenantCurrencies() {
  return getWithCache(CACHE_KEYS.CURRENCIES_TENANT, () =>
    request({
      url: '/api/currencies/tenant',
      method: 'get'
    })
  )
}

export function getTenantDefaultCurrency() {
  return getWithCache(CACHE_KEYS.DEFAULT_CURRENCY, () =>
    request({
      url: '/api/currencies/tenant/default',
      method: 'get'
    })
  )
}

export function enableCurrencyForTenant(data) {
  return request({
    url: '/api/currencies/tenant',
    method: 'post',
    data
  })
}

export function disableCurrencyForTenant(currencyId) {
  return request({
    url: `/api/currencies/tenant/${currencyId}`,
    method: 'delete'
  })
}

export function setDefaultCurrencyForTenant(currencyId) {
  return request({
    url: `/api/currencies/tenant/default/${currencyId}`,
    method: 'put'
  })
}

export function getExchangeRate(fromCurrency, toCurrency) {
  return request({
    url: `/api/currencies/exchange-rates/${fromCurrency}/${toCurrency}`,
    method: 'get'
  })
}
