import request from '@/utils/request'

export function getMyReferralInfo() {
  return request({
    url: '/api/members/referrals/me',
    method: 'get'
  })
}

export function getMyReferrals(params) {
  return request({
    url: '/api/members/referrals',
    method: 'get',
    params
  })
}

export function setMyInviter(code) {
  return request({
    url: '/api/members/referrals/inviter',
    method: 'post',
    data: { code }
  })
}
