import request from '@/utils/request'

const NO_CACHE = {
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache'
  }
}

export function getMyReferralInfo() {
  return request({
    url: '/api/members/referrals/me',
    method: 'get',
    ...NO_CACHE
  })
}

export function getMyReferrals(params) {
  return request({
    url: '/api/members/referrals',
    method: 'get',
    params,
    ...NO_CACHE
  })
}

export function setMyInviter(code) {
  return request({
    url: '/api/members/referrals/inviter',
    method: 'post',
    data: { code }
  })
}
