import request from '@/utils/request'

export function getEvents(params) {
  return request({
    url: '/api/schedule/events',
    method: 'get',
    params
  })
}

export function getEventById(id) {
  return request({
    url: `/api/schedule/events/${id}`,
    method: 'get'
  })
}

export function createEvent(data) {
  return request({
    url: '/api/schedule/events',
    method: 'post',
    data
  })
}

export function updateEvent(id, data) {
  return request({
    url: `/api/schedule/events/${id}`,
    method: 'put',
    data
  })
}

export function deleteEvent(id) {
  return request({
    url: `/api/schedule/events/${id}`,
    method: 'delete'
  })
}

export function getUpcomingEvents(limit = 10) {
  return request({
    url: '/api/schedule/events/upcoming',
    method: 'get',
    params: { limit }
  })
}

export function getCalendarEvents(year, month) {
  return request({
    url: '/api/schedule/calendar',
    method: 'get',
    params: { year, month }
  })
}

export function setReminder(eventId, remindAt) {
  return request({
    url: `/api/schedule/events/${eventId}/reminders`,
    method: 'post',
    data: { remind_at: remindAt }
  })
}

export function getReminders() {
  return request({
    url: '/api/schedule/reminders',
    method: 'get'
  })
}
