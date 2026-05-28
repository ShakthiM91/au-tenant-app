import request from '@/utils/request'

export function getOnboardingStatus() {
  return request({
    url: '/api/onboarding/me/status',
    method: 'get',
    skipQueue: true,
    skipErrorToast: true
  })
}

export function getOnboardingSurvey() {
  return request({
    url: '/api/onboarding/me/survey',
    method: 'get',
    skipQueue: true,
    skipErrorToast: true
  })
}

export function submitOnboardingResponse(data) {
  return request({
    url: '/api/onboarding/me/responses',
    method: 'post',
    data,
    skipQueue: true
  })
}
