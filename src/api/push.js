import axios from 'axios'
import request from '@/utils/request'

const APP_TOKEN = import.meta.env.VITE_APP_TOKEN
const FCM_TOKEN_KEY = 'revo_fcm_web_token'

export function getStoredFcmToken() {
  return localStorage.getItem(FCM_TOKEN_KEY)
}

export function setStoredFcmToken(token) {
  if (token) localStorage.setItem(FCM_TOKEN_KEY, token)
  else localStorage.removeItem(FCM_TOKEN_KEY)
}

export async function fetchWebPushConfig() {
  if (!APP_TOKEN) return { enabled: false }
  const res = await axios.get('/api/push/web-config', {
    params: { app_token: APP_TOKEN }
  })
  return res.data?.data || { enabled: false }
}

export function registerPushDevice(payload) {
  return request({
    url: '/api/push/devices/register',
    method: 'post',
    data: payload
  })
}

export function unregisterPushDevice(token) {
  return request({
    url: `/api/push/devices/${encodeURIComponent(token)}`,
    method: 'delete',
    params: { app_token: APP_TOKEN }
  })
}
