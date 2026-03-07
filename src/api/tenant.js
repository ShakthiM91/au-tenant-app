import request from '@/utils/request'

/**
 * Get current user's tenant (id from token).
 * Use /api/tenants/me — GET /api/tenants/:id is super_admin only.
 */
export function getTenant() {
  return request({
    url: '/api/tenants/me',
    method: 'get'
  })
}

/**
 * Update current user's tenant (id from token).
 */
export function updateTenant(data) {
  return request({
    url: '/api/tenants/me',
    method: 'put',
    data
  })
}

export function createTenantMemberUser(tenantId, data) {
  return request({
    url: `/api/tenants/${tenantId}/member-users`,
    method: 'post',
    data
  })
}
