export async function resolveContentImage(raw, fallback = null) {
  if (raw == null || raw === '') return fallback

  if (typeof raw === 'string') {
    if (raw.startsWith('/') || raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
      return raw
    }
    const base = import.meta.env.VITE_API_BASE_URL || ''
    return `${base.replace(/\/$/, '')}/api/attachments/files/${raw.replace(/^\//, '')}`
  }

  if (typeof raw === 'object') {
    if (raw.source === 'base64' || raw.source === 'url') {
      return raw.value || fallback
    }
    if (raw.value) {
      if (raw.source === 'path' || !raw.source) {
        const base = import.meta.env.VITE_API_BASE_URL || ''
        return `${base.replace(/\/$/, '')}/api/attachments/files/${String(raw.value).replace(/^\//, '')}`
      }
      return raw.value
    }
  }

  return fallback
}
