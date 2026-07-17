import { getCached, setCached, CACHE_KEYS } from '@/db/readCache'
import { fetchPublicAppContent, fetchAppContentMe } from '@/api/appContent'
import { useAppContentStore } from '@/store/appContent'
import { getToken } from '@/utils/auth'

const APP_TOKEN = import.meta.env.VITE_APP_TOKEN

export async function loadAppContent() {
  const store = useAppContentStore()
  const cached = await getCached(CACHE_KEYS.APP_CONTENT)
  if (cached?.data) {
    store.setContent(cached.data)
  }
}

export async function refreshAppContent() {
  if (!APP_TOKEN && !getToken()) return

  try {
    const token = getToken()
    const res = token ? await fetchAppContentMe() : await fetchPublicAppContent(APP_TOKEN)
    const data = res?.data ?? res
    if (!data) return

    const store = useAppContentStore()
    store.setContent(data)
    await setCached(CACHE_KEYS.APP_CONTENT, data)
  } catch (error) {
    console.warn('App content refresh failed', error)
  }
}
