import request from '@/utils/request'
import { getTenant } from '@/api/tenant'

let cachedBaseUrl = null

export async function getAttachmentBaseUrl() {
  if (cachedBaseUrl) return cachedBaseUrl
  try {
    const res = await getTenant()
    const tenant = res?.data ?? res
    if (tenant?.attachment_base_url) {
      cachedBaseUrl = tenant.attachment_base_url
      return cachedBaseUrl
    }
  } catch (_) {}
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  return `${base.replace(/\/$/, '')}/api/attachments/files`
}

export async function constructFileUrl(path) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const baseUrl = await getAttachmentBaseUrl()
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  const cleanPath = path.replace(/^\//, '')
  return `${cleanBaseUrl}/${cleanPath}`
}

export function uploadFile(file, options = {}) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', options.category || 'logos')
  if (options.type) formData.append('type', options.type)
  return request({
    url: '/api/attachments/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
