<template>
  <ion-page class="survey-processing-page">
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="processing-container">
        <div class="progress-section">
          <div class="progress-ring" aria-hidden="true">
            <svg class="progress-svg" viewBox="0 0 152 152">
              <circle class="progress-track" cx="76" cy="76" r="68" />
              <circle
                class="progress-arc"
                cx="76"
                cy="76"
                r="68"
                :style="arcStyle"
              />
            </svg>
            <span class="progress-value">{{ displayPercent }}%</span>
          </div>
        </div>

        <div class="status-section">
          <h1 class="status-title">{{ stage.title }}</h1>
          <p class="status-subtitle">{{ stage.subtitle }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { ONBOARDING_ROUTE } from '@/utils/onboardingSurvey/constants'

const RADIUS = 68
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const DONE_HOLD_MS = 3000

/** Progress segments: from% → to% over durationMs */
const SEGMENTS = [
  {
    from: 3,
    to: 38,
    durationMs: 6000,
    title: 'Processing...',
    subtitle: 'Analyzing your responses.',
  },
  {
    from: 38,
    to: 54,
    durationMs: 3000,
    title: 'Creating...',
    subtitle: 'Personalizing your experience.',
  },
  {
    from: 54,
    to: 88,
    durationMs: 6000,
    title: 'Finalizing...',
    subtitle: 'Adding final touches.',
  },
  {
    from: 88,
    to: 99,
    durationMs: 5000,
    title: 'Finalizing...',
    subtitle: 'Adding final touches.',
  },
]

const router = useRouter()
const progress = ref(SEGMENTS[0].from)
const segmentIndex = ref(0)
let rafId = null
let segmentStart = null
let doneTimeoutId = null

const displayPercent = computed(() => Math.round(progress.value))

const arcStyle = computed(() => ({
  strokeDasharray: `${CIRCUMFERENCE}`,
  strokeDashoffset: `${CIRCUMFERENCE * (1 - progress.value / 100)}`,
}))

const stage = computed(() => {
  if (progress.value >= 100) {
    return { title: 'All Done !', subtitle: '' }
  }
  const seg = SEGMENTS[segmentIndex.value] || SEGMENTS[SEGMENTS.length - 1]
  return { title: seg.title, subtitle: seg.subtitle }
})

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

function finishAndNavigate() {
  progress.value = 100
  doneTimeoutId = setTimeout(() => {
    router.replace(ONBOARDING_ROUTE)
  }, DONE_HOLD_MS)
}

function tick(now) {
  if (segmentStart == null) segmentStart = now

  const seg = SEGMENTS[segmentIndex.value]
  if (!seg) {
    finishAndNavigate()
    return
  }

  const elapsed = now - segmentStart
  const t = Math.min(elapsed / seg.durationMs, 1)
  progress.value = seg.from + (seg.to - seg.from) * easeInOutQuad(t)

  if (t < 1) {
    rafId = requestAnimationFrame(tick)
    return
  }

  progress.value = seg.to
  segmentIndex.value += 1
  segmentStart = now

  if (segmentIndex.value >= SEGMENTS.length) {
    finishAndNavigate()
    return
  }

  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  rafId = requestAnimationFrame(tick)
})

onUnmounted(() => {
  if (rafId != null) cancelAnimationFrame(rafId)
  if (doneTimeoutId != null) clearTimeout(doneTimeoutId)
})
</script>

<style scoped>
.survey-processing-page {
  --background: #ffffff;
}

.processing-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-sizing: border-box;
  background: #ffffff;
}

.progress-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.progress-ring {
  position: relative;
  width: 152px;
  height: 152px;
  filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.08));
}

.progress-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-track,
.progress-arc {
  fill: none;
  stroke-width: 10;
  stroke-linecap: round;
}

.progress-track {
  stroke: #ececec;
}

.progress-arc {
  stroke: #ff8d28;
  transition: stroke-dashoffset 0.05s linear;
}

.progress-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  color: #ff8d28;
  letter-spacing: -0.02em;
}

.status-section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-bottom: 120px;
  text-align: center;
}

.status-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.72);
}

.status-subtitle {
  margin: 0;
  min-height: calc(14px * 1.4);
  font-size: 14px;
  font-weight: 400;
  color: #6e6a7c;
  line-height: 1.4;
}
</style>
