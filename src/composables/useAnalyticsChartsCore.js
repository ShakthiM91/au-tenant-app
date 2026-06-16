import { getAccounts, getAccountsByWorkspace } from '@/api/accounting'
import { getWorkspaces, getSharedWorkspaces } from '@/api/workspace'

/**
 * Same union as Accounts: own workspaces + default accounts from main list + per-shared-workspace fetch.
 * @returns {Promise<{ ids: number[], accounts: object[] }>}
 */
export async function resolveAccessibleAccounts() {
  const byId = new Map()

  const addList = (list) => {
    if (!Array.isArray(list)) return
    for (const a of list) {
      if (a?.is_active === false) continue
      const id = Number(a.id)
      if (Number.isNaN(id)) continue
      if (!byId.has(id)) byId.set(id, a)
    }
  }

  const [ownResult, sharedResult, mainRes] = await Promise.all([
    getWorkspaces().catch(() => null),
    getSharedWorkspaces().catch(() => null),
    getAccounts({ is_active: true }).catch(() => null),
  ])

  const ownWorkspaces = Array.isArray(ownResult?.data) ? ownResult.data : []
  const sharedWorkspaces = Array.isArray(sharedResult?.data?.active) ? sharedResult.data.active : []
  const mainAccounts = Array.isArray(mainRes?.data) ? mainRes.data : []

  const byWorkspace = (wid) => (a) => (a.workspace_id ?? null) === (wid ?? null)

  for (const ws of ownWorkspaces) {
    addList(mainAccounts.filter(byWorkspace(ws.id)))
  }
  addList(mainAccounts.filter(byWorkspace(null)))

  await Promise.all(
    sharedWorkspaces.map(async (ws) => {
      try {
        const r = await getAccountsByWorkspace(ws.id, { is_active: true })
        addList(Array.isArray(r?.data) ? r.data : [])
      } catch {
        /* skip */
      }
    })
  )

  const accounts = [...byId.values()].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''))
  )
  return { ids: accounts.map((a) => Number(a.id)), accounts }
}

/**
 * @param {'all' | 'null' | number} scope
 * @returns {Promise<{ ids: number[], accounts: object[] }>}
 */
export async function resolveAccountsForScope(scope) {
  const { accounts } = await resolveAccessibleAccounts()
  if (scope === 'all') {
    return { ids: accounts.map((a) => Number(a.id)), accounts }
  }
  if (scope === 'null') {
    const filtered = accounts.filter((a) => a.workspace_id == null || a.workspace_id === '')
    return { ids: filtered.map((a) => Number(a.id)), accounts: filtered }
  }
  const wid = Number(scope)
  const filtered = accounts.filter((a) => Number(a.workspace_id) === wid)
  return { ids: filtered.map((a) => Number(a.id)), accounts: filtered }
}
