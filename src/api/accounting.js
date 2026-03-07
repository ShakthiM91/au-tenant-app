import request from '@/utils/request'
import { CACHE_KEYS } from '@/db/readCache'
import { getWithCache } from '@/utils/cacheFirst'

export function getTransactions(params) {
  return request({
    url: '/api/accounting/transactions',
    method: 'get',
    params
  })
}

export function getCategories(type = null) {
  const params = type ? { type } : {}
  return request({
    url: '/api/accounting/categories',
    method: 'get',
    params
  })
}

export function getCategoryTree(type = null) {
  const params = type ? { type } : {}
  const cacheKey = CACHE_KEYS.CATEGORY_TREE(type)
  return getWithCache(cacheKey, () =>
    request({
      url: '/api/accounting/categories/tree',
      method: 'get',
      params
    })
  )
}

export function getDefaultCategories(type = null) {
  const params = type ? { type } : {}
  return request({
    url: '/api/accounting/categories/defaults',
    method: 'get',
    params
  })
}

export function getCategoryById(id) {
  return request({
    url: `/api/accounting/categories/${id}`,
    method: 'get'
  })
}

export function createCategory(data) {
  return request({
    url: '/api/accounting/categories',
    method: 'post',
    data
  })
}

export function updateCategory(id, data) {
  return request({
    url: `/api/accounting/categories/${id}`,
    method: 'put',
    data
  })
}

export function deleteCategory(id) {
  return request({
    url: `/api/accounting/categories/${id}`,
    method: 'delete'
  })
}

export function toggleCategoryActive(id, isActive) {
  return request({
    url: `/api/accounting/categories/${id}/toggle-active`,
    method: 'put',
    data: { is_active: isActive }
  })
}

export function getTransactionById(id) {
  return request({
    url: `/api/accounting/transactions/${id}`,
    method: 'get'
  })
}

export function createTransaction(data) {
  return request({
    url: '/api/accounting/transactions',
    method: 'post',
    data
  })
}

export function updateTransaction(id, data) {
  return request({
    url: `/api/accounting/transactions/${id}`,
    method: 'put',
    data
  })
}

export function deleteTransaction(id) {
  return request({
    url: `/api/accounting/transactions/${id}`,
    method: 'delete'
  })
}

export function getSummary() {
  return request({
    url: '/api/accounting/summary',
    method: 'get'
  })
}

export function getReports(params) {
  return request({
    url: '/api/accounting/reports',
    method: 'get',
    params
  })
}

export function getCategoryBreakdown(params) {
  return request({
    url: '/api/accounting/category-breakdown',
    method: 'get',
    params
  })
}

// Accounts API
export function getAccounts(filters = {}) {
  const cacheKey =
    filters && filters.is_active === true ? CACHE_KEYS.ACCOUNTS_ACTIVE : CACHE_KEYS.ACCOUNTS
  return getWithCache(cacheKey, () =>
    request({
      url: '/api/accounting/accounts',
      method: 'get',
      params: filters
    })
  )
}

export function getAccountById(id) {
  return request({
    url: `/api/accounting/accounts/${id}`,
    method: 'get'
  })
}

export function createAccount(data) {
  return request({
    url: '/api/accounting/accounts',
    method: 'post',
    data
  })
}

export function updateAccount(id, data) {
  return request({
    url: `/api/accounting/accounts/${id}`,
    method: 'put',
    data
  })
}

export function deleteAccount(id) {
  return request({
    url: `/api/accounting/accounts/${id}`,
    method: 'delete'
  })
}

export function getAccountBalance(id) {
  return request({
    url: `/api/accounting/accounts/${id}/balance`,
    method: 'get'
  })
}

export function getRepaymentSchedules(accountId) {
  return request({
    url: `/api/accounting/accounts/${accountId}/repayment-schedules`,
    method: 'get'
  })
}

export function createRepaymentSchedule(accountId, data) {
  return request({
    url: `/api/accounting/accounts/${accountId}/repayment-schedules`,
    method: 'post',
    data
  })
}

export function updateRepaymentSchedule(accountId, scheduleId, data) {
  return request({
    url: `/api/accounting/accounts/${accountId}/repayment-schedules/${scheduleId}`,
    method: 'put',
    data
  })
}

export function deleteRepaymentSchedule(accountId, scheduleId) {
  return request({
    url: `/api/accounting/accounts/${accountId}/repayment-schedules/${scheduleId}`,
    method: 'delete'
  })
}

export function getDueRepayments(date = null) {
  const params = date ? { date } : {}
  return request({
    url: '/api/accounting/accounts/repayments/due',
    method: 'get',
    params
  })
}

export function getAccountFlowLog(accountId, params = {}) {
  return request({
    url: `/api/accounting/accounts/${accountId}/flow-log`,
    method: 'get',
    params
  })
}

export function getAccountFlowSummary(accountId, params = {}) {
  return request({
    url: `/api/accounting/accounts/${accountId}/flow-summary`,
    method: 'get',
    params
  })
}

export function getPrimaryAccount() {
  return getWithCache(CACHE_KEYS.PRIMARY_ACCOUNT, () =>
    request({
      url: '/api/accounting/primary-account',
      method: 'get'
    })
  )
}

export function setPrimaryAccount(accountId) {
  return request({
    url: '/api/accounting/primary-account',
    method: 'put',
    data: { account_id: accountId }
  })
}

// Budgets API
export function getBudgets(params = {}) {
  return request({ url: '/api/accounting/budgets', method: 'get', params })
}
export function getOngoingBudget() {
  return request({ url: '/api/accounting/budgets/ongoing', method: 'get' })
}

export function getBudgetContext(params) {
  return request({ url: '/api/accounting/budgets/context', method: 'get', params })
}
export function getBudgetById(id) {
  return request({ url: `/api/accounting/budgets/${id}`, method: 'get' })
}
export function getBudgetLog(id) {
  return request({ url: `/api/accounting/budgets/${id}/log`, method: 'get' })
}
export function getBudgetCategoryBreakdown(id, params) {
  return request({ url: `/api/accounting/budgets/${id}/category-breakdown`, method: 'get', params })
}
export function createBudget(data) {
  return request({ url: '/api/accounting/budgets', method: 'post', data })
}
export function updateBudget(id, data) {
  return request({ url: `/api/accounting/budgets/${id}`, method: 'put', data })
}
export function abandonBudget(id) {
  return request({ url: `/api/accounting/budgets/${id}/abandon`, method: 'patch' })
}
export function activateBudget(id) {
  return request({ url: `/api/accounting/budgets/${id}/activate`, method: 'patch' })
}
export function deleteBudget(id) {
  return request({ url: `/api/accounting/budgets/${id}`, method: 'delete' })
}
export function getBudgetPeriods(id) {
  return request({ url: `/api/accounting/budgets/${id}/periods`, method: 'get' })
}
export function getBudgetPeriodReport(id, periodIndex) {
  return request({ url: `/api/accounting/budgets/${id}/report/period/${periodIndex}`, method: 'get' })
}
export function getBudgetFullReport(id) {
  return request({ url: `/api/accounting/budgets/${id}/report/full`, method: 'get' })
}
export function getBudgetDashboardSummary(id) {
  return request({ url: `/api/accounting/budgets/${id}/dashboard-summary`, method: 'get' })
}
