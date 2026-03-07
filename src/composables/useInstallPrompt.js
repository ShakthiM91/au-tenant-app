import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const DISMISS_KEY = 'pwa_install_dismissed_at'
const DISMISS_DAYS = 7

// Module-level: survives component unmounts
let deferredPromptRef = null

export function useInstallPrompt() {
  const route = useRoute()
  const isDismissed = ref(false)
  const hasDeferredPrompt = ref(false)

  const isStandalone = () =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || !!window.navigator?.standalone)

  const isMobile = () => {
    if (typeof navigator === 'undefined') return false
    return (
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0 && window.innerWidth < 1024)
    )
  }

  const isAndroid = () => /Android/i.test(navigator.userAgent || '')
  const isIos = () => /iPhone|iPad|iPod/i.test(navigator.userAgent || '')

  const wasDismissedRecently = () => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY)
      if (!raw) return false
      const ts = parseInt(raw, 10)
      if (Number.isNaN(ts)) return false
      const daysSince = (Date.now() - ts) / (24 * 60 * 60 * 1000)
      return daysSince < DISMISS_DAYS
    } catch {
      return false
    }
  }

  const canShowBanner = computed(() => {
    if (route.path === '/login') return false
    if (isStandalone()) return false
    if (!isMobile()) return false
    if (isDismissed.value) return false
    if (wasDismissedRecently()) return false
    // Android: show when we have native prompt OR as fallback (e.g. DevTools emulation where beforeinstallprompt never fires)
    if (isAndroid()) return true
    if (isIos()) return true
    return false
  })

  const hasNativePrompt = computed(() => isAndroid() && hasDeferredPrompt.value)

  const platform = computed(() => {
    if (isIos()) return 'ios'
    if (isAndroid()) return 'android'
    return null
  })

  function triggerInstall() {
    if (!deferredPromptRef) return
    deferredPromptRef.prompt()
    deferredPromptRef.userChoice.then(({ outcome }) => {
      if (outcome === 'accepted') {
        dismiss()
      }
    })
  }

  function dismiss() {
    isDismissed.value = true
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
  }

  function handleBeforeInstallPrompt(e) {
    e.preventDefault()
    deferredPromptRef = e
    hasDeferredPrompt.value = true
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    if (wasDismissedRecently()) isDismissed.value = true
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  })

  return {
    canShowBanner,
    hasNativePrompt,
    isIos: computed(() => isIos()),
    isAndroid: computed(() => isAndroid()),
    platform,
    triggerInstall,
    dismiss
  }
}
