import { useRegisterSW } from 'virtual:pwa-register/vue'

/**
 * Single app-wide service worker registration (prompt for updates).
 * Call once from App.vue only.
 */
export function usePwaRegister() {
  return useRegisterSW({
    immediate: true
  })
}
