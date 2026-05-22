/**
 * iOS standalone PWA and Capacitor iOS: 100dvh / innerHeight are often shorter than the
 * physical screen, leaving a gap below fixed footers (tab bar).
 */

const ROOT_CLASS = 'au-ios-standalone'

function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalonePwa() {
  if (typeof window === 'undefined') return false
  if (window.navigator.standalone === true) return true
  try {
    return window.matchMedia('(display-mode: standalone)').matches
  } catch {
    return false
  }
}

function isCapacitorIos() {
  try {
    const cap = window.Capacitor
    return cap?.isNativePlatform?.() && cap.getPlatform?.() === 'ios'
  } catch {
    return false
  }
}

export function isIosStandaloneOrNative() {
  if (!isIosDevice()) return false
  return isStandalonePwa() || isCapacitorIos()
}

function applyAppHeight(root, value) {
  root.style.setProperty('--au-app-height', value)
}

function syncKeyboardViewport(root) {
  const vv = window.visualViewport
  if (!vv) return
  const keyboardLikelyOpen = vv.height < window.innerHeight * 0.75
  if (keyboardLikelyOpen) {
    applyAppHeight(root, `${Math.round(vv.height)}px`)
  } else {
    applyAppHeight(root, '100vh')
  }
}

/** Call once before app mount. */
export function installIosViewportFix() {
  if (typeof document === 'undefined' || !isIosStandaloneOrNative()) return

  const root = document.documentElement
  root.classList.add(ROOT_CLASS)
  applyAppHeight(root, '100vh')

  if (window.visualViewport) {
    const onViewportChange = () => syncKeyboardViewport(root)
    window.visualViewport.addEventListener('resize', onViewportChange)
    window.visualViewport.addEventListener('scroll', onViewportChange)
  }
}
