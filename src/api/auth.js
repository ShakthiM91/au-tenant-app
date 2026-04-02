import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/api/auth/login',
    method: 'post',
    data,
    skipQueue: true
  })
}

export function register(data) {
  return request({
    url: '/api/auth/register',
    method: 'post',
    data: { ...data, appToken: import.meta.env.VITE_APP_TOKEN },
    skipQueue: true
  })
}

export function logout() {
  return request({
    url: '/api/auth/logout',
    method: 'post',
    skipQueue: true
  })
}

export function getInfo() {
  return request({
    url: '/api/auth/me',
    method: 'get',
    skipQueue: true
  })
}

export function updateProfile(data) {
  return request({
    url: '/api/auth/profile',
    method: 'put',
    data,
    skipQueue: true
  })
}

export function changePassword(data) {
  return request({
    url: '/api/auth/password',
    method: 'put',
    data,
    skipQueue: true
  })
}

export function getMyPermissions() {
  return request({
    url: '/api/auth/my-permissions',
    method: 'get',
    skipQueue: true
  })
}
