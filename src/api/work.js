import request from '@/utils/request'

// Dashboard
export function getDashboardSummary() {
  return request({
    url: '/api/work/dashboard/summary',
    method: 'get'
  })
}

export function getDashboardStats() {
  return request({
    url: '/api/work/dashboard/stats',
    method: 'get'
  })
}

// Projects
export function getProjects(params) {
  return request({
    url: '/api/work/projects',
    method: 'get',
    params
  })
}

export function getProjectById(id) {
  return request({
    url: `/api/work/projects/${id}`,
    method: 'get'
  })
}

export function createProject(data) {
  return request({
    url: '/api/work/projects',
    method: 'post',
    data
  })
}

export function updateProject(id, data) {
  return request({
    url: `/api/work/projects/${id}`,
    method: 'put',
    data
  })
}

export function deleteProject(id) {
  return request({
    url: `/api/work/projects/${id}`,
    method: 'delete'
  })
}

export function getProjectSummary(id) {
  return request({
    url: `/api/work/projects/${id}/summary`,
    method: 'get'
  })
}

export function getProjectOverview(id) {
  return request({
    url: `/api/work/projects/${id}/overview`,
    method: 'get'
  })
}

export function approveProject(id) {
  return request({
    url: `/api/work/projects/${id}/approve`,
    method: 'put'
  })
}

export function completeProject(id) {
  return request({
    url: `/api/work/projects/${id}/complete`,
    method: 'put'
  })
}

export function addAdditionalWork(id, data) {
  return request({
    url: `/api/work/projects/${id}/additional-work`,
    method: 'post',
    data
  })
}

// Quotes
export function getQuotes(projectId, params) {
  return request({
    url: `/api/work/projects/${projectId}/quotes`,
    method: 'get',
    params
  })
}

export function getQuoteById(projectId, quoteId) {
  return request({
    url: `/api/work/projects/${projectId}/quotes/${quoteId}`,
    method: 'get'
  })
}

export function compareQuotes(projectId) {
  return request({
    url: `/api/work/projects/${projectId}/quotes/compare`,
    method: 'get'
  })
}

export function createQuote(projectId, data) {
  return request({
    url: `/api/work/projects/${projectId}/quotes`,
    method: 'post',
    data
  })
}

export function updateQuote(projectId, quoteId, data) {
  return request({
    url: `/api/work/projects/${projectId}/quotes/${quoteId}`,
    method: 'put',
    data
  })
}

export function acceptQuote(projectId, quoteId) {
  return request({
    url: `/api/work/projects/${projectId}/quotes/${quoteId}/accept`,
    method: 'put'
  })
}

export function rejectQuote(projectId, quoteId) {
  return request({
    url: `/api/work/projects/${projectId}/quotes/${quoteId}/reject`,
    method: 'put'
  })
}

export function deleteQuote(projectId, quoteId) {
  return request({
    url: `/api/work/projects/${projectId}/quotes/${quoteId}`,
    method: 'delete'
  })
}

// Stages
export function getStages(projectId) {
  return request({
    url: `/api/work/projects/${projectId}/stages`,
    method: 'get'
  })
}

export function getStageById(projectId, stageId) {
  return request({
    url: `/api/work/projects/${projectId}/stages/${stageId}`,
    method: 'get'
  })
}

export function createStage(projectId, data) {
  return request({
    url: `/api/work/projects/${projectId}/stages`,
    method: 'post',
    data
  })
}

export function updateStage(projectId, stageId, data) {
  return request({
    url: `/api/work/projects/${projectId}/stages/${stageId}`,
    method: 'put',
    data
  })
}

export function startStage(projectId, stageId) {
  return request({
    url: `/api/work/projects/${projectId}/stages/${stageId}/start`,
    method: 'put'
  })
}

export function completeStage(projectId, stageId) {
  return request({
    url: `/api/work/projects/${projectId}/stages/${stageId}/complete`,
    method: 'put'
  })
}

export function approveStage(projectId, stageId) {
  return request({
    url: `/api/work/projects/${projectId}/stages/${stageId}/approve`,
    method: 'put'
  })
}

export function deleteStage(projectId, stageId) {
  return request({
    url: `/api/work/projects/${projectId}/stages/${stageId}`,
    method: 'delete'
  })
}

export function recordStageStartPayment(projectId, stageId, data) {
  return request({
    url: `/api/work/projects/${projectId}/stages/${stageId}/start-payment`,
    method: 'post',
    data
  })
}

export function recordStageEndPayment(projectId, stageId, data) {
  return request({
    url: `/api/work/projects/${projectId}/stages/${stageId}/end-payment`,
    method: 'post',
    data
  })
}

// Payments
export function getPayments(projectId) {
  return request({
    url: `/api/work/projects/${projectId}/payments`,
    method: 'get'
  })
}

export function getPaymentSummary(projectId) {
  return request({
    url: `/api/work/projects/${projectId}/payments/summary`,
    method: 'get'
  })
}

export function createPayment(projectId, data) {
  return request({
    url: `/api/work/projects/${projectId}/payments`,
    method: 'post',
    data
  })
}

export function updatePayment(projectId, paymentId, data) {
  return request({
    url: `/api/work/projects/${projectId}/payments/${paymentId}`,
    method: 'put',
    data
  })
}

export function deletePayment(projectId, paymentId) {
  return request({
    url: `/api/work/projects/${projectId}/payments/${paymentId}`,
    method: 'delete'
  })
}

// Audit
export function getProjectAuditLog(projectId, params) {
  return request({
    url: `/api/work/audit/projects/${projectId}`,
    method: 'get',
    params
  })
}

// Vendors
export function getVendors(params) {
  return request({
    url: '/api/work/vendors',
    method: 'get',
    params
  })
}

export function getVendorById(id) {
  return request({
    url: `/api/work/vendors/${id}`,
    method: 'get'
  })
}

export function createVendor(data) {
  return request({
    url: '/api/work/vendors',
    method: 'post',
    data
  })
}

export function updateVendor(id, data) {
  return request({
    url: `/api/work/vendors/${id}`,
    method: 'put',
    data
  })
}

export function deleteVendor(id) {
  return request({
    url: `/api/work/vendors/${id}`,
    method: 'delete'
  })
}

// Vendor Categories
export function getVendorCategories(params) {
  return request({
    url: '/api/work/vendor-categories',
    method: 'get',
    params
  })
}

export function getVendorCategoryById(id) {
  return request({
    url: `/api/work/vendor-categories/${id}`,
    method: 'get'
  })
}

export function createVendorCategory(data) {
  return request({
    url: '/api/work/vendor-categories',
    method: 'post',
    data
  })
}

export function updateVendorCategory(id, data) {
  return request({
    url: `/api/work/vendor-categories/${id}`,
    method: 'put',
    data
  })
}

export function deleteVendorCategory(id) {
  return request({
    url: `/api/work/vendor-categories/${id}`,
    method: 'delete'
  })
}
