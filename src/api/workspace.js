import request from '@/utils/request'

/**
 * Get own workspaces (islands).
 * In au-tenant-app, workspace is referred to as "island" in the UI.
 */
export function getWorkspaces() {
  return request({
    url: '/api/accounting/workspaces',
    method: 'get'
  })
}

/**
 * Get shared workspaces (islands) the user has access to.
 */
export function getSharedWorkspaces() {
  return request({
    url: '/api/accounting/workspaces/shared',
    method: 'get'
  })
}
