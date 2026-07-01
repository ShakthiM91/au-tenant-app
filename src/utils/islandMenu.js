export function effectiveIslandPermissionScope(island) {
  if (island?.permission_scope) return island.permission_scope
  if (!island?.is_shared) {
    return {
      view: true,
      add_transaction: true,
      edit_transaction: true,
      reconcile: true,
      full_access: true,
      implicit_full: true
    }
  }
  return {
    view: false,
    add_transaction: false,
    edit_transaction: false,
    reconcile: false,
    full_access: false,
    implicit_full: false
  }
}

export function islandScopeAllowsView(scope) {
  return scope && !!scope.view
}

export function islandScopeAllowsAddTransaction(scope) {
  return scope && !!(scope.add_transaction || scope.full_access || scope.implicit_full)
}

export function islandScopeAllowsAddAccount(scope) {
  return scope && !!(scope.implicit_full || scope.full_access || scope.edit_transaction)
}

export function islandScopeAllowsManageCategories(scope) {
  return scope && !!(scope.implicit_full || scope.full_access || scope.edit_transaction)
}

export function buildIslandMenuItems(group) {
  const island = group?.island || {}
  const isDefault = island.id == null
  const isShared = !!island.is_shared
  const scope = effectiveIslandPermissionScope(island)
  const canShare = island.can_share_workspace === true
  const hideDelete = isDefault || !canShare
  const hideRename = isDefault || !canShare
  const hideShare = isShared || !canShare

  const showAddEntry = islandScopeAllowsAddTransaction(scope)
  const showTxLog = islandScopeAllowsView(scope)
  const showCategories = islandScopeAllowsManageCategories(scope)
  const showAddAccount = !isShared && islandScopeAllowsAddAccount(scope)

  const items = []
  if (showAddEntry) {
    items.push({ role: 'add-entry', label: 'Add a Transaction', destructive: false })
  }
  if (showAddAccount) {
    items.push({ role: 'add-account', label: 'Add Account', destructive: false })
  }
  if (showTxLog) {
    items.push({ role: 'transaction-log', label: 'Transaction Log', destructive: false })
  }
  if (showCategories) {
    items.push({ role: 'manage-categories', label: 'Manage Categories', destructive: false })
    items.push({ role: 'manage-budget', label: 'Manage Budget', destructive: false })
  }
  if (!hideRename) items.push({ role: 'rename', label: 'Rename Island', destructive: false })
  if (!hideShare) items.push({ role: 'share-access', label: 'Share Access', destructive: false })
  if (!hideDelete) items.push({ role: 'destructive', label: 'Delete Island', destructive: true })
  return items
}

export function formatIslandDisplayName(island) {
  const raw = String(island?.name ?? '').trim()
  if (!raw) return 'Island'
  return raw.endsWith('Island') ? raw : `${raw} Island`
}

export const ISLAND_POPOVER_RESERVE_BOTTOM_PX = 108
export const ISLAND_POPOVER_ITEM_ROW_PX = 46
export const ISLAND_POPOVER_VERTICAL_PAD_PX = 14
export const ISLAND_POPOVER_MAX_HEIGHT_PX = 320

export function estimatedIslandMenuPopoverHeightPx(itemCount) {
  if (itemCount < 1) return ISLAND_POPOVER_MAX_HEIGHT_PX
  return Math.min(
    itemCount * ISLAND_POPOVER_ITEM_ROW_PX + ISLAND_POPOVER_VERTICAL_PAD_PX,
    ISLAND_POPOVER_MAX_HEIGHT_PX
  )
}

export function islandMenuPopoverOpensUpward(triggerEl, itemCount) {
  if (!triggerEl?.getBoundingClientRect) return false
  const rect = triggerEl.getBoundingClientRect()
  const vh = window.visualViewport?.height ?? window.innerHeight
  const spaceBelow = vh - ISLAND_POPOVER_RESERVE_BOTTOM_PX - rect.bottom
  const spaceAbove = rect.top - 48
  const need = estimatedIslandMenuPopoverHeightPx(itemCount)
  if (spaceBelow >= need) return false
  return spaceAbove >= need || spaceAbove > spaceBelow
}
