import request from '@/utils/request'

export function getMembers(params) {
  return request({
    url: '/api/members',
    method: 'get',
    params
  })
}

export function getMemberById(id) {
  return request({
    url: `/api/members/${id}`,
    method: 'get'
  })
}

export function createMember(data) {
  return request({
    url: '/api/members',
    method: 'post',
    data
  })
}

export function updateMember(id, data) {
  return request({
    url: `/api/members/${id}`,
    method: 'put',
    data
  })
}

export function deleteMember(id) {
  return request({
    url: `/api/members/${id}`,
    method: 'delete'
  })
}

export function getMemberStatistics() {
  return request({
    url: '/api/members/statistics',
    method: 'get'
  })
}
