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
          <p v-if="stage.subtitle" class="status-subtitle">{{ stage.subtitle }}</p>
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

const DURATION_MS = 5000
const RADIUS = 68
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const router = useRouter()
const progress = ref(0)
let rafId = null
let startTime = null

const displayPercent = computed(() => Math.round(progress.value))

const arcStyle = computed(() => ({
  strokeDasharray: `${CIRCUMFERENCE}`,
  strokeDashoffset: `${CIRCUMFERENCE * (1 - progress.value / 100)}`
}))

const stage = computed(() => {
  const p = displayPercent.value
  if (p >= 100) {
    return { title: 'All Done !', subtitle: '' }
  }
  if (p >= 55) {
    return { title: 'Finalizing...', subtitle: 'Adding final touches.' }
  }
  if (p >= 39) {
    return { title: 'Creating...', subtitle: 'Personalizing your experience.' }
  }
  return { title: 'Processing...', subtitle: 'Analyzing your responces.' }
})

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

function tick(now) {
  if (startTime == null) startTime = now
  const elapsed = now - startTime
  const t = Math.min(elapsed / DURATION_MS, 1)
  progress.value = easeOutCubic(t) * 100

  if (t < 1) {
    rafId = requestAnimationFrame(tick)
    return
  }

  progress.value = 100
  setTimeout(() => {
    router.replace(ONBOARDING_ROUTE)
  }, 1000)
}

onMounted(() => {
  rafId = requestAnimationFrame(tick)
})

onUnmounted(() => {
  if (rafId != null) cancelAnimationFrame(rafId)
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
  font-size: 14px;
  font-weight: 400;
  color: #6e6a7c;
  line-height: 1.4;
}
</style>
