import axios from 'axios'
import request from '@/utils/request'
import { getToken, getRefreshToken } from '@/utils/auth'

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000
})

export function refreshAccessToken(refreshToken) {
  return refreshClient
    .post('/api/auth/refresh', { refreshToken })
    .then((res) => {
      const data = res.data
      if (data.success === false) {
        return Promise.reject(new Error(data.error || 'Refresh failed'))
      }
      return data
    })
}

export function login(data) {
  return request({
    url: '/api/auth/login',
    method: 'post',
    data,
    skipQueue: true,
    skipAuthRefresh: true
  })
}

export function register(data) {
  return request({
    url: '/api/auth/register',
    method: 'post',
    data: { ...data, appToken: import.meta.env.VITE_APP_TOKEN },
    skipQueue: true,
    skipAuthRefresh: true
  })
}

export function verifyEmailOtp(data) {
  return request({
    url: '/api/auth/otp/verify',
    method: 'post',
    data,
    skipQueue: true,
    skipAuthRefresh: true
  })
}

export function resendEmailOtp(data) {
  return request({
    url: '/api/auth/otp/resend',
    method: 'post',
    data,
    skipQueue: true,
    skipAuthRefresh: true
  })
}

export function loginWithGoogle(data) {
  return request({
    url: '/api/auth/google',
    method: 'post',
    data: { ...data, appToken: import.meta.env.VITE_APP_TOKEN },
    skipQueue: true,
    skipAuthRefresh: true
  })
}

export function logout() {
  return request({
    url: '/api/auth/logout',
    method: 'post',
    data: {
      accessToken: getToken(),
      refreshToken: getRefreshToken()
    },
    skipQueue: true,
    skipAuthRefresh: true
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
