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

/**
 * Create a new workspace (island).
 */
export function createWorkspace(data) {
  return request({
    url: '/api/accounting/workspaces',
    method: 'post',
    data
  })
}

/**
 * Update a workspace (island).
 */
export function updateWorkspace(id, data) {
  return request({
    url: `/api/accounting/workspaces/${id}`,
    method: 'put',
    data
  })
}

/**
 * Delete a workspace (island). Backend soft-deletes when supported.
 */
export function deleteWorkspace(id) {
  return request({
    url: `/api/accounting/workspaces/${id}`,
    method: 'delete'
  })
}

export function getWorkspaceMembers(id) {
  return request({
    url: `/api/accounting/workspaces/${id}/members`,
    method: 'get'
  })
}

export function inviteWorkspaceMember(id, data) {
  return request({
    url: `/api/accounting/workspaces/${id}/members`,
    method: 'post',
    data
  })
}

export function updateWorkspaceMember(id, memberId, data) {
  return request({
    url: `/api/accounting/workspaces/${id}/members/${memberId}`,
    method: 'put',
    data
  })
}

export function removeWorkspaceMember(id, memberId) {
  return request({
    url: `/api/accounting/workspaces/${id}/members/${memberId}`,
    method: 'delete'
  })
}

export function searchWorkspaceUsers(id, email) {
  return request({
    url: `/api/accounting/workspaces/${id}/users/search`,
    method: 'get',
    params: { email }
  })
}
