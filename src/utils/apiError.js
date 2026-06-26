/** User-facing message from an axios/API error (e.g. overlap on activate). */
export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  const msg = error?.response?.data?.error
  if (typeof msg === 'string' && msg.trim()) return msg.trim()
  const generic = error?.message
  if (generic && !/^request failed with status code \d+$/i.test(generic)) {
    return generic
  }
  return fallback
}
