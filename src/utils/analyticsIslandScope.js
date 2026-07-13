/** Island scope helpers for analytics drill-down (au-tenant-app). */

import { resolveAccountsForScope } from '@/composables/useAnalyticsChartsCore'

/** @param {'all' | 'null' | number} scope */
export function islandScopeQueryValue(scope) {
  if (scope === 'all') return 'all'
  if (scope === 'null') return 'null'
  if (typeof scope === 'number' && Number.isFinite(scope)) return String(scope)
  return 'all'
}

/** @param {import('vue-router').LocationQuery} query */
export function parseIslandScopeFromQuery(query) {
  const raw = query?.island_scope
  if (raw == null || raw === '' || raw === 'all') return 'all'
  if (raw === 'null') return 'null'
  const n = Number(raw)
  return Number.isFinite(n) ? n : 'all'
}

/** Build getTransactions params for the selected island scope. */
export function transactionParamsForIslandScope(scope) {
  const params = {}
  if (typeof scope === 'number') params.workspace_id = scope
  return params
}

/** Async variant — resolves account_ids for all/default scopes (matches analytics APIs). */
export async function buildTransactionParamsForIslandScope(scope) {
  if (typeof scope === 'number') {
    return { workspace_id: scope }
  }
  const { ids } = await resolveAccountsForScope(scope)
  if (ids.length) return { account_ids: ids.join(',') }
  return {}
}

/** @param {Record<string, string>} query */
export function appendIslandScopeQuery(query, scope) {
  query.island_scope = islandScopeQueryValue(scope)
}
