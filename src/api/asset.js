import request from '@/utils/request'

export function getAssets(params) {
  return request({
    url: '/api/assets',
    method: 'get',
    params
  })
}

export function getAssetById(id) {
  return request({
    url: `/api/assets/${id}`,
    method: 'get'
  })
}

export function createAsset(data) {
  return request({
    url: '/api/assets',
    method: 'post',
    data
  })
}

export function updateAsset(id, data) {
  return request({
    url: `/api/assets/${id}`,
    method: 'put',
    data
  })
}

export function deleteAsset(id) {
  return request({
    url: `/api/assets/${id}`,
    method: 'delete'
  })
}

export function assignAsset(id, memberId, notes) {
  return request({
    url: `/api/assets/${id}/assign`,
    method: 'post',
    data: { member_id: memberId, notes }
  })
}

export function getAssetHistory(id) {
  return request({
    url: `/api/assets/${id}/history`,
    method: 'get'
  })
}

export function getAssetCategories() {
  return request({
    url: '/api/assets/categories',
    method: 'get'
  })
}

export function getAssetCategoryTree() {
  return request({
    url: '/api/assets/categories/tree',
    method: 'get'
  })
}

export function getAssetCategoryById(id) {
  return request({
    url: `/api/assets/categories/${id}`,
    method: 'get'
  })
}

export function createAssetCategory(data) {
  return request({
    url: '/api/assets/categories',
    method: 'post',
    data
  })
}

export function updateAssetCategory(id, data) {
  return request({
    url: `/api/assets/categories/${id}`,
    method: 'put',
    data
  })
}

export function deleteAssetCategory(id) {
  return request({
    url: `/api/assets/categories/${id}`,
    method: 'delete'
  })
}

export function toggleAssetCategoryActive(id, isActive) {
  return request({
    url: `/api/assets/categories/${id}/toggle-active`,
    method: 'patch',
    data: { is_active: isActive }
  })
}

export function getAllAssignmentHistory(params) {
  return request({
    url: '/api/assets/history',
    method: 'get',
    params
  })
}
