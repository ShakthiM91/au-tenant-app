import { ref, watch, toValue } from 'vue'

const MIN_PCT = 10
/** Treat as full-height sheet (breakpoints [0, 1]). */
const FULL_PCT_THRESHOLD = 99.5

function clampPercent(p) {
  const n = Number(p)
  if (!Number.isFinite(n)) return 85
  return Math.min(100, Math.max(MIN_PCT, n))
}

function applyHeight(breakpoints, initialBreakpoint, pct) {
  const p = clampPercent(pct)
  const ratio = Math.round((p / 100) * 1000) / 1000
  if (p >= FULL_PCT_THRESHOLD) {
    breakpoints.value = [0, 1]
    initialBreakpoint.value = 1
  } else {
    breakpoints.value = [0, ratio, 1]
    initialBreakpoint.value = ratio
  }
}

/**
 * ion-modal sheet with a fixed height as a percentage of the viewport (10–100).
 * Use 100 for a full-height sheet. No post-present measurement — one stable animation.
 *
 * @param {import('vue').MaybeRefOrGetter<boolean>} isOpenSource
 * @param {import('vue').MaybeRefOrGetter<number>} heightPercentSource Viewport height in percent (e.g. 72 for 72%).
 */
export function useIonSheetHeight(isOpenSource, heightPercentSource = 85) {
  const modalRef = ref(null)
  const breakpoints = ref([0, 0.85, 1])
  const initialBreakpoint = ref(0.85)

  applyHeight(breakpoints, initialBreakpoint, toValue(heightPercentSource))

  function sync() {
    applyHeight(breakpoints, initialBreakpoint, toValue(heightPercentSource))
  }

  watch(
    () => toValue(isOpenSource),
    (open) => {
      if (open) sync()
    },
    { flush: 'sync' }
  )

  watch(
    () => toValue(heightPercentSource),
    () => {
      if (toValue(isOpenSource)) sync()
    },
    { flush: 'sync' }
  )

  return {
    modalRef,
    breakpoints,
    initialBreakpoint
  }
}
