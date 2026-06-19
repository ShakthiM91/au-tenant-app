import { getAccounts, getAccountsByWorkspace } from '@/api/accounting'
import { getWorkspaces, getSharedWorkspaces } from '@/api/workspace'

/** Soft-deleted workspaces must not appear in analytics scope. */
function isActiveWorkspace(ws) {
  return !!ws && (ws.deleted_at == null || ws.deleted_at === '')
}

function belongsToWorkspace(account, workspaceId) {
  return Number(account.workspace_id) === Number(workspaceId)
}

/**
 * Own + shared workspace accounts only (excludes default island).
 * Used for island_scope=all — must match a single workspace when only one is active.
 * @returns {Promise<{ ids: number[], accounts: object[] }>}
 */
export async function resolveWorkspaceIslandAccounts() {
  const byId = new Map()

  const addList = (list) => {
    if (!Array.isArray(list)) return
    for (const a of list) {
      if (a?.is_active === false) continue
      const wid = a.workspace_id
      if (wid == null || wid === '') continue
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

  const ownWorkspaces = (Array.isArray(ownResult?.data) ? ownResult.data : []).filter(isActiveWorkspace)
  const sharedWorkspaces = (Array.isArray(sharedResult?.data?.active) ? sharedResult.data.active : []).filter(
    isActiveWorkspace
  )
  const mainAccounts = Array.isArray(mainRes?.data) ? mainRes.data : []
  const activeWorkspaceIds = new Set([
    ...ownWorkspaces.map((ws) => Number(ws.id)),
    ...sharedWorkspaces.map((ws) => Number(ws.id)),
  ])

  const byWorkspace = (wid) => (a) => Number(a.workspace_id) === Number(wid)

  for (const ws of ownWorkspaces) {
    addList(mainAccounts.filter(byWorkspace(ws.id)))
  }

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

  const accounts = [...byId.values()]
    .filter((a) => activeWorkspaceIds.has(Number(a.workspace_id)))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  return { ids: accounts.map((a) => Number(a.id)), accounts }
}

/**
 * Default island only (workspace_id IS NULL).
 * @returns {Promise<{ ids: number[], accounts: object[] }>}
 */
export async function resolveDefaultIslandAccounts() {
  const mainRes = await getAccounts({ is_active: true }).catch(() => null)
  const mainAccounts = Array.isArray(mainRes?.data) ? mainRes.data : []
  const accounts = mainAccounts
    .filter((a) => a?.is_active !== false && (a.workspace_id == null || a.workspace_id === ''))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  return { ids: accounts.map((a) => Number(a.id)), accounts }
}

/** @deprecated Use resolveWorkspaceIslandAccounts or resolveAccountsForScope */
export async function resolveAccessibleAccounts() {
  const workspace = await resolveWorkspaceIslandAccounts()
  const defaults = await resolveDefaultIslandAccounts()
  const byId = new Map()
  for (const a of [...workspace.accounts, ...defaults.accounts]) {
    byId.set(Number(a.id), a)
  }
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
  if (scope === 'all') {
    return resolveWorkspaceIslandAccounts()
  }
  if (scope === 'null') {
    return resolveDefaultIslandAccounts()
  }
  const { accounts } = await resolveWorkspaceIslandAccounts()
  const filtered = accounts.filter((a) => belongsToWorkspace(a, scope))
  return { ids: filtered.map((a) => Number(a.id)), accounts: filtered }
}
