import { getWorkspaces, getSharedWorkspaces } from '@/api/workspace'
import { getAccounts } from '@/api/accounting'

let cachedHasWorkspacesOrAccounts = null

export function clearWorkspaceAccountSurveyCache() {
  cachedHasWorkspacesOrAccounts = null
}

/**
 * True when the user already has at least one workspace (own or shared) or account.
 * Used to skip mandatory personalization survey for established users.
 */
export async function userHasWorkspacesOrAccounts(force = false) {
  if (!force && cachedHasWorkspacesOrAccounts !== null) {
    return cachedHasWorkspacesOrAccounts
  }

  try {
    const [ownRes, sharedRes, accountsRes] = await Promise.all([
      getWorkspaces().catch(() => null),
      getSharedWorkspaces().catch(() => null),
      getAccounts({ is_active: true }).catch(() => null)
    ])

    const ownWorkspaces = Array.isArray(ownRes?.data) ? ownRes.data : []
    const sharedWorkspaces = Array.isArray(sharedRes?.data?.active) ? sharedRes.data.active : []
    const accounts = Array.isArray(accountsRes?.data)
      ? accountsRes.data
      : Array.isArray(accountsRes)
        ? accountsRes
        : []

    cachedHasWorkspacesOrAccounts =
      ownWorkspaces.length > 0 || sharedWorkspaces.length > 0 || accounts.length > 0
    return cachedHasWorkspacesOrAccounts
  } catch {
    cachedHasWorkspacesOrAccounts = false
    return false
  }
}
