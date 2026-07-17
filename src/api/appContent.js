import request from '@/utils/request'

export function fetchPublicAppContent(appToken) {
  return request({
    url: '/api/app-content/public',
    method: 'get',
    params: { app_token: appToken },
    skipAuthRefresh: true,
    silentError: true,
    skipErrorToast: true
  })
}

export function fetchAppContentMe() {
  return request({
    url: '/api/app-content/me',
    method: 'get',
    silentError: true,
    skipErrorToast: true
  })
}
