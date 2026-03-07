import request from '@/utils/request'

export function getRoles() {
  return request({
    url: '/api/roles',
    method: 'get'
  })
}

export function getRoleById(id) {
  return request({
    url: `/api/roles/${id}`,
    method: 'get'
  })
}

export function createRole(data) {
  return request({
    url: '/api/roles',
    method: 'post',
    data
  })
}

export function updateRole(id, data) {
  return request({
    url: `/api/roles/${id}`,
    method: 'put',
    data
  })
}

export function deleteRole(id) {
  return request({
    url: `/api/roles/${id}`,
    method: 'delete'
  })
}

export function assignMenus(roleId, menuIds) {
  return request({
    url: `/api/roles/${roleId}/menus`,
    method: 'post',
    data: { menuIds }
  })
}

export function assignPermissions(roleId, permissionIds) {
  return request({
    url: `/api/roles/${roleId}/permissions`,
    method: 'post',
    data: { permissionIds }
  })
}

export function getRoleMenus(roleId) {
  return request({
    url: `/api/roles/${roleId}/menus`,
    method: 'get'
  })
}

export function getRolePermissions(roleId) {
  return request({
    url: `/api/roles/${roleId}/permissions`,
    method: 'get'
  })
}

export function assignRoleToUser(userId, roleId) {
  return request({
    url: `/api/roles/users/${userId}/role`,
    method: 'post',
    data: { roleId }
  })
}
