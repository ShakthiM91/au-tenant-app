import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppContentStore = defineStore('appContent', () => {
  const fields = ref({})
  const version = ref(0)
  const loaded = ref(false)

  function setContent(payload) {
    fields.value = payload?.fields || {}
    version.value = payload?.version || 0
    loaded.value = true
  }

  function getField(key, fallback = '') {
    const value = fields.value[key]
    return value != null && value !== '' ? value : fallback
  }

  return {
    fields,
    version,
    loaded,
    setContent,
    getField
  }
})
