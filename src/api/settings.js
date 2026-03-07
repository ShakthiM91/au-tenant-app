import request from '@/utils/request'

export function getSettings() {
  return request({
    url: '/api/settings',
    method: 'get'
  })
}

export function updateSettings(data) {
  return request({
    url: '/api/settings',
    method: 'put',
    data
  })
}

// Tenant-specific settings (tenant id from token, same as tenant-admin)
export function getTenantSettings() {
  return request({
    url: '/api/tenants/me',
    method: 'get'
  })
}

export function updateTenantSettings(data) {
  return request({
    url: '/api/tenants/me',
    method: 'put',
    data
  })
}
